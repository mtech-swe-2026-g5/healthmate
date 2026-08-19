import {
  AppointmentNotificationStatus,
  AppointmentNotificationType,
  Prisma,
} from "@prisma/client";
import { DateTime } from "luxon";

import { logger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";

import { NOTIFICATION_AUDIENCES } from "../constants";
import { sendEmail } from "../lib/mailer";
import { runAfterResponse } from "../lib/scheduler";
import { getAppointmentEmailTemplates } from "../templates";
import type {
  AppointmentEventDetails,
  AppointmentNotificationEvent,
  NotificationAudience,
  NotificationDispatchResult,
} from "../types";
import { getAppointmentNotificationContext } from "./recipients";

function toNotificationType(
  event: AppointmentNotificationEvent,
): AppointmentNotificationType {
  switch (event) {
    case "appointment.booked":
      return AppointmentNotificationType.ACTION_BOOKED;
    case "appointment.cancelled":
      return AppointmentNotificationType.ACTION_CANCELLED;
    case "appointment.rescheduled":
      return AppointmentNotificationType.ACTION_RESCHEDULED;
    case "appointment.reminder.8am":
      return AppointmentNotificationType.REMINDER_8AM;
    case "appointment.reminder.60min":
      return AppointmentNotificationType.REMINDER_60MIN;
    case "appointment.reminder.30min":
      return AppointmentNotificationType.REMINDER_30MIN;
  }
}

function recipientForAudience(
  audience: NotificationAudience,
  context: Awaited<ReturnType<typeof getAppointmentNotificationContext>>,
) {
  return audience === "patient" ? context?.patient : context?.doctor;
}

function getNotificationDedupeKey(
  event: AppointmentNotificationEvent,
  context: Awaited<ReturnType<typeof getAppointmentNotificationContext>>,
  details?: AppointmentEventDetails,
): string {
  const startsAtIso = context?.appointment.startsAt.toISOString() ?? "missing";

  switch (event) {
    case "appointment.booked":
    case "appointment.cancelled":
      return context?.appointment.bookingReference ?? startsAtIso;
    case "appointment.rescheduled":
      return `${details?.previousStartsAt?.toISOString() ?? "unknown"}->${startsAtIso}`;
    case "appointment.reminder.8am":
      return DateTime.fromJSDate(context!.appointment.startsAt, { zone: "utc" })
        .setZone(CLINIC_TIMEZONE)
        .toISODate()!;
    case "appointment.reminder.60min":
    case "appointment.reminder.30min":
      return startsAtIso;
  }
}

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
    const recipient = recipientForAudience(audience, context);
    if (!recipient) continue;

    const logContext = {
      event,
      audience,
      bookingReference: context.appointment.bookingReference,
    };
    const notificationType = toNotificationType(event);
    const dedupeKey = getNotificationDedupeKey(event, context, details);

    try {
      await prisma.appointmentNotificationLog.create({
        data: {
          appointmentId,
          recipientUserId: recipient.userId,
          notificationType,
          dedupeKey,
          status: AppointmentNotificationStatus.PENDING,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        result.deliveries.push({ audience, status: "skipped", attempts: 0 });
        continue;
      }
      logger.error(
        "Appointment notification log claim failed",
        error,
        logContext,
      );
      result.deliveries.push({ audience, status: "failed", attempts: 0 });
      continue;
    }

    try {
      const message = templates[audience]({ ...context, details });
      const delivery = await sendEmail(message, logContext);
      await prisma.appointmentNotificationLog.updateMany({
        where: {
          appointmentId,
          recipientUserId: recipient.userId,
          notificationType,
          dedupeKey,
        },
        data: {
          status:
            delivery.status === "sent"
              ? AppointmentNotificationStatus.SUCCESS
              : AppointmentNotificationStatus.FAILED,
          errorMessage:
            delivery.status === "sent"
              ? null
              : "Email delivery skipped or failed.",
          sentAt: delivery.status === "sent" ? new Date() : null,
        },
      });
      result.deliveries.push({ audience, ...delivery });
    } catch (error) {
      logger.error("Appointment notification render failed", error, logContext);
      await prisma.appointmentNotificationLog.updateMany({
        where: {
          appointmentId,
          recipientUserId: recipient.userId,
          notificationType,
          dedupeKey,
        },
        data: {
          status: AppointmentNotificationStatus.FAILED,
          errorMessage:
            error instanceof Error ? error.message : "Unknown error",
          sentAt: null,
        },
      });
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
