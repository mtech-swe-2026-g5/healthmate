import { renderAppointmentBookedDoctorEmail } from "./appointment-booked-doctor";
import { renderAppointmentBookedPatientEmail } from "./appointment-booked-patient";
import { renderAppointmentCancelledDoctorEmail } from "./appointment-cancelled-doctor";
import { renderAppointmentCancelledPatientEmail } from "./appointment-cancelled-patient";
import { renderAppointmentRescheduledDoctorEmail } from "./appointment-rescheduled-doctor";
import { renderAppointmentRescheduledPatientEmail } from "./appointment-rescheduled-patient";
import { renderWelcomeEmail } from "./account-welcome";
import type {
  AppointmentEmailTemplateSet,
  AppointmentNotificationEvent,
} from "../types";

/**
 * Event → per-audience template registry.
 *
 * Every appointment event has templates and a caller. Adding another means
 * registering it here and calling
 * `scheduleAppointmentNotifications('<event>', id, details)` from the service
 * that performs the transition.
 */
const APPOINTMENT_EMAIL_TEMPLATES: Record<
  AppointmentNotificationEvent,
  AppointmentEmailTemplateSet
> = {
  "appointment.booked": {
    patient: renderAppointmentBookedPatientEmail,
    doctor: renderAppointmentBookedDoctorEmail,
  },
  "appointment.cancelled": {
    patient: renderAppointmentCancelledPatientEmail,
    doctor: renderAppointmentCancelledDoctorEmail,
  },
  "appointment.rescheduled": {
    patient: renderAppointmentRescheduledPatientEmail,
    doctor: renderAppointmentRescheduledDoctorEmail,
  },
};

export function getAppointmentEmailTemplates(
  event: AppointmentNotificationEvent,
): AppointmentEmailTemplateSet | null {
  return APPOINTMENT_EMAIL_TEMPLATES[event] ?? null;
}

export {
  renderAppointmentBookedDoctorEmail,
  renderAppointmentBookedPatientEmail,
  renderAppointmentCancelledDoctorEmail,
  renderAppointmentCancelledPatientEmail,
  renderAppointmentRescheduledDoctorEmail,
  renderAppointmentRescheduledPatientEmail,
  renderWelcomeEmail,
};
