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

/** Booking alert for the doctor whose slot was taken. */
export function renderAppointmentBookedDoctorEmail(
  context: AppointmentNotificationContext,
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

  if (appointment.additionalNotes) {
    rows.push({ label: "Patient notes", value: appointment.additionalNotes });
  }

  const layout: EmailLayoutInput = {
    preheader: `${patientName} on ${day} at ${timeRange}`,
    badge: "New booking",
    heading: "A new appointment has been booked",
    greeting: `Hi Dr. ${doctor.lastName},`,
    intro: `${patientName} booked a consultation with you. The slot is now blocked on your schedule.`,
    rows,
    ctaLabel: "Open doctor dashboard",
    ctaUrl: buildDoctorPortalUrl(),
    outro:
      "Full patient details are available in your HealthMate doctor portal.",
  };

  return {
    to: doctor.email,
    subject: `New appointment — ${patientName}, ${day} at ${timeRange}`,
    html: renderEmailHtml(layout),
    text: renderEmailText(layout),
  };
}
