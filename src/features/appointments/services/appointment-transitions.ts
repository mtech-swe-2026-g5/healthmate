import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { scheduleAppointmentNotifications } from "@/features/notifications";

import {
  buildCutoffMessage,
  getCancellationCutoffHours,
  hasCancellationCutoffPassed,
} from "../lib/cancellation-window";
import { rescheduleAppointmentSchema } from "../types";
import type { RescheduleAppointmentInput } from "../types";
import {
  appointmentDetailSelect,
  assertPatientRole,
  getPatientIdForUser,
  serializeAppointment,
} from "./appointments";
import { combineDateAndTime, generateSlots } from "./slots";

/** The slot an appointment currently occupies, plus what it takes to change it. */
type ChangeableAppointment = {
  id: string;
  doctorId: string;
  startsAt: Date;
  endsAt: Date;
};

const CONCURRENT_CHANGE_MESSAGE =
  "This appointment was changed by another request. Reload and try again.";

/**
 * Loads an appointment the patient is allowed to cancel or reschedule.
 * Rejects appointments they do not own, already-cancelled ones, and any that
 * fall inside the cut-off window.
 *
 * @param appointmentId - Appointment being changed
 * @param patientId - Owner the session resolves to
 * @returns The appointment's current slot
 */
async function loadChangeableAppointment(
  appointmentId: string,
  patientId: string,
): Promise<ChangeableAppointment> {
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientId },
    select: {
      id: true,
      doctorId: true,
      startsAt: true,
      endsAt: true,
      status: true,
    },
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }
  if (appointment.status === "CANCELLED") {
    throw new AppError("Appointment is already cancelled", 409);
  }

  const cutoffHours = getCancellationCutoffHours();
  if (hasCancellationCutoffPassed(appointment.startsAt, cutoffHours)) {
    throw new AppError(buildCutoffMessage(cutoffHours), 400);
  }

  return {
    id: appointment.id,
    doctorId: appointment.doctorId,
    startsAt: appointment.startsAt,
    endsAt: appointment.endsAt,
  };
}

/**
 * Maps the two conflict codes a guarded transition can raise onto API errors.
 * `P2025` means the optimistic guard matched no row — someone else cancelled or
 * moved the appointment first. `P2002` means the partial unique index rejected
 * the target slot — someone else booked it first.
 */
function toTransitionError(error: unknown): unknown {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return new AppError(CONCURRENT_CHANGE_MESSAGE, 409);
    }
    if (error.code === "P2002") {
      return new AppError("Slot already booked", 409);
    }
  }
  return error;
}

/**
 * Cancels a confirmed appointment owned by the patient.
 *
 * The row is never deleted: status flips to `CANCELLED` and an audit row is
 * written in the same transaction. Because the double-booking index only covers
 * `CONFIRMED` rows, the slot becomes bookable again the moment this commits.
 *
 * @param userId - Authenticated user id
 * @param userRole - Session role; must be `patient`
 * @param appointmentId - Appointment to cancel
 * @returns The cancelled appointment
 */
export async function cancelAppointment(
  userId: string,
  userRole: string | undefined,
  appointmentId: string,
) {
  assertPatientRole(userRole);
  const patientId = await getPatientIdForUser(userId);
  const appointment = await loadChangeableAppointment(appointmentId, patientId);

  let cancelled;
  try {
    cancelled = await prisma.$transaction(async (tx) => {
      // Optimistic guard: the extra `where` fields are the version check, so a
      // concurrent cancel or reschedule makes this raise P2025 instead of
      // overwriting the other request's outcome.
      const updated = await tx.appointment.update({
        where: {
          id: appointment.id,
          status: "CONFIRMED",
          startsAt: appointment.startsAt,
        },
        data: { status: "CANCELLED", cancelledAt: new Date() },
        select: appointmentDetailSelect,
      });

      await tx.appointmentHistory.create({
        data: {
          appointmentId: appointment.id,
          event: "CANCELLED",
          previousStartsAt: appointment.startsAt,
          previousEndsAt: appointment.endsAt,
          changedByUserId: userId,
          changedByRole: "patient",
        },
      });

      return updated;
    });
  } catch (error) {
    throw toTransitionError(error);
  }

  // Tied to the committed CANCELLED state; delivery runs after the response.
  scheduleAppointmentNotifications("appointment.cancelled", appointment.id, {
    cancelledBy: "patient",
  });

  return serializeAppointment(cancelled);
}

/**
 * Validates a requested new slot against the doctor's derived schedule.
 *
 * @param appointment - Appointment being moved
 * @param input - Requested date and start time
 * @returns The new slot boundaries
 */
async function resolveNewSlot(
  appointment: ChangeableAppointment,
  input: RescheduleAppointmentInput,
): Promise<{ startsAt: Date; endsAt: Date }> {
  const startsAt = combineDateAndTime(input.date, input.startTime);

  if (startsAt.getTime() === appointment.startsAt.getTime()) {
    throw new AppError("Appointment is already scheduled for this time", 400);
  }

  const slots = await generateSlots(appointment.doctorId, input.date);
  const slot = slots.find((s) => s.startTime === input.startTime);

  if (!slot) {
    throw new AppError("Invalid time slot for selected date", 400);
  }
  if (slot.status === "booked") {
    throw new AppError("Slot already booked", 409);
  }
  if (slot.status !== "available") {
    throw new AppError("Slot is not available", 400);
  }

  // Clinic hours never cross midnight, so the slot's own end time is the
  // authoritative boundary — it already reflects current working hours.
  return { startsAt, endsAt: combineDateAndTime(input.date, slot.endTime) };
}

/**
 * Moves a confirmed appointment to a different slot with the same doctor.
 *
 * The appointment keeps its identity — same row, same booking reference, still
 * `CONFIRMED` — so the doctor's calendar and the derived slot grid stay
 * consistent; the move itself is recorded in the audit trail.
 *
 * @param userId - Authenticated user id
 * @param userRole - Session role; must be `patient`
 * @param appointmentId - Appointment to move
 * @param rawInput - Requested `{ date, startTime }`
 * @returns The rescheduled appointment
 */
export async function rescheduleAppointment(
  userId: string,
  userRole: string | undefined,
  appointmentId: string,
  rawInput: unknown,
) {
  assertPatientRole(userRole);
  const input: RescheduleAppointmentInput =
    rescheduleAppointmentSchema.parse(rawInput);
  const patientId = await getPatientIdForUser(userId);
  const appointment = await loadChangeableAppointment(appointmentId, patientId);

  const { startsAt, endsAt } = await resolveNewSlot(appointment, input);

  let rescheduled;
  try {
    rescheduled = await prisma.$transaction(async (tx) => {
      const updated = await tx.appointment.update({
        where: {
          id: appointment.id,
          status: "CONFIRMED",
          startsAt: appointment.startsAt,
        },
        data: { startsAt, endsAt },
        select: appointmentDetailSelect,
      });

      await tx.appointmentHistory.create({
        data: {
          appointmentId: appointment.id,
          event: "RESCHEDULED",
          previousStartsAt: appointment.startsAt,
          previousEndsAt: appointment.endsAt,
          newStartsAt: startsAt,
          newEndsAt: endsAt,
          changedByUserId: userId,
          changedByRole: "patient",
        },
      });

      return updated;
    });
  } catch (error) {
    throw toTransitionError(error);
  }

  // The appointment row no longer holds the old slot — pass it for the emails.
  scheduleAppointmentNotifications("appointment.rescheduled", appointment.id, {
    previousStartsAt: appointment.startsAt,
    previousEndsAt: appointment.endsAt,
  });

  return serializeAppointment(rescheduled);
}
