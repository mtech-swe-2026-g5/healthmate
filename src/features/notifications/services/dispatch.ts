import { logger } from "@/lib/logger";

import { NOTIFICATION_AUDIENCES } from "../constants";
import { sendEmail } from "../lib/mailer";
import { runAfterResponse } from "../lib/scheduler";
import { getAppointmentEmailTemplates } from "../templates";
import type {
  AppointmentEventDetails,
  AppointmentNotificationEvent,
  NotificationDispatchResult,
} from "../types";
import { getAppointmentNotificationContext } from "./recipients";

/**
 * Renders and delivers every registered email for an appointment event.
 *
 * Each audience is delivered independently — a failure for one recipient never
 * prevents the other from being notified, and nothing here throws.
 *
 * @param event - Appointment lifecycle event that fired
 * @param appointmentId - Appointment the notification is about
 * @param details - Facts the appointment row no longer holds after the
 *   transition, such as the pre-reschedule slot or who cancelled
 * @returns Per-audience delivery outcome
 */
export async function sendAppointmentNotifications(
  event: AppointmentNotificationEvent,
  appointmentId: string,
  details?: AppointmentEventDetails,
): Promise<NotificationDispatchResult> {
  const result: NotificationDispatchResult = {
    event,
    appointmentId,
    deliveries: [],
  };

  const templates = getAppointmentEmailTemplates(event);
  if (!templates) {
    logger.info("No email templates registered for event", { event });
    return result;
  }

  const context = await getAppointmentNotificationContext(appointmentId);
  if (!context) {
    logger.warn("Appointment notification skipped — context unavailable", {
      event,
      appointmentId,
    });
    return result;
  }

  for (const audience of NOTIFICATION_AUDIENCES) {
    const logContext = {
      event,
      audience,
      bookingReference: context.appointment.bookingReference,
    };

    try {
      const message = templates[audience]({ ...context, details });
      const delivery = await sendEmail(message, logContext);
      result.deliveries.push({ audience, ...delivery });
    } catch (error) {
      logger.error("Appointment notification render failed", error, logContext);
      result.deliveries.push({ audience, status: "failed", attempts: 0 });
    }
  }

  return result;
}

/**
 * Fire-and-forget entry point for appointment flows.
 * Delivery runs after the HTTP response is flushed so the API is not blocked by
 * SMTP latency or retries.
 *
 * @param event - Appointment lifecycle event that fired
 * @param appointmentId - Appointment the notification is about
 * @param details - Facts the appointment row no longer holds after the
 *   transition, such as the pre-reschedule slot or who cancelled
 */
export function scheduleAppointmentNotifications(
  event: AppointmentNotificationEvent,
  appointmentId: string,
  details?: AppointmentEventDetails,
): void {
  runAfterResponse(async () => {
    await sendAppointmentNotifications(event, appointmentId, details);
  });
}
