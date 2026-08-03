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
import type {
  AppointmentNotificationContext,
  EmailMessage,
  NotificationAudience,
} from "../types";

function buildIntro(
  patientName: string,
  cancelledBy: NotificationAudience | undefined,
): string {
  if (cancelledBy === "patient") {
    return `${patientName} cancelled this consultation. The slot is free again on your schedule.`;
  }
  if (cancelledBy === "doctor") {
    return `This consultation was cancelled from your portal. The slot is free again on your schedule.`;
  }
  return `This consultation has been cancelled. The slot is free again on your schedule.`;
}

/** Cancellation notice for the doctor whose slot was freed. */
export function renderAppointmentCancelledDoctorEmail(
  context: AppointmentNotificationContext,
): EmailMessage {
  const { appointment, patient, doctor, details } = context;
  const patientName = formatPatientName(patient);
  const day = formatAppointmentDay(appointment);
  const timeRange = formatAppointmentTimeRange(appointment);

  const rows: EmailDetailRow[] = [
    { label: "Booking reference", value: appointment.bookingReference },
    { label: "Patient", value: patientName },
    { label: "Cancelled date", value: day },
    { label: "Cancelled time", value: timeRange },
    { label: "Reason for visit", value: appointment.reasonForVisit },
  ];

  const layout: EmailLayoutInput = {
    preheader: `Cancelled — ${patientName} on ${day}`,
    badge: "Appointment cancelled",
    heading: "An appointment has been cancelled",
    greeting: `Hi Dr. ${doctor.lastName},`,
    intro: buildIntro(patientName, details?.cancelledBy),
    rows,
    ctaLabel: "Open doctor dashboard",
    ctaUrl: buildDoctorPortalUrl(),
    outro:
      "Your updated schedule is available in the HealthMate doctor portal.",
  };

  return {
    to: doctor.email,
    subject: `Appointment cancelled — ${patientName}, ${day} at ${timeRange}`,
    html: renderEmailHtml(layout),
    text: renderEmailText(layout),
  };
}
