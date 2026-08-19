import {
  buildPatientAppointmentUrl,
  formatAppointmentDay,
  formatAppointmentTimeRange,
  formatDoctorName,
} from "../lib/appointment-format";
import {
  renderEmailHtml,
  renderEmailText,
  type EmailDetailRow,
  type EmailLayoutInput,
} from "../lib/email-layout";
import type { AppointmentNotificationContext, EmailMessage } from "../types";

function buildPatientReminderEmail(
  context: AppointmentNotificationContext,
  options: {
    badge: string;
    heading: string;
    intro: string;
    subjectPrefix: string;
  },
): EmailMessage {
  const { appointment, patient, doctor } = context;
  const doctorName = formatDoctorName(doctor);
  const day = formatAppointmentDay(appointment);
  const timeRange = formatAppointmentTimeRange(appointment);

  const rows: EmailDetailRow[] = [
    { label: "Booking reference", value: appointment.bookingReference },
    { label: "Doctor", value: doctorName },
    { label: "Specialization", value: doctor.specialization },
    { label: "Date", value: day },
    { label: "Time", value: timeRange },
    { label: "Reason for visit", value: appointment.reasonForVisit },
  ];

  const layout: EmailLayoutInput = {
    preheader: `${doctorName} on ${day} at ${timeRange}`,
    badge: options.badge,
    heading: options.heading,
    greeting: `Hi ${patient.firstName},`,
    intro: options.intro,
    rows,
    ctaLabel: "View appointment",
    ctaUrl: buildPatientAppointmentUrl(appointment.id),
    outro:
      "Please review the appointment details in your HealthMate portal if anything has changed.",
  };

  return {
    to: patient.email,
    subject: `${options.subjectPrefix} — ${doctorName}, ${day} at ${timeRange}`,
    html: renderEmailHtml(layout),
    text: renderEmailText(layout),
  };
}

export function renderAppointmentReminder8amPatientEmail(
  context: AppointmentNotificationContext,
): EmailMessage {
  return buildPatientReminderEmail(context, {
    badge: "Today's appointment",
    heading: "Reminder: you have an appointment today",
    intro:
      "This is your morning reminder for today's appointment. Please plan to arrive on time.",
    subjectPrefix: "Today's appointment reminder",
  });
}

export function renderAppointmentReminder60MinPatientEmail(
  context: AppointmentNotificationContext,
): EmailMessage {
  return buildPatientReminderEmail(context, {
    badge: "Appointment in about 1 hour",
    heading: "Reminder: your appointment is coming up soon",
    intro:
      "Your appointment starts within the next hour. Please be ready to join or arrive soon.",
    subjectPrefix: "1-hour appointment reminder",
  });
}

export function renderAppointmentReminder30MinPatientEmail(
  context: AppointmentNotificationContext,
): EmailMessage {
  return buildPatientReminderEmail(context, {
    badge: "Appointment in 30 minutes",
    heading: "Reminder: your appointment starts soon",
    intro:
      "Your appointment starts within the next 30 minutes. Please make your way to the clinic or be ready to join.",
    subjectPrefix: "30-minute appointment reminder",
  });
}
