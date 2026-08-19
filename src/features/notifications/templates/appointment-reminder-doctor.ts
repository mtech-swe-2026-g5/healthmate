import {
  buildDoctorPortalUrl,
  formatAppointmentDay,
  formatAppointmentTimeRange,
  formatPatientName,
} from "../lib/appointment-format";
import {
  renderEmailHtml,
  renderEmailText,
  type EmailDetailRow,
  type EmailLayoutInput,
} from "../lib/email-layout";
import type { AppointmentNotificationContext, EmailMessage } from "../types";

function buildDoctorReminderEmail(
  context: AppointmentNotificationContext,
  options: {
    badge: string;
    heading: string;
    intro: string;
    subjectPrefix: string;
  },
): EmailMessage {
  const { appointment, patient, doctor } = context;
  const patientName = formatPatientName(patient);
  const day = formatAppointmentDay(appointment);
  const timeRange = formatAppointmentTimeRange(appointment);

  const rows: EmailDetailRow[] = [
    { label: "Booking reference", value: appointment.bookingReference },
    { label: "Patient", value: patientName },
    { label: "Date", value: day },
    { label: "Time", value: timeRange },
    { label: "Reason for visit", value: appointment.reasonForVisit },
  ];

  const layout: EmailLayoutInput = {
    preheader: `${patientName} on ${day} at ${timeRange}`,
    badge: options.badge,
    heading: options.heading,
    greeting: `Hi Dr. ${doctor.lastName},`,
    intro: options.intro,
    rows,
    ctaLabel: "Open doctor dashboard",
    ctaUrl: buildDoctorPortalUrl(),
    outro:
      "You can review the latest appointment list and schedule context in the doctor portal.",
  };

  return {
    to: doctor.email,
    subject: `${options.subjectPrefix} — ${patientName}, ${day} at ${timeRange}`,
    html: renderEmailHtml(layout),
    text: renderEmailText(layout),
  };
}

export function renderAppointmentReminder8amDoctorEmail(
  context: AppointmentNotificationContext,
): EmailMessage {
  return buildDoctorReminderEmail(context, {
    badge: "Today's appointment",
    heading: "Reminder: you have appointments scheduled today",
    intro:
      "This is your morning reminder for today's clinic schedule. Please review the upcoming appointment below.",
    subjectPrefix: "Today's appointment reminder",
  });
}

export function renderAppointmentReminder60MinDoctorEmail(
  context: AppointmentNotificationContext,
): EmailMessage {
  return buildDoctorReminderEmail(context, {
    badge: "Appointment in about 1 hour",
    heading: "Reminder: an appointment is coming up soon",
    intro:
      "You have an appointment starting within the next hour. Please review the schedule and prepare if needed.",
    subjectPrefix: "1-hour appointment reminder",
  });
}

export function renderAppointmentReminder30MinDoctorEmail(
  context: AppointmentNotificationContext,
): EmailMessage {
  return buildDoctorReminderEmail(context, {
    badge: "Appointment in 30 minutes",
    heading: "Reminder: an appointment starts soon",
    intro:
      "You have an appointment starting within the next 30 minutes. Please be ready for the consultation.",
    subjectPrefix: "30-minute appointment reminder",
  });
}
