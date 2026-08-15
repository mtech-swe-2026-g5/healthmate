import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cancelAppointment,
  rescheduleAppointment,
} from "@/features/appointments/services/appointment-transitions";
import { combineDateAndTime } from "@/features/appointments/lib/date-utils";

const mockPatientFindUnique = vi.fn();
const mockAppointmentFindFirst = vi.fn();
const mockAppointmentUpdate = vi.fn();
const mockHistoryCreate = vi.fn();
const mockGenerateSlots = vi.fn();
const mockScheduleNotifications = vi.fn();

vi.mock("@/lib/prisma", () => {
  const tx = {
    appointment: {
      update: (...args: unknown[]) => mockAppointmentUpdate(...args),
    },
    appointmentHistory: {
      create: (...args: unknown[]) => mockHistoryCreate(...args),
    },
  };
  return {
    prisma: {
      patient: {
        findUnique: (...args: unknown[]) => mockPatientFindUnique(...args),
      },
      appointment: {
        findFirst: (...args: unknown[]) => mockAppointmentFindFirst(...args),
      },
      $transaction: (run: (client: typeof tx) => Promise<unknown>) => run(tx),
    },
  };
});

vi.mock("@/features/notifications", () => ({
  scheduleAppointmentNotifications: (...args: unknown[]) =>
    mockScheduleNotifications(...args),
}));

vi.mock("@/features/appointments/services/slots", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("@/features/appointments/services/slots")
    >();
  return {
    ...actual,
    generateSlots: (...args: unknown[]) => mockGenerateSlots(...args),
  };
});

const USER_ID = "11111111-1111-4111-8111-111111111111";
const PATIENT_ID = "22222222-2222-4222-8222-222222222222";
const DOCTOR_ID = "33333333-3333-4333-8333-333333333333";
const APPOINTMENT_ID = "44444444-4444-4444-8444-444444444444";

/** Comfortably outside the 24-hour cut-off. */
const CURRENT_STARTS_AT = new Date(Date.now() + 72 * 3_600_000);
const CURRENT_ENDS_AT = new Date(CURRENT_STARTS_AT.getTime() + 3_600_000);

const NEW_DATE = "2027-03-01";
const NEW_START_TIME = "14:00";

function detailRow(overrides: Record<string, unknown> = {}) {
  return {
    id: APPOINTMENT_ID,
    bookingReference: "HM-ABC123",
    startsAt: CURRENT_STARTS_AT,
    endsAt: CURRENT_ENDS_AT,
    status: "CONFIRMED",
    reasonForVisit: "Checkup",
    additionalNotes: null,
    doctor: {
      id: DOCTOR_ID,
      firstName: "Ananya",
      lastName: "Patel",
      specialization: "General Physician",
    },
    ...overrides,
  };
}

function prismaError(code: string) {
  return new Prisma.PrismaClientKnownRequestError("conflict", {
    code,
    clientVersion: "7.9.0",
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.APPOINTMENT_CANCELLATION_CUTOFF_HOURS;
  mockPatientFindUnique.mockResolvedValue({ id: PATIENT_ID });
  mockAppointmentFindFirst.mockResolvedValue({
    id: APPOINTMENT_ID,
    doctorId: DOCTOR_ID,
    startsAt: CURRENT_STARTS_AT,
    endsAt: CURRENT_ENDS_AT,
    status: "CONFIRMED",
  });
  mockHistoryCreate.mockResolvedValue({});
  mockGenerateSlots.mockResolvedValue([
    { startTime: NEW_START_TIME, endTime: "15:00", status: "available" },
    { startTime: "16:00", endTime: "17:00", status: "booked" },
    { startTime: "11:00", endTime: "12:00", status: "unavailable" },
  ]);
});

describe("cancelAppointment", () => {
  beforeEach(() => {
    mockAppointmentUpdate.mockResolvedValue(detailRow({ status: "CANCELLED" }));
  });

  it("flips the status to CANCELLED and stamps cancelledAt", async () => {
    const result = await cancelAppointment(USER_ID, "patient", APPOINTMENT_ID);

    expect(result.status).toBe("CANCELLED");
    const [args] = mockAppointmentUpdate.mock.calls[0] as [
      { data: { status: string; cancelledAt: Date } },
    ];
    expect(args.data.status).toBe("CANCELLED");
    expect(args.data.cancelledAt).toBeInstanceOf(Date);
  });

  it("guards the update with the status and slot it read", async () => {
    await cancelAppointment(USER_ID, "patient", APPOINTMENT_ID);

    const [args] = mockAppointmentUpdate.mock.calls[0] as [
      { where: Record<string, unknown> },
    ];
    expect(args.where).toEqual({
      id: APPOINTMENT_ID,
      status: "CONFIRMED",
      startsAt: CURRENT_STARTS_AT,
    });
  });

  it("writes a CANCELLED audit row with the released slot", async () => {
    await cancelAppointment(USER_ID, "patient", APPOINTMENT_ID);

    const [args] = mockHistoryCreate.mock.calls[0] as [
      { data: Record<string, unknown> },
    ];
    expect(args.data).toMatchObject({
      appointmentId: APPOINTMENT_ID,
      event: "CANCELLED",
      previousStartsAt: CURRENT_STARTS_AT,
      previousEndsAt: CURRENT_ENDS_AT,
      changedByUserId: USER_ID,
      changedByRole: "patient",
    });
  });

  it("notifies both audiences and attributes the cancellation", async () => {
    await cancelAppointment(USER_ID, "patient", APPOINTMENT_ID);

    expect(mockScheduleNotifications).toHaveBeenCalledWith(
      "appointment.cancelled",
      APPOINTMENT_ID,
      { cancelledBy: "patient" },
    );
  });

  it("rejects a non-patient role", async () => {
    await expect(
      cancelAppointment(USER_ID, "doctor", APPOINTMENT_ID),
    ).rejects.toThrow("Forbidden");
  });

  it("returns 404 for an appointment the patient does not own", async () => {
    mockAppointmentFindFirst.mockResolvedValue(null);
    await expect(
      cancelAppointment(USER_ID, "patient", APPOINTMENT_ID),
    ).rejects.toMatchObject({ status: 404, message: "Appointment not found" });
  });

  it("returns 409 when it is already cancelled", async () => {
    mockAppointmentFindFirst.mockResolvedValue({
      id: APPOINTMENT_ID,
      doctorId: DOCTOR_ID,
      startsAt: CURRENT_STARTS_AT,
      endsAt: CURRENT_ENDS_AT,
      status: "CANCELLED",
    });

    await expect(
      cancelAppointment(USER_ID, "patient", APPOINTMENT_ID),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("refuses once the cut-off window has passed", async () => {
    const soon = new Date(Date.now() + 2 * 3_600_000);
    mockAppointmentFindFirst.mockResolvedValue({
      id: APPOINTMENT_ID,
      doctorId: DOCTOR_ID,
      startsAt: soon,
      endsAt: new Date(soon.getTime() + 3_600_000),
      status: "CONFIRMED",
    });

    await expect(
      cancelAppointment(USER_ID, "patient", APPOINTMENT_ID),
    ).rejects.toMatchObject({ status: 400 });
    expect(mockAppointmentUpdate).not.toHaveBeenCalled();
  });

  it("maps a lost optimistic guard to 409", async () => {
    mockAppointmentUpdate.mockRejectedValue(prismaError("P2025"));

    await expect(
      cancelAppointment(USER_ID, "patient", APPOINTMENT_ID),
    ).rejects.toMatchObject({ status: 409 });
    expect(mockScheduleNotifications).not.toHaveBeenCalled();
  });

  it("throws when the patient profile is missing", async () => {
    mockPatientFindUnique.mockResolvedValue(null);
    await expect(
      cancelAppointment(USER_ID, "patient", APPOINTMENT_ID),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("rescheduleAppointment", () => {
  const newStartsAt = combineDateAndTime(NEW_DATE, NEW_START_TIME);
  const newEndsAt = combineDateAndTime(NEW_DATE, "15:00");

  beforeEach(() => {
    mockAppointmentUpdate.mockResolvedValue(
      detailRow({ startsAt: newStartsAt, endsAt: newEndsAt }),
    );
  });

  it("moves the appointment to the requested slot", async () => {
    const result = await rescheduleAppointment(
      USER_ID,
      "patient",
      APPOINTMENT_ID,
      { date: NEW_DATE, startTime: NEW_START_TIME },
    );

    expect(result.startsAt).toBe(newStartsAt.toISOString());
    const [args] = mockAppointmentUpdate.mock.calls[0] as [
      { data: { startsAt: Date; endsAt: Date } },
    ];
    expect(args.data).toEqual({ startsAt: newStartsAt, endsAt: newEndsAt });
  });

  it("keeps the appointment CONFIRMED so the new slot reads as booked", async () => {
    await rescheduleAppointment(USER_ID, "patient", APPOINTMENT_ID, {
      date: NEW_DATE,
      startTime: NEW_START_TIME,
    });

    const [args] = mockAppointmentUpdate.mock.calls[0] as [
      { data: Record<string, unknown> },
    ];
    expect(args.data).not.toHaveProperty("status");
  });

  it("records both slots in the audit trail", async () => {
    await rescheduleAppointment(USER_ID, "patient", APPOINTMENT_ID, {
      date: NEW_DATE,
      startTime: NEW_START_TIME,
    });

    const [args] = mockHistoryCreate.mock.calls[0] as [
      { data: Record<string, unknown> },
    ];
    expect(args.data).toMatchObject({
      event: "RESCHEDULED",
      previousStartsAt: CURRENT_STARTS_AT,
      previousEndsAt: CURRENT_ENDS_AT,
      newStartsAt,
      newEndsAt,
    });
  });

  it("passes the old slot to the notification dispatcher", async () => {
    await rescheduleAppointment(USER_ID, "patient", APPOINTMENT_ID, {
      date: NEW_DATE,
      startTime: NEW_START_TIME,
    });

    expect(mockScheduleNotifications).toHaveBeenCalledWith(
      "appointment.rescheduled",
      APPOINTMENT_ID,
      {
        previousStartsAt: CURRENT_STARTS_AT,
        previousEndsAt: CURRENT_ENDS_AT,
      },
    );
  });

  it("rejects a slot that is already booked", async () => {
    await expect(
      rescheduleAppointment(USER_ID, "patient", APPOINTMENT_ID, {
        date: NEW_DATE,
        startTime: "16:00",
      }),
    ).rejects.toMatchObject({ status: 409, message: "Slot already booked" });
  });

  it("rejects a slot that is not selectable", async () => {
    await expect(
      rescheduleAppointment(USER_ID, "patient", APPOINTMENT_ID, {
        date: NEW_DATE,
        startTime: "11:00",
      }),
    ).rejects.toMatchObject({ status: 400, message: "Slot is not available" });
  });

  it("rejects a start time outside the doctor's schedule", async () => {
    await expect(
      rescheduleAppointment(USER_ID, "patient", APPOINTMENT_ID, {
        date: NEW_DATE,
        startTime: "23:00",
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("rejects a move to the slot it already occupies", async () => {
    const currentDate = CURRENT_STARTS_AT.toISOString().slice(0, 10);
    mockAppointmentFindFirst.mockResolvedValue({
      id: APPOINTMENT_ID,
      doctorId: DOCTOR_ID,
      startsAt: combineDateAndTime(currentDate, NEW_START_TIME),
      endsAt: CURRENT_ENDS_AT,
      status: "CONFIRMED",
    });

    await expect(
      rescheduleAppointment(USER_ID, "patient", APPOINTMENT_ID, {
        date: currentDate,
        startTime: NEW_START_TIME,
      }),
    ).rejects.toMatchObject({
      status: 400,
      message: "Appointment is already scheduled for this time",
    });
    expect(mockGenerateSlots).not.toHaveBeenCalled();
  });

  it("rejects an invalid calendar date before touching the database", async () => {
    await expect(
      rescheduleAppointment(USER_ID, "patient", APPOINTMENT_ID, {
        date: "2027-02-31",
        startTime: NEW_START_TIME,
      }),
    ).rejects.toThrow();
    expect(mockAppointmentUpdate).not.toHaveBeenCalled();
  });

  it("maps a lost race for the target slot to 409", async () => {
    mockAppointmentUpdate.mockRejectedValue(prismaError("P2002"));

    await expect(
      rescheduleAppointment(USER_ID, "patient", APPOINTMENT_ID, {
        date: NEW_DATE,
        startTime: NEW_START_TIME,
      }),
    ).rejects.toMatchObject({ status: 409, message: "Slot already booked" });
    expect(mockScheduleNotifications).not.toHaveBeenCalled();
  });

  it("rethrows unexpected database errors unchanged", async () => {
    mockAppointmentUpdate.mockRejectedValue(new Error("connection reset"));

    await expect(
      rescheduleAppointment(USER_ID, "patient", APPOINTMENT_ID, {
        date: NEW_DATE,
        startTime: NEW_START_TIME,
      }),
    ).rejects.toThrow("connection reset");
  });

  it("refuses once the cut-off window has passed", async () => {
    const soon = new Date(Date.now() + 3 * 3_600_000);
    mockAppointmentFindFirst.mockResolvedValue({
      id: APPOINTMENT_ID,
      doctorId: DOCTOR_ID,
      startsAt: soon,
      endsAt: new Date(soon.getTime() + 3_600_000),
      status: "CONFIRMED",
    });

    await expect(
      rescheduleAppointment(USER_ID, "patient", APPOINTMENT_ID, {
        date: NEW_DATE,
        startTime: NEW_START_TIME,
      }),
    ).rejects.toMatchObject({ status: 400 });
  });
});
