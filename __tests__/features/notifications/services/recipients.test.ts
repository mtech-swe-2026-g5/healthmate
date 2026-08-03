import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAppointmentNotificationContext } from "@/features/notifications/services/recipients";

import {
  APPOINTMENT_ENDS_AT,
  APPOINTMENT_STARTS_AT,
} from "../notification.mock";

const mockFindUnique = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    appointment: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

function appointmentRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "appt-1",
    bookingReference: "HM-A1B2C3",
    startsAt: APPOINTMENT_STARTS_AT,
    endsAt: APPOINTMENT_ENDS_AT,
    reasonForVisit: "General consultation",
    additionalNotes: null,
    patient: {
      firstName: "Priya",
      lastName: "Sharma",
      user: { email: "priya.sharma@example.com" },
    },
    doctor: {
      firstName: "Ananya",
      lastName: "Patel",
      specialization: "General Physician",
      user: { email: "ananya.patel@example.com" },
    },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getAppointmentNotificationContext", () => {
  it("flattens the patient and doctor identities for templates", async () => {
    mockFindUnique.mockResolvedValue(appointmentRow());

    const context = await getAppointmentNotificationContext("appt-1");

    expect(context?.patient).toEqual({
      firstName: "Priya",
      lastName: "Sharma",
      email: "priya.sharma@example.com",
    });
    expect(context?.doctor).toEqual({
      firstName: "Ananya",
      lastName: "Patel",
      specialization: "General Physician",
      email: "ananya.patel@example.com",
    });
    expect(context?.appointment.bookingReference).toBe("HM-A1B2C3");
  });

  it("returns null when the appointment does not exist", async () => {
    mockFindUnique.mockResolvedValue(null);
    await expect(
      getAppointmentNotificationContext("missing"),
    ).resolves.toBeNull();
  });

  it("returns null when the patient has no email", async () => {
    mockFindUnique.mockResolvedValue(
      appointmentRow({
        patient: {
          firstName: "Priya",
          lastName: "Sharma",
          user: { email: "" },
        },
      }),
    );

    await expect(
      getAppointmentNotificationContext("appt-1"),
    ).resolves.toBeNull();
  });

  it("returns null when the doctor has no email", async () => {
    mockFindUnique.mockResolvedValue(
      appointmentRow({
        doctor: {
          firstName: "Ananya",
          lastName: "Patel",
          specialization: "General Physician",
          user: { email: "" },
        },
      }),
    );

    await expect(
      getAppointmentNotificationContext("appt-1"),
    ).resolves.toBeNull();
  });
});
