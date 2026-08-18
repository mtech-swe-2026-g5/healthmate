import {
  buildBookingUrl,
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
import type {
  AppointmentNotificationContext,
  EmailMessage,
  NotificationAudience,
} from "../types";

function buildIntro(
  doctorName: string,
  cancelledBy: NotificationAudience | undefined,
): string {
  if (cancelledBy === "patient") {
    return `Your consultation with ${doctorName} has been cancelled as requested. Nothing further is needed.`;
  }
  if (cancelledBy === "doctor") {
    return `${doctorName} has cancelled this consultation. We are sorry for the disruption — you can book another slot below.`;
  }
  return `Your consultation with ${doctorName} has been cancelled.`;
}

/** Cancellation notice for the patient who held the appointment. */
export function renderAppointmentCancelledPatientEmail(
  context: AppointmentNotificationContext,
): EmailMessage {
  const { appointment, patient, doctor, details } = context;
  const doctorName = formatDoctorName(doctor);
  const day = formatAppointmentDay(appointment);
  const timeRange = formatAppointmentTimeRange(appointment);

  const rows: EmailDetailRow[] = [
    { label: "Booking reference", value: appointment.bookingReference },
    { label: "Doctor", value: doctorName },
    { label: "Specialization", value: doctor.specialization },
    { label: "Cancelled date", value: day },
    { label: "Cancelled time", value: timeRange },
    { label: "Reason for visit", value: appointment.reasonForVisit },
  ];

  const layout: EmailLayoutInput = {
    preheader: `Cancelled — ${doctorName} on ${day}`,
    badge: "Appointment cancelled",
    heading: "Your appointment has been cancelled",
    greeting: `Hi ${patient.firstName},`,
    intro: buildIntro(doctorName, details?.cancelledBy),
    rows,
    ctaLabel: "Book another appointment",
    ctaUrl: buildBookingUrl(),
    outro:
      "If you did not expect this cancellation, contact the clinic and we will look into it.",
  };

  return {
    to: patient.email,
    subject: `Appointment cancelled — ${doctorName}, ${day} at ${timeRange}`,
    html: renderEmailHtml(layout),
    text: renderEmailText(layout),
  };
}
