import { DateTime } from "luxon";

import type { Appointment } from "@/features/doctor/appointments/types/response";
import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";
import {
  getCalendarWeekRange,
  type CalendarWeekRange,
} from "@/lib/calendar-week";

export type DoctorDashboardStats = {
  todayCount: number;
  weekTotal: number;
  upcomingToday: number;
  completedThisWeek: number;
};

export type TodayScheduleItem = {
  id: string;
  patientName: string;
  start: Date;
  end: Date;
  durationMinutes: number;
  isPast: boolean;
  isCurrent: boolean;
};

const CARD =
  "rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] shadow-[0px_4px_20px_rgba(26,107,114,0.08)]";

function clinicNow(): DateTime {
  return DateTime.now().setZone(CLINIC_TIMEZONE);
}

/** JSON APIs serialize Date fields as ISO strings. */
export function asInstant(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function clinicDateTime(value: Date | string): DateTime {
  return DateTime.fromJSDate(asInstant(value)).setZone(CLINIC_TIMEZONE);
}

function isSameClinicDay(value: Date | string, day: DateTime): boolean {
  const zoned = clinicDateTime(value);
  return zoned.isValid && zoned.hasSame(day, "day");
}

export function computeDoctorDashboardStats(
  appointments: Appointment[] | undefined,
  now: DateTime = clinicNow(),
): DoctorDashboardStats {
  const list = appointments ?? [];
  const today = list.filter((a) => isSameClinicDay(a.start, now));
  const upcomingToday = today.filter(
    (a) => clinicDateTime(a.start) > now,
  ).length;
  const completedThisWeek = list.filter(
    (a) => clinicDateTime(a.end) <= now,
  ).length;

  return {
    todayCount: today.length,
    weekTotal: list.length,
    upcomingToday,
    completedThisWeek,
  };
}

export function buildTodaySchedule(
  appointments: Appointment[] | undefined,
  now: DateTime = clinicNow(),
): TodayScheduleItem[] {
  const list = appointments ?? [];
  return list
    .filter((a) => isSameClinicDay(a.start, now))
    .map((a) => {
      const start = clinicDateTime(a.start);
      const end = clinicDateTime(a.end);
      const durationMinutes = Math.round(end.diff(start, "minutes").minutes);
      const isPast = end <= now;
      const isCurrent = start <= now && end > now;

      return {
        id: a.id,
        patientName: `${a.patient.firstName} ${a.patient.lastName}`,
        start: asInstant(a.start),
        end: asInstant(a.end),
        durationMinutes,
        isPast,
        isCurrent,
      };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

export function buildUpcomingWeekList(
  appointments: Appointment[] | undefined,
  now: DateTime = clinicNow(),
): Array<{ id: string; label: string; when: string }> {
  const list = appointments ?? [];
  return list
    .filter((a) => clinicDateTime(a.start) > now)
    .sort((a, b) => asInstant(a.start).getTime() - asInstant(b.start).getTime())
    .slice(0, 5)
    .map((a) => {
      const start = clinicDateTime(a.start);
      return {
        id: a.id,
        label: `${a.patient.firstName} ${a.patient.lastName}`,
        when: start.toFormat("ccc, MMM d · h:mm a · 'IST'"),
      };
    });
}

export function formatClinicTime(date: Date | string): string {
  return clinicDateTime(date).toFormat("h:mm a");
}

export function formatClinicTimeRange(
  start: Date | string,
  end: Date | string,
): string {
  return `${formatClinicTime(start)} – ${formatClinicTime(end)}`;
}

export function formatHeaderDate(now: Date = new Date()): string {
  return DateTime.fromJSDate(now)
    .setZone(CLINIC_TIMEZONE)
    .toFormat("ccc, MMM d · 'IST'");
}

export function initialDoctorWeekRange(): CalendarWeekRange {
  return getCalendarWeekRange(clinicNow());
}

export { CARD };
