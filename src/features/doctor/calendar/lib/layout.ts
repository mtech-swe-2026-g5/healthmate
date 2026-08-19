import { DateTime } from "luxon";

import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";

export const ROW_HEIGHT_PX = 64;
export const TIME_COLUMN_WIDTH_PX = 72;
export const DAY_HEADER_HEIGHT_PX = 64;
export const DEFAULT_GRID_START_HOUR = 8;
export const DEFAULT_GRID_END_HOUR = 19;

export type PlacedEvent = {
  id: string;
  dayIndex: number;
  top: number;
  height: number;
  title: string;
  variant: "appointment" | "blocked";
  subtitle?: string;
  isAllDayClosed?: boolean;
};

export function getWeekDayColumns(weekStart: Date): DateTime[] {
  const start = DateTime.fromJSDate(weekStart)
    .setZone(CLINIC_TIMEZONE)
    .startOf("day");
  return Array.from({ length: 7 }, (_, index) => start.plus({ days: index }));
}

export function resolveGridBounds(
  slotConfigurations: Array<{ startTime: Date; endTime: Date }> | undefined,
): { startHour: number; endHour: number } {
  if (!slotConfigurations?.length) {
    return {
      startHour: DEFAULT_GRID_START_HOUR,
      endHour: DEFAULT_GRID_END_HOUR,
    };
  }

  let startHour = 24;
  let endHour = 0;
  for (const config of slotConfigurations) {
    startHour = Math.min(startHour, config.startTime.getUTCHours());
    endHour = Math.max(endHour, config.endTime.getUTCHours());
  }

  return {
    startHour: Math.max(0, startHour - 1),
    endHour: Math.min(23, endHour + 1),
  };
}

export function buildHourLabels(startHour: number, endHour: number): number[] {
  const labels: number[] = [];
  for (let hour = startHour; hour <= endHour; hour += 1) {
    labels.push(hour);
  }
  return labels;
}

function clinicDateTime(instant: Date | string): DateTime {
  const date = instant instanceof Date ? instant : new Date(instant);
  return DateTime.fromJSDate(date).setZone(CLINIC_TIMEZONE);
}

export function minutesFromGridStart(
  instant: Date,
  gridStartHour: number,
): number {
  const zoned = clinicDateTime(instant);
  return (zoned.hour - gridStartHour) * 60 + zoned.minute;
}

export function placeTimedEvents(
  events: Array<{
    id: string;
    title: string;
    start: Date;
    end: Date;
    variant: "appointment" | "blocked";
    subtitle?: string;
    isAllDayClosed?: boolean;
  }>,
  weekStart: Date,
  gridStartHour: number,
  gridEndHour: number,
): PlacedEvent[] {
  const days = getWeekDayColumns(weekStart);
  const hourCount = gridEndHour - gridStartHour + 1;
  const gridHeightMinutes = hourCount * 60;
  const gridHeightPx = hourCount * ROW_HEIGHT_PX;
  const placed: PlacedEvent[] = [];

  for (const event of events) {
    const start = clinicDateTime(event.start);
    const _end = clinicDateTime(event.end);
    const dayIndex = days.findIndex((day) => day.hasSame(start, "day"));
    if (dayIndex < 0) continue;

    if (event.isAllDayClosed) {
      placed.push({
        id: event.id,
        dayIndex,
        top: 0,
        height: gridHeightPx,
        title: event.title,
        variant: event.variant,
        subtitle: event.subtitle ?? "Closed",
        isAllDayClosed: true,
      });
      continue;
    }

    const topMinutes = minutesFromGridStart(event.start, gridStartHour);
    const endMinutes = minutesFromGridStart(event.end, gridStartHour);
    const heightMinutes = Math.max(endMinutes - topMinutes, 20);

    if (topMinutes >= gridHeightMinutes || endMinutes <= 0) continue;

    placed.push({
      id: event.id,
      dayIndex,
      top: (Math.max(topMinutes, 0) / 60) * ROW_HEIGHT_PX,
      height:
        (Math.min(heightMinutes, gridHeightMinutes - Math.max(topMinutes, 0)) /
          60) *
        ROW_HEIGHT_PX,
      title: event.title,
      variant: event.variant,
      subtitle: event.subtitle,
    });
  }

  return placed;
}

export function currentTimeIndicatorOffset(
  now: Date,
  weekStart: Date,
  gridStartHour: number,
  gridEndHour: number,
): { dayIndex: number; top: number } | null {
  const days = getWeekDayColumns(weekStart);
  const zoned = clinicDateTime(now);
  const dayIndex = days.findIndex((day) => day.hasSame(zoned, "day"));
  if (dayIndex < 0) return null;

  const minutes = minutesFromGridStart(now, gridStartHour);
  const gridHeightMinutes = (gridEndHour - gridStartHour) * 60;
  if (minutes < 0 || minutes > gridHeightMinutes) return null;

  return {
    dayIndex,
    top: (minutes / 60) * ROW_HEIGHT_PX,
  };
}

export function formatHourLabel(hour: number): string {
  const dt = DateTime.fromObject(
    { hour, minute: 0 },
    { zone: CLINIC_TIMEZONE },
  );
  return dt.toFormat("HH:mm");
}

export function isWeekendDay(day: DateTime): boolean {
  const weekday = day.weekday % 7;
  return weekday === 0 || weekday === 6;
}
