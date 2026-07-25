import type { SlotStatus } from "../constants";

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

/** Local calendar Date at midnight for YYYY-MM-DD. */
export function dateFromYmd(date: string): Date {
  const { year, month, day } = parseDateParts(date);
  return new Date(year, month - 1, day);
}

export function dayOfWeekFromYmd(date: string): number {
  return dateFromYmd(date).getDay();
}

export function formatYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function combineDateAndTime(date: string, time: string): Date {
  const { year, month, day } = parseDateParts(date);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

export function formatHm(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
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
