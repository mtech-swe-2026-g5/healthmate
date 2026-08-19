import { DateTime } from "luxon";

import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";
import type { Appointment } from "@/features/doctor/appointments/types/response";
import type {
  DoctorCalendarEvent,
  DoctorCalendarSlotConfiguration,
} from "@/features/doctor/calendar/types";
import type { ScheduleBlockResponse } from "@/features/doctor/schedule/types/schemas";
import type { SlotConfigurationModel } from "@/lib/prisma";

type ScheduleBlockInput = Pick<
  ScheduleBlockResponse,
  "id" | "startsAt" | "endsAt" | "reason" | "blockType"
>;

function clinicDaysInBlock(startIso: string, endIso: string): DateTime[] {
  let cursor = DateTime.fromJSDate(new Date(startIso))
    .setZone(CLINIC_TIMEZONE)
    .startOf("day");
  const end = DateTime.fromJSDate(new Date(endIso))
    .setZone(CLINIC_TIMEZONE)
    .startOf("day");
  const days: DateTime[] = [];

  while (cursor <= end) {
    days.push(cursor);
    cursor = cursor.plus({ days: 1 });
  }

  return days;
}

/** Blocks that overlap a visible calendar range (inclusive, clinic timezone). */
export function filterBlocksForRange(
  blocks: ScheduleBlockResponse[],
  rangeStart: Date,
  rangeEnd: Date,
): ScheduleBlockResponse[] {
  return blocks.filter((block) => {
    const start = new Date(block.startsAt);
    const end = new Date(block.endsAt);
    return start <= rangeEnd && end >= rangeStart;
  });
}

export function mapAppointmentsToCalendarEvents(
  appointments: Appointment[] | undefined,
): DoctorCalendarEvent[] {
  return (
    appointments?.map((appointment) => ({
      id: appointment.id,
      title: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
      start: new Date(appointment.start),
      end: new Date(appointment.end),
      variant: "appointment" as const,
    })) ?? []
  );
}

export function mapBlocksToCalendarEvents(
  blocks: ScheduleBlockInput[],
): DoctorCalendarEvent[] {
  const events: DoctorCalendarEvent[] = [];

  for (const block of blocks) {
    const title =
      block.reason ?? (block.blockType === "BREAK" ? "Break" : "Closed");

    if (block.blockType === "TIME_OFF") {
      for (const day of clinicDaysInBlock(block.startsAt, block.endsAt)) {
        events.push({
          id: `block-${block.id}-${day.toISODate()}`,
          title,
          subtitle: "Closed",
          start: day.startOf("day").toJSDate(),
          end: day.endOf("day").toJSDate(),
          variant: "blocked",
          isAllDayClosed: true,
        });
      }
      continue;
    }

    events.push({
      id: `block-${block.id}`,
      title,
      start: new Date(block.startsAt),
      end: new Date(block.endsAt),
      variant: "blocked",
    });
  }

  return events;
}

export function mapSlotConfigurations(
  slots: Partial<SlotConfigurationModel>[] | undefined,
): DoctorCalendarSlotConfiguration[] | undefined {
  return slots?.map((slot) => ({
    dayOfWeek: slot.dayOfWeek as number,
    startTime: new Date(slot.startTime as Date),
    endTime: new Date(slot.endTime as Date),
    timezone: slot.timezone as string,
    validFrom: slot.validFrom ? new Date(slot.validFrom) : undefined,
    validUntil: slot.validUntil ? new Date(slot.validUntil) : null,
  }));
}

export function mergeCalendarEvents(
  ...groups: DoctorCalendarEvent[][]
): DoctorCalendarEvent[] {
  return groups.flat();
}
