import { renderAppointmentBookedDoctorEmail } from "./appointment-booked-doctor";
import { renderAppointmentBookedPatientEmail } from "./appointment-booked-patient";
import { renderAppointmentCancelledDoctorEmail } from "./appointment-cancelled-doctor";
import { renderAppointmentCancelledPatientEmail } from "./appointment-cancelled-patient";
import { renderAppointmentRescheduledDoctorEmail } from "./appointment-rescheduled-doctor";
import { renderAppointmentRescheduledPatientEmail } from "./appointment-rescheduled-patient";
import {
  renderAppointmentReminder30MinDoctorEmail,
  renderAppointmentReminder60MinDoctorEmail,
  renderAppointmentReminder8amDoctorEmail,
} from "./appointment-reminder-doctor";
import {
  renderAppointmentReminder30MinPatientEmail,
  renderAppointmentReminder60MinPatientEmail,
  renderAppointmentReminder8amPatientEmail,
} from "./appointment-reminder-patient";
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
  "appointment.reminder.8am": {
    patient: renderAppointmentReminder8amPatientEmail,
    doctor: renderAppointmentReminder8amDoctorEmail,
  },
  "appointment.reminder.60min": {
    patient: renderAppointmentReminder60MinPatientEmail,
    doctor: renderAppointmentReminder60MinDoctorEmail,
  },
  "appointment.reminder.30min": {
    patient: renderAppointmentReminder30MinPatientEmail,
    doctor: renderAppointmentReminder30MinDoctorEmail,
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
  renderAppointmentReminder8amDoctorEmail,
  renderAppointmentReminder8amPatientEmail,
  renderAppointmentReminder60MinDoctorEmail,
  renderAppointmentReminder60MinPatientEmail,
  renderAppointmentReminder30MinDoctorEmail,
  renderAppointmentReminder30MinPatientEmail,
  renderWelcomeEmail,
};
