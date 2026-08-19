import type { AppRole } from "@/config/routes";

import type { NOTIFICATION_AUDIENCES } from "../constants";

export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number];

/**
 * Account lifecycle notification. Registration data is already in hand when the
 * account is created, so unlike appointment events this needs no database read.
 */
export type WelcomeEmailInput = {
  email: string;
  firstName: string;
  role: AppRole;
};

/**
 * Appointment lifecycle events that can raise a notification.
 * All three have templates registered and a caller: booking dispatches from
 * `createAppointment`, the other two from the appointment transition services.
 */
export type AppointmentNotificationEvent =
  | "appointment.booked"
  | "appointment.cancelled"
  | "appointment.rescheduled"
  | "appointment.reminder.8am"
  | "appointment.reminder.60min"
  | "appointment.reminder.30min";

/**
 * Event facts the appointment row cannot supply after the transition.
 * The caller passes these to the dispatcher; every field is optional and every
 * template degrades to neutral copy when one is absent.
 */
export type AppointmentEventDetails = {
  /** Slot the appointment occupied before a reschedule. */
  previousStartsAt?: Date;
  previousEndsAt?: Date;
  /** Who initiated a cancellation, when known. */
  cancelledBy?: NotificationAudience;
};

/** Everything a template needs, resolved once per dispatch. */
export type AppointmentNotificationContext = {
  details?: AppointmentEventDetails;
  appointment: {
    id: string;
    bookingReference: string;
    startsAt: Date;
    endsAt: Date;
    reasonForVisit: string;
    additionalNotes: string | null;
  };
  patient: {
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  doctor: {
    userId: string;
    firstName: string;
    lastName: string;
    specialization: string;
    email: string;
  };
};

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type AppointmentEmailTemplate = (
  context: AppointmentNotificationContext,
) => EmailMessage;

/** One template per audience for a given event. */
export type AppointmentEmailTemplateSet = Record<
  NotificationAudience,
  AppointmentEmailTemplate
>;

export type EmailDeliveryStatus = "sent" | "skipped" | "failed";

export type EmailDeliveryResult = {
  status: EmailDeliveryStatus;
  attempts: number;
};

export type NotificationDispatchResult = {
  event: AppointmentNotificationEvent;
  appointmentId: string;
  deliveries: Array<{
    audience: NotificationAudience;
    status: EmailDeliveryStatus;
    attempts: number;
  }>;
};

export type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  auth: { user: string; pass: string } | null;
  from: string;
};
