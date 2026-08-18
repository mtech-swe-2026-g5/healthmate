import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAppointmentEmailTemplates,
  renderAppointmentBookedDoctorEmail,
  renderAppointmentBookedPatientEmail,
} from "@/features/notifications/templates";
import type { AppointmentNotificationEvent } from "@/features/notifications";

import { buildNotificationContext } from "../notification.mock";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://healthmate.app");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getAppointmentEmailTemplates", () => {
  it("registers a patient and doctor template for bookings", () => {
    const templates = getAppointmentEmailTemplates("appointment.booked");

    expect(templates?.patient).toBe(renderAppointmentBookedPatientEmail);
    expect(templates?.doctor).toBe(renderAppointmentBookedDoctorEmail);
  });

  it("registers both audiences for every appointment event", () => {
    const events = [
      "appointment.booked",
      "appointment.cancelled",
      "appointment.rescheduled",
    ] as const;

    for (const event of events) {
      const templates = getAppointmentEmailTemplates(event);
      expect(typeof templates?.patient).toBe("function");
      expect(typeof templates?.doctor).toBe("function");
    }
  });

  it("returns null for an unrecognised event", () => {
    expect(
      getAppointmentEmailTemplates(
        "appointment.unknown" as AppointmentNotificationEvent,
      ),
    ).toBeNull();
  });
});

describe("renderAppointmentBookedPatientEmail", () => {
  it("addresses the patient and summarises the booking", () => {
    const email = renderAppointmentBookedPatientEmail(
      buildNotificationContext(),
    );

    expect(email.to).toBe("priya.sharma@example.com");
    expect(email.subject).toBe(
      "Appointment confirmed — Dr. Ananya Patel, Monday, Aug 3, 2026 at 2:00 PM – 3:00 PM",
    );
    expect(email.text).toContain("Hi Priya,");
    expect(email.text).toContain("Booking reference: HM-A1B2C3");
    expect(email.text).toContain("Doctor: Dr. Ananya Patel");
    expect(email.text).toContain("Specialization: General Physician");
  });

  it("links to the patient's appointment detail page", () => {
    const email = renderAppointmentBookedPatientEmail(
      buildNotificationContext(),
    );

    expect(email.html).toContain(
      'href="https://healthmate.app/appointments/appt-1"',
    );
    expect(email.text).toContain(
      "View appointment: https://healthmate.app/appointments/appt-1",
    );
  });

  it("includes the patient's notes only when provided", () => {
    const withoutNotes = renderAppointmentBookedPatientEmail(
      buildNotificationContext(),
    );
    expect(withoutNotes.text).not.toContain("Your notes");

    const withNotes = renderAppointmentBookedPatientEmail(
      buildNotificationContext({
        appointment: {
          ...buildNotificationContext().appointment,
          additionalNotes: "Recurring headaches",
        },
      }),
    );
    expect(withNotes.text).toContain("Your notes: Recurring headaches");
  });
});

describe("renderAppointmentBookedDoctorEmail", () => {
  it("addresses the doctor and names the patient", () => {
    const email = renderAppointmentBookedDoctorEmail(
      buildNotificationContext(),
    );

    expect(email.to).toBe("ananya.patel@example.com");
    expect(email.subject).toBe(
      "New appointment — Priya Sharma, Monday, Aug 3, 2026 at 2:00 PM – 3:00 PM",
    );
    expect(email.text).toContain("Hi Dr. Patel,");
    expect(email.text).toContain("Patient: Priya Sharma");
  });

  it("links to the doctor portal", () => {
    const email = renderAppointmentBookedDoctorEmail(
      buildNotificationContext(),
    );

    expect(email.html).toContain('href="https://healthmate.app/doctor"');
  });

  it("escapes patient-supplied notes in the HTML body", () => {
    const email = renderAppointmentBookedDoctorEmail(
      buildNotificationContext({
        appointment: {
          ...buildNotificationContext().appointment,
          additionalNotes: '<img src=x onerror="alert(1)">',
        },
      }),
    );

    expect(email.html).not.toContain("<img");
    expect(email.html).toContain("&lt;img");
  });
});
