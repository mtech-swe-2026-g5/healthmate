import {
  buildDoctorPortalUrl,
  formatAppointmentDay,
  formatAppointmentTimeRange,
  formatPatientName,
  formatPreviousSlot,
} from "../lib/appointment-format";
import {
  renderEmailHtml,
  renderEmailText,
  type EmailDetailRow,
  type EmailLayoutInput,
} from "../lib/email-layout";
import type { AppointmentNotificationContext, EmailMessage } from "../types";

/** Reschedule notice for the doctor whose schedule changed. */
export function renderAppointmentRescheduledDoctorEmail(
  context: AppointmentNotificationContext,
): EmailMessage {
  const { appointment, patient, doctor, details } = context;
  const patientName = formatPatientName(patient);
  const day = formatAppointmentDay(appointment);
  const timeRange = formatAppointmentTimeRange(appointment);
  const previousSlot = formatPreviousSlot(details);

  const rows: EmailDetailRow[] = [
    { label: "Booking reference", value: appointment.bookingReference },
    { label: "Patient", value: patientName },
  ];

  if (previousSlot) {
    rows.push({ label: "Previous slot", value: previousSlot });
  }

  rows.push(
    { label: "New date", value: day },
    { label: "New time", value: timeRange },
    { label: "Reason for visit", value: appointment.reasonForVisit },
  );

  const layout: EmailLayoutInput = {
    preheader: `Moved to ${day} at ${timeRange}`,
    badge: "Appointment rescheduled",
    heading: "An appointment has moved",
    greeting: `Hi Dr. ${doctor.lastName},`,
    intro: previousSlot
      ? `${patientName}'s consultation has moved from ${previousSlot} to the time below. Both slots are updated on your schedule.`
      : `${patientName}'s consultation has been rescheduled. Your schedule is updated.`,
    rows,
    ctaLabel: "Open doctor dashboard",
    ctaUrl: buildDoctorPortalUrl(),
    outro:
      "Your updated schedule is available in the HealthMate doctor portal.",
  };

  return {
    to: doctor.email,
    subject: `Appointment rescheduled — ${patientName}, now ${day} at ${timeRange}`,
    html: renderEmailHtml(layout),
    text: renderEmailText(layout),
  };
}
