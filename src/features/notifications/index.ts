export {
  scheduleAppointmentNotifications,
  sendAppointmentNotifications,
  getAppointmentNotificationContext,
  scheduleWelcomeEmail,
  sendWelcomeEmail,
} from "./services";

export { getAppointmentEmailTemplates, renderWelcomeEmail } from "./templates";

export { sendEmail } from "./lib/mailer";
export { getSmtpConfig, isEmailNotificationsEnabled } from "./lib/email-config";
export { resetTransporter } from "./lib/transport";

export type {
  AppointmentEmailTemplate,
  AppointmentEmailTemplateSet,
  AppointmentEventDetails,
  AppointmentNotificationContext,
  AppointmentNotificationEvent,
  EmailDeliveryResult,
  EmailDeliveryStatus,
  EmailMessage,
  NotificationAudience,
  NotificationDispatchResult,
  SmtpConfig,
  WelcomeEmailInput,
} from "./types";
