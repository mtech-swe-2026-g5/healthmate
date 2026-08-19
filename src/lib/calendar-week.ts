import { DateTime } from "luxon";

import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";

/**
 * Luxon weekday used by Sunday-first clinic calendars.
 * 7 = Sunday (US calendar convention, matches SlotConfiguration dayOfWeek 0).
 */
export const CALENDAR_FIRST_DAY_OF_WEEK = 7;

export type CalendarWeekRange = {
  start: Date;
  end: Date;
};

function inClinicZone(reference: Date | DateTime): DateTime {
  const dt = DateTime.isDateTime(reference)
    ? reference
    : DateTime.fromJSDate(reference as Date);
  return dt.setZone(CLINIC_TIMEZONE);
}

/**
 * Returns the visible Sunday–Saturday week for a calendar date in the clinic
 * timezone. Luxon's `startOf("week")` follows ISO (Monday); doctor views use
 * Sunday as the first column, so fetch ranges must use this helper.
 */
export function getCalendarWeekRange(
  reference: Date | DateTime = DateTime.now(),
): CalendarWeekRange {
  const dt = inClinicZone(reference);
  const daysSinceSunday = dt.weekday % 7;
  const start = dt.minus({ days: daysSinceSunday }).startOf("day");
  const end = start.plus({ days: 6 }).endOf("day");

  return { start: start.toJSDate(), end: end.toJSDate() };
}

/** Previous / next calendar week (Sunday-based, clinic timezone). */
export function shiftCalendarWeek(
  reference: Date | DateTime,
  weeks: number,
): CalendarWeekRange {
  return getCalendarWeekRange(inClinicZone(reference).plus({ weeks }));
}
