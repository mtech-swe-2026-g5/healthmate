import { DateTime } from "luxon";

import {
  addMinutes,
  buildSlotStarts,
  combineDateAndTime,
  dayOfWeekFromYmd,
  formatHm,
} from "@/features/appointments/lib/date-utils";
import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";
import { prisma } from "@/lib/prisma";

import { dbTimeToHm } from "./time";

export type WorkingWindow = {
  startTime: string;
  endTime: string;
  label?: string | null;
};

export function isBreakWindow(window: WorkingWindow): boolean {
  if (!window.label) return false;
  return /break|lunch|meeting|closed/i.test(window.label);
}

export type DoctorDayAvailability = {
  dayOfWeek: number;
  slotDurationMinutes: number;
  bufferMinutes: number;
  windows: WorkingWindow[];
};

export type ResolvedDoctorSchedule = {
  slotDurationMinutes: number;
  bufferMinutes: number;
  acceptingNewPatients: boolean;
  dayAvailability: DoctorDayAvailability | null;
};

function isConfigValidOnDate(
  config: { validFrom: Date; validUntil: Date | null },
  dateYmd: string,
): boolean {
  const day = DateTime.fromISO(dateYmd, { zone: CLINIC_TIMEZONE }).startOf(
    "day",
  );
  const validFrom = DateTime.fromJSDate(config.validFrom)
    .setZone(CLINIC_TIMEZONE)
    .startOf("day");
  if (day < validFrom) return false;

  if (config.validUntil) {
    const validUntil = DateTime.fromJSDate(config.validUntil)
      .setZone(CLINIC_TIMEZONE)
      .endOf("day");
    if (day > validUntil) return false;
  }

  return true;
}

export async function resolveDoctorScheduleForDate(
  doctorId: string,
  dateYmd: string,
): Promise<ResolvedDoctorSchedule | null> {
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, isActive: true },
    select: {
      slotDurationMinutes: true,
      bufferMinutes: true,
      acceptingNewPatients: true,
    },
  });

  if (!doctor) return null;

  const dayOfWeek = dayOfWeekFromYmd(dateYmd);
  const configs = await prisma.slotConfiguration.findMany({
    where: {
      active: true,
      dayOfWeek,
      OR: [{ doctorId }, { doctorId: null }],
    },
    orderBy: [{ doctorId: "desc" }, { startTime: "asc" }],
  });

  const doctorSpecific = configs.filter((c) => c.doctorId === doctorId);
  const applicable = (
    doctorSpecific.length > 0
      ? doctorSpecific
      : configs.filter((c) => !c.doctorId)
  ).filter((c) => isConfigValidOnDate(c, dateYmd));

  if (applicable.length === 0) {
    const doctorHasCustomHours = await prisma.slotConfiguration.findFirst({
      where: { doctorId, active: true },
      select: { id: true },
    });

    if (doctorHasCustomHours) {
      return {
        slotDurationMinutes: doctor.slotDurationMinutes,
        bufferMinutes: doctor.bufferMinutes,
        acceptingNewPatients: doctor.acceptingNewPatients,
        dayAvailability: null,
      };
    }

    const fallback = await prisma.workingHours.findUnique({
      where: { dayOfWeek },
    });

    if (!fallback?.isActive) {
      return {
        slotDurationMinutes: doctor.slotDurationMinutes,
        bufferMinutes: doctor.bufferMinutes,
        acceptingNewPatients: doctor.acceptingNewPatients,
        dayAvailability: null,
      };
    }

    return {
      slotDurationMinutes:
        fallback.slotDurationMinutes || doctor.slotDurationMinutes,
      bufferMinutes: doctor.bufferMinutes,
      acceptingNewPatients: doctor.acceptingNewPatients,
      dayAvailability: {
        dayOfWeek,
        slotDurationMinutes:
          fallback.slotDurationMinutes || doctor.slotDurationMinutes,
        bufferMinutes: doctor.bufferMinutes,
        windows: [
          {
            startTime: fallback.startTime,
            endTime: fallback.endTime,
          },
        ],
      },
    };
  }

  return {
    slotDurationMinutes: doctor.slotDurationMinutes,
    bufferMinutes: doctor.bufferMinutes,
    acceptingNewPatients: doctor.acceptingNewPatients,
    dayAvailability: {
      dayOfWeek,
      slotDurationMinutes: doctor.slotDurationMinutes,
      bufferMinutes: doctor.bufferMinutes,
      windows: applicable.map((c) => ({
        startTime: dbTimeToHm(c.startTime),
        endTime: dbTimeToHm(c.endTime),
        label: c.label,
      })),
    },
  };
}

export function overlapsInterval(
  start: Date,
  end: Date,
  blockStart: Date,
  blockEnd: Date,
): boolean {
  return start < blockEnd && end > blockStart;
}

export function buildBookableSlotStarts(
  _dateYmd: string,
  availability: DoctorDayAvailability,
): string[] {
  const intervalMinutes =
    availability.slotDurationMinutes + availability.bufferMinutes;
  const starts = new Set<string>();
  for (const window of availability.windows.filter((w) => !isBreakWindow(w))) {
    for (const start of buildSlotStarts(
      window.startTime,
      window.endTime,
      availability.slotDurationMinutes,
      intervalMinutes,
    )) {
      starts.add(start);
    }
  }
  return [...starts].sort();
}

export function slotInstantRange(
  dateYmd: string,
  startTime: string,
  durationMinutes: number,
): { startsAt: Date; endsAt: Date } {
  const startsAt = combineDateAndTime(dateYmd, startTime);
  return { startsAt, endsAt: addMinutes(startsAt, durationMinutes) };
}

export function formatBlockRange(startsAt: Date, endsAt: Date): string {
  const start = DateTime.fromJSDate(startsAt).setZone(CLINIC_TIMEZONE);
  const end = DateTime.fromJSDate(endsAt).setZone(CLINIC_TIMEZONE);
  const coversFullStartDay = start.equals(start.startOf("day"));
  const coversFullEndDay = end >= end.endOf("day").minus({ minutes: 1 });

  if (start.hasSame(end, "day")) {
    if (coversFullStartDay && coversFullEndDay) {
      return start.toFormat("MMM d, yyyy");
    }
    return `${start.toFormat("MMM d")} · ${start.toFormat("h:mm a")} – ${end.toFormat("h:mm a")}`;
  }

  if (coversFullStartDay && coversFullEndDay) {
    return `${start.toFormat("MMM d")} – ${end.toFormat("MMM d, yyyy")}`;
  }

  return `${start.toFormat("MMM d")} – ${end.toFormat("MMM d")}`;
}

export function isWithinBuffer(
  candidateStart: Date,
  candidateEnd: Date,
  existingStart: Date,
  existingEnd: Date,
  bufferMinutes: number,
): boolean {
  const bufferedStart = addMinutes(existingStart, -bufferMinutes);
  const bufferedEnd = addMinutes(existingEnd, bufferMinutes);
  return overlapsInterval(
    candidateStart,
    candidateEnd,
    bufferedStart,
    bufferedEnd,
  );
}

export function hmFromInstant(instant: Date): string {
  return formatHm(instant);
}
