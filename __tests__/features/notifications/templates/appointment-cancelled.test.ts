import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  renderAppointmentCancelledDoctorEmail,
  renderAppointmentCancelledPatientEmail,
} from "@/features/notifications/templates";

import { buildNotificationContext } from "../notification.mock";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://healthmate.app");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("renderAppointmentCancelledPatientEmail", () => {
  it("names the cancelled slot and offers a rebooking link", () => {
    const email = renderAppointmentCancelledPatientEmail(
      buildNotificationContext(),
    );

    expect(email.to).toBe("priya.sharma@example.com");
    expect(email.subject).toBe(
      "Appointment cancelled — Dr. Ananya Patel, Monday, Aug 3, 2026 at 2:00 PM – 3:00 PM",
    );
    expect(email.text).toContain("Cancelled date: Monday, Aug 3, 2026");
    expect(email.html).toContain(
      'href="https://healthmate.app/appointments/book"',
    );
  });

  it("acknowledges a patient-initiated cancellation", () => {
    const email = renderAppointmentCancelledPatientEmail(
      buildNotificationContext({ details: { cancelledBy: "patient" } }),
    );

    expect(email.text).toContain("as requested");
  });

  it("apologises when the doctor cancelled", () => {
    const email = renderAppointmentCancelledPatientEmail(
      buildNotificationContext({ details: { cancelledBy: "doctor" } }),
    );

    expect(email.text).toContain("has cancelled this consultation");
  });

  it("uses neutral copy when the initiator is unknown", () => {
    const email = renderAppointmentCancelledPatientEmail(
      buildNotificationContext(),
    );

    expect(email.text).toContain("has been cancelled.");
    expect(email.text).not.toContain("as requested");
  });
});

describe("renderAppointmentCancelledDoctorEmail", () => {
  it("tells the doctor the slot is free again", () => {
    const email = renderAppointmentCancelledDoctorEmail(
      buildNotificationContext(),
    );

    expect(email.to).toBe("ananya.patel@example.com");
    expect(email.text).toContain("Hi Dr. Patel,");
    expect(email.text).toContain("Patient: Priya Sharma");
    expect(email.text).toContain("free again on your schedule");
  });

  it("attributes a patient-initiated cancellation", () => {
    const email = renderAppointmentCancelledDoctorEmail(
      buildNotificationContext({ details: { cancelledBy: "patient" } }),
    );

    expect(email.text).toContain("Priya Sharma cancelled this consultation");
  });

  it("attributes a doctor-initiated cancellation", () => {
    const email = renderAppointmentCancelledDoctorEmail(
      buildNotificationContext({ details: { cancelledBy: "doctor" } }),
    );

    expect(email.text).toContain("cancelled from your portal");
  });
});
