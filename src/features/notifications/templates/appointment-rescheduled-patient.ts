import {
  buildPatientAppointmentUrl,
  formatAppointmentDay,
  formatAppointmentTimeRange,
  formatDoctorName,
  formatPreviousSlot,
} from "../lib/appointment-format";
import {
  renderEmailHtml,
  renderEmailText,
  type EmailDetailRow,
  type EmailLayoutInput,
} from "../lib/email-layout";
import type { AppointmentNotificationContext, EmailMessage } from "../types";

/** Reschedule notice for the patient who holds the appointment. */
export function renderAppointmentRescheduledPatientEmail(
  context: AppointmentNotificationContext,
): EmailMessage {
  const { appointment, patient, doctor, details } = context;
  const doctorName = formatDoctorName(doctor);
  const day = formatAppointmentDay(appointment);
  const timeRange = formatAppointmentTimeRange(appointment);
  const previousSlot = formatPreviousSlot(details);

  const rows: EmailDetailRow[] = [
    { label: "Booking reference", value: appointment.bookingReference },
    { label: "Doctor", value: doctorName },
    { label: "Specialization", value: doctor.specialization },
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
    heading: "Your appointment has moved",
    greeting: `Hi ${patient.firstName},`,
    intro: previousSlot
      ? `Your consultation with ${doctorName} has moved from ${previousSlot} to the time below.`
      : `Your consultation with ${doctorName} has been rescheduled. The new time is below.`,
    rows,
    ctaLabel: "View appointment",
    ctaUrl: buildPatientAppointmentUrl(appointment.id),
    outro:
      "Please arrive 10 minutes early. Your booking reference has not changed.",
  };

  return {
    to: patient.email,
    subject: `Appointment rescheduled — ${doctorName}, now ${day} at ${timeRange}`,
    html: renderEmailHtml(layout),
    text: renderEmailText(layout),
  };
}
