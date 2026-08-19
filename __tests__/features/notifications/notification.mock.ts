import type { AppointmentNotificationContext } from "@/features/notifications";

/** 2026-08-03 08:30Z is Monday 2:00 PM in the clinic timezone (Asia/Kolkata). */
export const APPOINTMENT_STARTS_AT = new Date("2026-08-03T08:30:00.000Z");
export const APPOINTMENT_ENDS_AT = new Date("2026-08-03T09:30:00.000Z");

/** 2026-08-01 05:30Z is Saturday 11:00 AM — the pre-reschedule slot. */
export const PREVIOUS_STARTS_AT = new Date("2026-08-01T05:30:00.000Z");
export const PREVIOUS_ENDS_AT = new Date("2026-08-01T06:30:00.000Z");

export function buildNotificationContext(
  overrides: Partial<AppointmentNotificationContext> = {},
): AppointmentNotificationContext {
  return {
    details: overrides.details,
    appointment: {
      id: "appt-1",
      bookingReference: "HM-A1B2C3",
      startsAt: APPOINTMENT_STARTS_AT,
      endsAt: APPOINTMENT_ENDS_AT,
      reasonForVisit: "General consultation",
      additionalNotes: null,
      ...overrides.appointment,
    },
    patient: {
      userId: "patient-user-1",
      firstName: "Priya",
      lastName: "Sharma",
      email: "priya.sharma@example.com",
      ...overrides.patient,
    },
    doctor: {
      userId: "doctor-user-1",
      firstName: "Ananya",
      lastName: "Patel",
      specialization: "General Physician",
      email: "ananya.patel@example.com",
      ...overrides.doctor,
    },
  };
}
