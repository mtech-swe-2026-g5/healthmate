import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createAppointment,
  generateBookingReference,
  getAppointmentForPatient,
  listPatientAppointments,
  serializeAppointment,
} from "@/features/appointments/services/appointments";
import {
  getActiveDoctor,
  listActiveDoctors,
} from "@/features/appointments/services/doctors";

const mockPatientFindUnique = vi.fn();
const mockAppointmentCreate = vi.fn();
const mockAppointmentFindFirst = vi.fn();
const mockAppointmentFindMany = vi.fn();
const mockDoctorFindMany = vi.fn();
const mockDoctorFindFirst = vi.fn();
const mockGenerateSlots = vi.fn();
const mockScheduleNotifications = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    patient: {
      findUnique: (...args: unknown[]) => mockPatientFindUnique(...args),
    },
    appointment: {
      create: (...args: unknown[]) => mockAppointmentCreate(...args),
      findFirst: (...args: unknown[]) => mockAppointmentFindFirst(...args),
      findMany: (...args: unknown[]) => mockAppointmentFindMany(...args),
    },
    doctor: {
      findMany: (...args: unknown[]) => mockDoctorFindMany(...args),
      findFirst: (...args: unknown[]) => mockDoctorFindFirst(...args),
    },
  },
}));

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

const DOCTOR = {
  id: DOCTOR_ID,
  firstName: "Ananya",
  lastName: "Patel",
  specialization: "General Physician",
};

const FAR_FUTURE = new Date(Date.now() + 72 * 3_600_000);

function detailRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "a1",
    bookingReference: "HM-ABC123",
    startsAt: FAR_FUTURE,
    endsAt: new Date(FAR_FUTURE.getTime() + 3_600_000),
    status: "CONFIRMED",
    reasonForVisit: "Checkup",
    additionalNotes: null,
    doctor: DOCTOR,
    ...overrides,
  };
}

const VALID_INPUT = {
  doctorId: DOCTOR_ID,
  date: "2027-03-01",
  startTime: "14:00",
  reasonForVisit: "  Checkup  ",
  additionalNotes: "   ",
};

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.APPOINTMENT_CANCELLATION_CUTOFF_HOURS;
  mockPatientFindUnique.mockResolvedValue({ id: PATIENT_ID });
  mockDoctorFindFirst.mockResolvedValue(DOCTOR);
  mockGenerateSlots.mockResolvedValue([
    { startTime: "14:00", endTime: "15:00", status: "available" },
    { startTime: "16:00", endTime: "17:00", status: "booked" },
    { startTime: "11:00", endTime: "12:00", status: "unavailable" },
  ]);
  mockAppointmentCreate.mockResolvedValue(detailRow());
});

describe("generateBookingReference", () => {
  it("produces an HM- prefixed uppercase reference", () => {
    expect(generateBookingReference()).toMatch(/^HM-[0-9A-F]{6}$/);
  });
});

describe("serializeAppointment", () => {
  const now = new Date("2026-08-15T10:00:00.000Z");

  it("marks a future appointment as upcoming and changeable", () => {
    const result = serializeAppointment(
      detailRow({
        startsAt: new Date("2026-08-20T10:00:00.000Z"),
        endsAt: new Date("2026-08-20T11:00:00.000Z"),
      }),
      now,
    );

    expect(result.timing).toBe("upcoming");
    expect(result.canBeChanged).toBe(true);
  });

  it("marks a past appointment as past and unchangeable", () => {
    const result = serializeAppointment(
      detailRow({
        startsAt: new Date("2026-08-01T10:00:00.000Z"),
        endsAt: new Date("2026-08-01T11:00:00.000Z"),
      }),
      now,
    );

    expect(result.timing).toBe("past");
    expect(result.canBeChanged).toBe(false);
  });

  it("refuses changes inside the cut-off window", () => {
    const result = serializeAppointment(
      detailRow({
        startsAt: new Date("2026-08-15T20:00:00.000Z"),
        endsAt: new Date("2026-08-15T21:00:00.000Z"),
      }),
      now,
    );

    expect(result.timing).toBe("upcoming");
    expect(result.canBeChanged).toBe(false);
  });

  it("refuses changes to a cancelled appointment that is still upcoming", () => {
    const result = serializeAppointment(
      detailRow({
        status: "CANCELLED",
        startsAt: new Date("2026-08-20T10:00:00.000Z"),
        endsAt: new Date("2026-08-20T11:00:00.000Z"),
      }),
      now,
    );

    expect(result.status).toBe("CANCELLED");
    expect(result.canBeChanged).toBe(false);
  });

  it("serialises instants as ISO strings", () => {
    const result = serializeAppointment(detailRow(), now);
    expect(result.startsAt).toBe(FAR_FUTURE.toISOString());
  });
});

describe("createAppointment", () => {
  it("creates a CONFIRMED appointment and trims free text", async () => {
    const result = await createAppointment(USER_ID, "patient", VALID_INPUT);

    expect(result.bookingReference).toBe("HM-ABC123");
    const [args] = mockAppointmentCreate.mock.calls[0] as [
      { data: Record<string, unknown> },
    ];
    expect(args.data).toMatchObject({
      patientId: PATIENT_ID,
      doctorId: DOCTOR_ID,
      status: "CONFIRMED",
      reasonForVisit: "Checkup",
      additionalNotes: null,
    });
  });

  it("keeps non-empty additional notes", async () => {
    await createAppointment(USER_ID, "patient", {
      ...VALID_INPUT,
      additionalNotes: "  Prefer morning  ",
    });

    const [args] = mockAppointmentCreate.mock.calls[0] as [
      { data: { additionalNotes: string | null } },
    ];
    expect(args.data.additionalNotes).toBe("Prefer morning");
  });

  it("schedules the booking notification", async () => {
    await createAppointment(USER_ID, "patient", VALID_INPUT);
    expect(mockScheduleNotifications).toHaveBeenCalledWith(
      "appointment.booked",
      "a1",
    );
  });

  it("rejects a non-patient role", async () => {
    await expect(
      createAppointment(USER_ID, "doctor", VALID_INPUT),
    ).rejects.toThrow("Forbidden");
  });

  it("rejects a missing role", async () => {
    await expect(
      createAppointment(USER_ID, undefined, VALID_INPUT),
    ).rejects.toThrow("Unauthorized");
  });

  it("returns 404 when the doctor is inactive or missing", async () => {
    mockDoctorFindFirst.mockResolvedValue(null);
    await expect(
      createAppointment(USER_ID, "patient", VALID_INPUT),
    ).rejects.toMatchObject({ status: 404, message: "Doctor not found" });
  });

  it("returns 404 when the patient profile is missing", async () => {
    mockPatientFindUnique.mockResolvedValue(null);
    await expect(
      createAppointment(USER_ID, "patient", VALID_INPUT),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("returns 400 for a start time outside the schedule", async () => {
    await expect(
      createAppointment(USER_ID, "patient", {
        ...VALID_INPUT,
        startTime: "23:00",
      }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("returns 409 for an already booked slot", async () => {
    await expect(
      createAppointment(USER_ID, "patient", {
        ...VALID_INPUT,
        startTime: "16:00",
      }),
    ).rejects.toMatchObject({ status: 409, message: "Slot already booked" });
  });

  it("returns 400 for an unavailable slot", async () => {
    await expect(
      createAppointment(USER_ID, "patient", {
        ...VALID_INPUT,
        startTime: "11:00",
      }),
    ).rejects.toMatchObject({ status: 400, message: "Slot is not available" });
  });

  it("maps a unique-constraint race to 409", async () => {
    mockAppointmentCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("dup", {
        code: "P2002",
        clientVersion: "7.9.0",
      }),
    );

    await expect(
      createAppointment(USER_ID, "patient", VALID_INPUT),
    ).rejects.toMatchObject({ status: 409, message: "Slot already booked" });
  });

  it("rethrows unexpected database errors", async () => {
    mockAppointmentCreate.mockRejectedValue(new Error("connection reset"));
    await expect(
      createAppointment(USER_ID, "patient", VALID_INPUT),
    ).rejects.toThrow("connection reset");
  });
});

describe("getAppointmentForPatient", () => {
  it("returns an appointment the patient owns", async () => {
    mockAppointmentFindFirst.mockResolvedValue(detailRow());
    const result = await getAppointmentForPatient(USER_ID, "patient", "a1");
    expect(result.id).toBe("a1");
  });

  it("returns 404 for an appointment the patient does not own", async () => {
    mockAppointmentFindFirst.mockResolvedValue(null);
    await expect(
      getAppointmentForPatient(USER_ID, "patient", "a1"),
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("listPatientAppointments", () => {
  it("splits appointments into upcoming and past", async () => {
    mockAppointmentFindMany.mockResolvedValue([
      detailRow({ id: "future", startsAt: FAR_FUTURE }),
      detailRow({
        id: "old",
        startsAt: new Date(Date.now() - 72 * 3_600_000),
      }),
    ]);

    const result = await listPatientAppointments(USER_ID, "patient");

    expect(result.upcoming.map((a) => a.id)).toEqual(["future"]);
    expect(result.past.map((a) => a.id)).toEqual(["old"]);
  });

  it("sorts upcoming appointments soonest first", async () => {
    mockAppointmentFindMany.mockResolvedValue([
      detailRow({
        id: "later",
        startsAt: new Date(Date.now() + 96 * 3_600_000),
      }),
      detailRow({ id: "sooner", startsAt: FAR_FUTURE }),
    ]);

    const result = await listPatientAppointments(USER_ID, "patient");
    expect(result.upcoming.map((a) => a.id)).toEqual(["sooner", "later"]);
  });
});

describe("doctors service", () => {
  it("lists only active doctors", async () => {
    mockDoctorFindMany.mockResolvedValue([DOCTOR]);
    const result = await listActiveDoctors();

    expect(result).toEqual([DOCTOR]);
    const [args] = mockDoctorFindMany.mock.calls[0] as [
      { where: { isActive: boolean } },
    ];
    expect(args.where.isActive).toBe(true);
  });

  it("returns null for an inactive doctor", async () => {
    mockDoctorFindFirst.mockResolvedValue(null);
    await expect(getActiveDoctor(DOCTOR_ID)).resolves.toBeNull();
  });
});
