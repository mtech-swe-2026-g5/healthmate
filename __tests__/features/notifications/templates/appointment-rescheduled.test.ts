import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  renderAppointmentRescheduledDoctorEmail,
  renderAppointmentRescheduledPatientEmail,
} from "@/features/notifications/templates";

import {
  buildNotificationContext,
  PREVIOUS_ENDS_AT,
  PREVIOUS_STARTS_AT,
} from "../notification.mock";

const PREVIOUS_SLOT = "Saturday, Aug 1, 2026 at 11:00 AM – 12:00 PM";

const movedContext = () =>
  buildNotificationContext({
    details: {
      previousStartsAt: PREVIOUS_STARTS_AT,
      previousEndsAt: PREVIOUS_ENDS_AT,
    },
  });

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://healthmate.app");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("renderAppointmentRescheduledPatientEmail", () => {
  it("shows both the old and the new slot", () => {
    const email = renderAppointmentRescheduledPatientEmail(movedContext());

    expect(email.to).toBe("priya.sharma@example.com");
    expect(email.subject).toBe(
      "Appointment rescheduled — Dr. Ananya Patel, now Monday, Aug 3, 2026 at 2:00 PM – 3:00 PM",
    );
    expect(email.text).toContain(`Previous slot: ${PREVIOUS_SLOT}`);
    expect(email.text).toContain("New date: Monday, Aug 3, 2026");
    expect(email.text).toContain(`has moved from ${PREVIOUS_SLOT}`);
  });

  it("links to the appointment and keeps the booking reference", () => {
    const email = renderAppointmentRescheduledPatientEmail(movedContext());

    expect(email.html).toContain(
      'href="https://healthmate.app/appointments/appt-1"',
    );
    expect(email.text).toContain("Booking reference: HM-A1B2C3");
  });

  it("omits the previous slot when the caller did not supply it", () => {
    const email = renderAppointmentRescheduledPatientEmail(
      buildNotificationContext(),
    );

    expect(email.text).not.toContain("Previous slot");
    expect(email.text).toContain("has been rescheduled");
  });

  it("omits the previous slot when only one bound is supplied", () => {
    const email = renderAppointmentRescheduledPatientEmail(
      buildNotificationContext({
        details: { previousStartsAt: PREVIOUS_STARTS_AT },
      }),
    );

    expect(email.text).not.toContain("Previous slot");
  });
});

describe("renderAppointmentRescheduledDoctorEmail", () => {
  it("names the patient and both slots", () => {
    const email = renderAppointmentRescheduledDoctorEmail(movedContext());

    expect(email.to).toBe("ananya.patel@example.com");
    expect(email.subject).toBe(
      "Appointment rescheduled — Priya Sharma, now Monday, Aug 3, 2026 at 2:00 PM – 3:00 PM",
    );
    expect(email.text).toContain("Hi Dr. Patel,");
    expect(email.text).toContain(`Previous slot: ${PREVIOUS_SLOT}`);
  });

  it("falls back to neutral copy without the previous slot", () => {
    const email = renderAppointmentRescheduledDoctorEmail(
      buildNotificationContext(),
    );

    expect(email.text).toContain("has been rescheduled");
    expect(email.html).toContain('href="https://healthmate.app/doctor"');
  });
});
