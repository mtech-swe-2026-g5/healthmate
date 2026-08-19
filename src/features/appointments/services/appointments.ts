import { randomBytes } from "crypto";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { requireRole } from "@/features/auth/services/permissions";
import { scheduleAppointmentNotifications } from "@/features/notifications";

import { createAppointmentSchema } from "../types";
import type { CreateAppointmentInput } from "../types";
import {
  getCancellationCutoffHours,
  hasCancellationCutoffPassed,
} from "../lib/cancellation-window";
import { generateSlots, combineDateAndTime, addMinutes } from "./slots";
import { getActiveDoctor } from "./doctors";

export function generateBookingReference(): string {
  return `HM-${randomBytes(3).toString("hex").toUpperCase()}`;
}

export async function getPatientIdForUser(userId: string): Promise<string> {
  const patient = await prisma.patient.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!patient) {
    throw new AppError("Patient profile not found", 404);
  }

  return patient.id;
}

export function assertPatientRole(role: string | undefined): void {
  if (!role) {
    throw new Error("Unauthorized");
  }
  requireRole(role, ["patient"]);
}

export const appointmentDetailSelect = {
  id: true,
  bookingReference: true,
  startsAt: true,
  endsAt: true,
  status: true,
  reasonForVisit: true,
  additionalNotes: true,
  doctor: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      specialization: true,
    },
  },
} as const;

export function serializeAppointment(
  appointment: {
    id: string;
    bookingReference: string;
    startsAt: Date;
    endsAt: Date;
    status: string;
    reasonForVisit: string;
    additionalNotes: string | null;
    doctor: {
      id: string;
      firstName: string;
      lastName: string;
      specialization: string;
    };
  },
  now: Date = new Date(),
): {
  id: string;
  bookingReference: string;
  startsAt: string;
  endsAt: string;
  status: string;
  reasonForVisit: string;
  additionalNotes: string | null;
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  };
  timing: "upcoming" | "past";
  canBeChanged: boolean;
} {
  const cutoffHours = getCancellationCutoffHours();

  return {
    id: appointment.id,
    bookingReference: appointment.bookingReference,
    startsAt: appointment.startsAt.toISOString(),
    endsAt: appointment.endsAt.toISOString(),
    status: appointment.status,
    reasonForVisit: appointment.reasonForVisit,
    additionalNotes: appointment.additionalNotes,
    doctor: appointment.doctor,
    timing:
      appointment.startsAt.getTime() >= now.getTime() ? "upcoming" : "past",
    // Mirrors the server-side guard so the UI only offers cancel/reschedule
    // where the API would actually accept it.
    canBeChanged:
      appointment.status === "CONFIRMED" &&
      !hasCancellationCutoffPassed(appointment.startsAt, cutoffHours, now),
  };
}

export async function createAppointment(
  userId: string,
  userRole: string | undefined,
  rawInput: unknown,
) {
  assertPatientRole(userRole);
  const input: CreateAppointmentInput = createAppointmentSchema.parse(rawInput);
  const patientId = await getPatientIdForUser(userId);

  const doctor = await getActiveDoctor(input.doctorId);
  if (!doctor) {
    throw new AppError("Doctor not found", 404);
  }

  const slots = await generateSlots(input.doctorId, input.date);
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

  const startsAt = combineDateAndTime(input.date, input.startTime);
  const endsAt = combineDateAndTime(input.date, slot.endTime);
  const notes =
    input.additionalNotes && input.additionalNotes.trim().length > 0
      ? input.additionalNotes.trim()
      : null;

  try {
    const appointment = await prisma.appointment.create({
      data: {
        bookingReference: generateBookingReference(),
        patientId,
        doctorId: input.doctorId,
        startsAt,
        endsAt,
        status: "CONFIRMED",
        reasonForVisit: input.reasonForVisit.trim(),
        additionalNotes: notes,
      },
      select: appointmentDetailSelect,
    });

    // Booking is now final (CONFIRMED) — confirm to patient and doctor.
    // Delivery runs after the response, so SMTP never blocks this call.
    scheduleAppointmentNotifications("appointment.booked", appointment.id);

    return serializeAppointment(appointment);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new AppError("Slot already booked", 409);
    }
    throw error;
  }
}

export async function getAppointmentForPatient(
  userId: string,
  userRole: string | undefined,
  appointmentId: string,
) {
  assertPatientRole(userRole);
  const patientId = await getPatientIdForUser(userId);

  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, patientId },
    select: appointmentDetailSelect,
  });

  if (!appointment) {
    throw new AppError("Appointment not found", 404);
  }

  return serializeAppointment(appointment);
}

export async function listPatientAppointments(
  userId: string,
  userRole: string | undefined,
) {
  assertPatientRole(userRole);
  const patientId = await getPatientIdForUser(userId);
  const now = new Date();

  const appointments = await prisma.appointment.findMany({
    where: { patientId },
    orderBy: { startsAt: "desc" },
    select: appointmentDetailSelect,
  });

  const serialized = appointments.map((a) => serializeAppointment(a, now));

  return {
    upcoming: serialized
      .filter((a) => a.timing === "upcoming")
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
      ),
    past: serialized.filter((a) => a.timing === "past"),
  };
}
