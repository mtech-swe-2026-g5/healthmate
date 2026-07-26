import { DateTime } from "luxon";

import type { SlotStatus } from "../constants";
import { CLINIC_TIMEZONE } from "./timezone";

export type TimeSlot = {
  startTime: string;
  endTime: string;
  status: SlotStatus;
};

function parseDateParts(date: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = date.split("-").map(Number);
  return { year, month, day };
}

/** Clinic-local calendar Date at midnight for YYYY-MM-DD. */
export function dateFromYmd(date: string): Date {
  const { year, month, day } = parseDateParts(date);
  return DateTime.fromObject(
    { year, month, day, hour: 0, minute: 0, second: 0, millisecond: 0 },
    { zone: CLINIC_TIMEZONE },
  ).toJSDate();
}

/** JS weekday: 0 = Sunday … 6 = Saturday, in the clinic timezone. */
export function dayOfWeekFromYmd(date: string): number {
  const { year, month, day } = parseDateParts(date);
  const weekday = DateTime.fromObject(
    { year, month, day },
    { zone: CLINIC_TIMEZONE },
  ).weekday; // Luxon: 1 = Monday … 7 = Sunday
  return weekday % 7;
}

export function formatYmd(date: Date): string {
  return DateTime.fromJSDate(date, { zone: "utc" })
    .setZone(CLINIC_TIMEZONE)
    .toFormat("yyyy-MM-dd");
}

/**
 * Interpret YYYY-MM-DD + HH:mm as a clinic wall-clock time and return the
 * corresponding UTC instant for storage.
 */
export function combineDateAndTime(date: string, time: string): Date {
  const { year, month, day } = parseDateParts(date);
  const [hours, minutes] = time.split(":").map(Number);
  const dt = DateTime.fromObject(
    {
      year,
      month,
      day,
      hour: hours,
      minute: minutes,
      second: 0,
      millisecond: 0,
    },
    { zone: CLINIC_TIMEZONE },
  );
  if (!dt.isValid) {
    throw new Error(`Invalid clinic datetime: ${date} ${time}`);
  }
  return dt.toJSDate();
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** Format an instant as HH:mm in the clinic timezone. */
export function formatHm(date: Date): string {
  return DateTime.fromJSDate(date, { zone: "utc" })
    .setZone(CLINIC_TIMEZONE)
    .toFormat("HH:mm");
}

/**
 * Build fixed-duration slots from working-hours bounds.
 * start inclusive, end exclusive (11:00–19:00 → last start 18:00).
 */
export function buildSlotStarts(
  startTime: string,
  endTime: string,
  slotDurationMinutes: number,
): string[] {
  const starts: string[] = [];
  let cursor = combineDateAndTime("2000-01-01", startTime);
  const end = combineDateAndTime("2000-01-01", endTime);

  while (addMinutes(cursor, slotDurationMinutes) <= end) {
    starts.push(formatHm(cursor));
    cursor = addMinutes(cursor, slotDurationMinutes);
  }

  return starts;
}

function fromIso(iso: string): DateTime {
  return DateTime.fromISO(iso, { setZone: true }).setZone(CLINIC_TIMEZONE);
}

/** Clinic-local time for appointment detail / list UI (e.g. "2:00 PM"). */
export function formatAppointmentTime(iso: string): string {
  return fromIso(iso).toFormat("h:mm a");
}

/** Clinic-local date for appointment detail / list UI (e.g. "Jul 27, 2026"). */
export function formatAppointmentDate(iso: string): string {
  return fromIso(iso).toFormat("MMM d, yyyy");
}

/** Clinic-local weekday + date (e.g. "Monday, Jul 27, 2026"). */
export function formatAppointmentWeekdayDate(iso: string): string {
  return fromIso(iso).toFormat("EEEE, MMM d, yyyy");
}

/** Clinic-local date + time (e.g. "Jul 27, 2026, 2:00 PM"). */
export function formatAppointmentDateTime(iso: string): string {
  return fromIso(iso).toFormat("MMM d, yyyy, h:mm a");
}

/** Format a YYYY-MM-DD calendar date in the clinic timezone. */
export function formatClinicCalendarDate(ymd: string): string {
  return DateTime.fromISO(ymd, { zone: CLINIC_TIMEZONE }).toFormat(
    "EEEE, MMM d, yyyy",
  );
}

/** HH:mm wall clock → display label in clinic convention. */
export function formatSlotLabel(hm: string): string {
  const [hour, minute] = hm.split(":").map(Number);
  const dt = DateTime.fromObject({ hour, minute }, { zone: CLINIC_TIMEZONE });
  return dt.toFormat("h:mm a");
}
