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

/** Booking confirmation for the patient who made the booking. */
export function renderAppointmentBookedPatientEmail(
  context: AppointmentNotificationContext,
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

  if (appointment.additionalNotes) {
    rows.push({ label: "Your notes", value: appointment.additionalNotes });
  }

  const layout: EmailLayoutInput = {
    preheader: `${doctorName} on ${day} at ${timeRange}`,
    badge: "Appointment confirmed",
    heading: "Your appointment is confirmed",
    greeting: `Hi ${patient.firstName},`,
    intro: `Your consultation with ${doctorName} is booked. Keep this email for your records.`,
    rows,
    ctaLabel: "View appointment",
    ctaUrl: buildPatientAppointmentUrl(appointment.id),
    outro:
      "Please arrive 10 minutes early. You can review this appointment any time from your HealthMate portal.",
  };

  return {
    to: patient.email,
    subject: `Appointment confirmed — ${doctorName}, ${day} at ${timeRange}`,
    html: renderEmailHtml(layout),
    text: renderEmailText(layout),
  };
}
