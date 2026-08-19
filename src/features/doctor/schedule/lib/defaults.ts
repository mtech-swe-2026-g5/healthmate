import type { WeeklyDay } from "@/features/doctor/schedule/types/schemas";

export function defaultWeeklyHours(existing?: WeeklyDay[]): WeeklyDay[] {
  if (existing?.length) return existing;
  return Array.from({ length: 7 }, (_, dayOfWeek) => ({
    dayOfWeek,
    enabled: dayOfWeek >= 1 && dayOfWeek <= 5,
    sessions:
      dayOfWeek >= 1 && dayOfWeek <= 5
        ? [{ startTime: "09:00", endTime: "17:00", label: null }]
        : [],
  }));
}
