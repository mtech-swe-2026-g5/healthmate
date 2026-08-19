import { DateTime } from "luxon";

import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";

import type { AppointmentGranularity } from "../types/schemas";

export type PeriodBucket = {
  key: string;
  label: string;
  start: DateTime;
  end: DateTime;
};

export type PeriodRange = {
  granularity: AppointmentGranularity;
  from: DateTime;
  to: DateTime;
  buckets: PeriodBucket[];
};

function clinicNow(): DateTime {
  return DateTime.now().setZone(CLINIC_TIMEZONE);
}

function formatDailyLabel(day: DateTime): string {
  return day.toFormat("ccc d");
}

function formatWeeklyLabel(weekStart: DateTime): string {
  return `Week of ${weekStart.toFormat("MMM d")}`;
}

function formatMonthlyLabel(month: DateTime): string {
  return month.toFormat("MMM yyyy");
}

function buildDailyBuckets(weekStart: DateTime): PeriodBucket[] {
  return Array.from({ length: 7 }, (_, index) => {
    const start = weekStart.plus({ days: index }).startOf("day");
    const end = start.plus({ days: 1 });
    return {
      key: start.toISODate() ?? start.toISO()!,
      label: formatDailyLabel(start),
      start,
      end,
    };
  });
}

function buildWeeklyBuckets(
  rangeStart: DateTime,
  rangeEnd: DateTime,
): PeriodBucket[] {
  const buckets: PeriodBucket[] = [];
  let cursor = rangeStart.startOf("week");
  while (cursor < rangeEnd) {
    const start = cursor;
    const end = cursor.plus({ weeks: 1 });
    buckets.push({
      key: start.toISODate() ?? start.toISO()!,
      label: formatWeeklyLabel(start),
      start,
      end,
    });
    cursor = end;
  }
  return buckets;
}

function buildMonthlyBuckets(
  rangeStart: DateTime,
  rangeEnd: DateTime,
): PeriodBucket[] {
  const buckets: PeriodBucket[] = [];
  let cursor = rangeStart.startOf("month");
  while (cursor < rangeEnd) {
    const start = cursor;
    const end = cursor.plus({ months: 1 });
    buckets.push({
      key: start.toFormat("yyyy-MM"),
      label: formatMonthlyLabel(start),
      start,
      end,
    });
    cursor = end;
  }
  return buckets;
}

export function resolvePeriodRange(
  granularity: AppointmentGranularity,
  reference = clinicNow(),
): PeriodRange {
  if (granularity === "daily") {
    const from = reference.startOf("week");
    const to = from.plus({ weeks: 1 });
    return {
      granularity,
      from,
      to,
      buckets: buildDailyBuckets(from),
    };
  }

  if (granularity === "weekly") {
    const to = reference.endOf("week").plus({ days: 1 }).startOf("day");
    const from = to.minus({ weeks: 8 }).startOf("week");
    return {
      granularity,
      from,
      to,
      buckets: buildWeeklyBuckets(from, to),
    };
  }

  const to = reference.endOf("month").plus({ days: 1 }).startOf("day");
  const from = to.minus({ months: 6 }).startOf("month");
  return {
    granularity,
    from,
    to,
    buckets: buildMonthlyBuckets(from, to),
  };
}

export function findBucketForInstant(
  buckets: PeriodBucket[],
  instant: DateTime,
): PeriodBucket | undefined {
  return buckets.find(
    (bucket) => instant >= bucket.start && instant < bucket.end,
  );
}
