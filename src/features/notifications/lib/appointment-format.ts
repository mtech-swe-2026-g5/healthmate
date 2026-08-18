import {
  formatAppointmentTime,
  formatAppointmentWeekdayDate,
} from "@/features/appointments/lib/date-utils";

import { getAppUrl } from "./email-config";
import type { AppointmentNotificationContext } from "../types";

type Appointment = AppointmentNotificationContext["appointment"];

export function formatDoctorName(
  doctor: AppointmentNotificationContext["doctor"],
): string {
  return `Dr. ${doctor.firstName} ${doctor.lastName}`;
}

export function formatPatientName(
  patient: AppointmentNotificationContext["patient"],
): string {
  return `${patient.firstName} ${patient.lastName}`;
}

/** Clinic-local weekday date, e.g. "Monday, Aug 3, 2026". */
export function formatAppointmentDay(appointment: Appointment): string {
  return formatAppointmentWeekdayDate(appointment.startsAt.toISOString());
}

/** Clinic-local time range, e.g. "2:00 PM – 3:00 PM". */
export function formatAppointmentTimeRange(appointment: Appointment): string {
  const start = formatAppointmentTime(appointment.startsAt.toISOString());
  const end = formatAppointmentTime(appointment.endsAt.toISOString());
  return `${start} – ${end}`;
}

/**
 * Slot the appointment held before a reschedule, e.g.
 * "Monday, Aug 3, 2026 at 2:00 PM – 3:00 PM". Null when the caller did not
 * supply it, so templates can omit the row entirely.
 */
export function formatPreviousSlot(
  details: AppointmentNotificationContext["details"],
): string | null {
  if (!details?.previousStartsAt || !details.previousEndsAt) return null;

  const previous = {
    startsAt: details.previousStartsAt,
    endsAt: details.previousEndsAt,
  } as Appointment;

  return `${formatAppointmentDay(previous)} at ${formatAppointmentTimeRange(previous)}`;
}

/** Deep link to the patient's appointment detail page. */
export function buildPatientAppointmentUrl(appointmentId: string): string {
  return `${getAppUrl()}/appointments/${appointmentId}`;
}

/** Doctors have no per-appointment route yet — link the dashboard. */
export function buildDoctorPortalUrl(): string {
  return `${getAppUrl()}/doctor`;
}

/** Where a patient goes to book a replacement after a cancellation. */
export function buildBookingUrl(): string {
  return `${getAppUrl()}/appointments/book`;
}
