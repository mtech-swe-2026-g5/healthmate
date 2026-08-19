import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAppointmentEmailTemplates,
  renderAppointmentReminder30MinDoctorEmail,
  renderAppointmentReminder30MinPatientEmail,
  renderAppointmentReminder60MinDoctorEmail,
  renderAppointmentReminder60MinPatientEmail,
  renderAppointmentReminder8amDoctorEmail,
  renderAppointmentReminder8amPatientEmail,
} from "@/features/notifications/templates";

import { buildNotificationContext } from "../notification.mock";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://healthmate.app");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("appointment reminder template registry", () => {
  it("registers patient and doctor templates for all reminder events", () => {
    const events = [
      "appointment.reminder.8am",
      "appointment.reminder.60min",
      "appointment.reminder.30min",
    ] as const;

    for (const event of events) {
      const templates = getAppointmentEmailTemplates(event);
      expect(typeof templates?.patient).toBe("function");
      expect(typeof templates?.doctor).toBe("function");
    }
  });
});

describe("patient reminder templates", () => {
  it("renders the 8am reminder with the patient deep link", () => {
    const email = renderAppointmentReminder8amPatientEmail(
      buildNotificationContext(),
    );

    expect(email.to).toBe("priya.sharma@example.com");
    expect(email.subject).toContain("Today's appointment reminder");
    expect(email.text).toContain("Reminder: you have an appointment today");
    expect(email.text).toContain(
      "View appointment: https://healthmate.app/appointments/appt-1",
    );
  });

  it("renders the 60-minute and 30-minute reminders with different urgency copy", () => {
    const email60 = renderAppointmentReminder60MinPatientEmail(
      buildNotificationContext(),
    );
    const email30 = renderAppointmentReminder30MinPatientEmail(
      buildNotificationContext(),
    );

    expect(email60.subject).toContain("1-hour appointment reminder");
    expect(email60.text).toContain("within the next hour");
    expect(email30.subject).toContain("30-minute appointment reminder");
    expect(email30.text).toContain("within the next 30 minutes");
  });
});

describe("doctor reminder templates", () => {
  it("renders the 8am reminder with the doctor portal link", () => {
    const email = renderAppointmentReminder8amDoctorEmail(
      buildNotificationContext(),
    );

    expect(email.to).toBe("ananya.patel@example.com");
    expect(email.subject).toContain("Today's appointment reminder");
    expect(email.text).toContain("Hi Dr. Patel,");
    expect(email.html).toContain('href="https://healthmate.app/doctor"');
  });

  it("renders the 60-minute and 30-minute reminders with different urgency copy", () => {
    const email60 = renderAppointmentReminder60MinDoctorEmail(
      buildNotificationContext(),
    );
    const email30 = renderAppointmentReminder30MinDoctorEmail(
      buildNotificationContext(),
    );

    expect(email60.subject).toContain("1-hour appointment reminder");
    expect(email60.text).toContain("within the next hour");
    expect(email30.subject).toContain("30-minute appointment reminder");
    expect(email30.text).toContain("within the next 30 minutes");
  });
});
