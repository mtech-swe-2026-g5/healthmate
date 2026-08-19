import { AppointmentStatus } from "@prisma/client";
import { DateTime } from "luxon";

import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";
import { prisma } from "@/lib/prisma";

import { sendAppointmentNotifications } from "./dispatch";
import type { AppointmentNotificationEvent } from "../types";

type ReminderDispatchSummary = {
  event: AppointmentNotificationEvent;
  appointmentsConsidered: number;
  deliveriesAttempted: number;
};

export type ReminderJobResult = {
  runAt: string;
  summaries: ReminderDispatchSummary[];
};

async function dispatchForAppointments(
  appointmentIds: string[],
  event: AppointmentNotificationEvent,
): Promise<ReminderDispatchSummary> {
  let deliveriesAttempted = 0;

  for (const appointmentId of appointmentIds) {
    const result = await sendAppointmentNotifications(event, appointmentId);
    deliveriesAttempted += result.deliveries.filter(
      (delivery) => delivery.status !== "skipped",
    ).length;
  }

  return {
    event,
    appointmentsConsidered: appointmentIds.length,
    deliveriesAttempted,
  };
}

export async function sendDueAppointmentReminders(
  now = DateTime.now().setZone(CLINIC_TIMEZONE),
): Promise<ReminderJobResult> {
  const nowUtc = now.toUTC().toJSDate();
  const plus30Utc = now.plus({ minutes: 30 }).toUTC().toJSDate();
  const plus60Utc = now.plus({ minutes: 60 }).toUTC().toJSDate();

  const todayStartUtc = now.startOf("day").toUTC().toJSDate();
  const tomorrowStartUtc = now.plus({ days: 1 }).startOf("day").toUTC().toJSDate();

  const [todayAppointments, appointments30Min, appointments60Min] =
    await Promise.all([
      now.hour >= 8
        ? prisma.appointment.findMany({
            where: {
              status: AppointmentStatus.CONFIRMED,
              startsAt: { gte: todayStartUtc, lt: tomorrowStartUtc },
            },
            select: { id: true },
          })
        : Promise.resolve([]),
      prisma.appointment.findMany({
        where: {
          status: AppointmentStatus.CONFIRMED,
          startsAt: { gte: nowUtc, lte: plus30Utc },
        },
        select: { id: true },
      }),
      prisma.appointment.findMany({
        where: {
          status: AppointmentStatus.CONFIRMED,
          startsAt: { gt: plus30Utc, lte: plus60Utc },
        },
        select: { id: true },
      }),
    ]);

  const summaries = await Promise.all([
    dispatchForAppointments(
      todayAppointments.map((appointment) => appointment.id),
      "appointment.reminder.8am",
    ),
    dispatchForAppointments(
      appointments60Min.map((appointment) => appointment.id),
      "appointment.reminder.60min",
    ),
    dispatchForAppointments(
      appointments30Min.map((appointment) => appointment.id),
      "appointment.reminder.30min",
    ),
  ]);

  return {
    runAt: now.toISO() ?? now.toString(),
    summaries,
  };
}
