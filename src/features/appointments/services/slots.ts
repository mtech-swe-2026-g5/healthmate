import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";

import {
  addMinutes,
  combineDateAndTime,
  formatHm,
  formatYmd,
  type TimeSlot,
} from "../lib/date-utils";
import {
  buildBookableSlotStarts,
  overlapsInterval,
  resolveDoctorScheduleForDate,
  slotInstantRange,
} from "@/features/schedule/lib/availability";

export type { TimeSlot } from "../lib/date-utils";
export {
  addMinutes,
  buildSlotStarts,
  combineDateAndTime,
  dateFromYmd,
  dayOfWeekFromYmd,
  formatHm,
  formatYmd,
} from "../lib/date-utils";

export async function generateSlots(
  doctorId: string,
  date: string,
  now: Date = new Date(),
): Promise<TimeSlot[]> {
  const schedule = await resolveDoctorScheduleForDate(doctorId, date);

  if (!schedule) {
    throw new AppError("Doctor not found", 404);
  }

  if (!schedule.acceptingNewPatients) {
    throw new AppError("Doctor is not accepting new appointments", 400);
  }

  if (!schedule.dayAvailability) {
    throw new AppError(
      "No working hours for this date (closed days and time off are unavailable)",
      400,
    );
  }

  const todayYmd = formatYmd(now);
  if (date < todayYmd) {
    throw new AppError("Cannot book appointments in the past", 400);
  }

  const dayStart = combineDateAndTime(date, "00:00");
  const dayEnd = addMinutes(combineDateAndTime(date, "23:59"), 1);

  const [bookings, blocks] = await Promise.all([
    prisma.appointment.findMany({
      where: {
        doctorId,
        status: "CONFIRMED",
        startsAt: { gte: dayStart, lt: dayEnd },
      },
      select: { startsAt: true, endsAt: true },
    }),
    prisma.scheduleBlock.findMany({
      where: {
        doctorId,
        startsAt: { lt: dayEnd },
        endsAt: { gt: dayStart },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  const { slotDurationMinutes, dayAvailability } = schedule;
  const starts = buildBookableSlotStarts(date, dayAvailability);

  return starts.map((startTime) => {
    const { startsAt, endsAt } = slotInstantRange(
      date,
      startTime,
      slotDurationMinutes,
    );
    const endHm = formatHm(endsAt);

    const booked = bookings.some((b) =>
      overlapsInterval(startsAt, endsAt, b.startsAt, b.endsAt),
    );
    if (booked) {
      return { startTime, endTime: endHm, status: "booked" as const };
    }

    const blocked = blocks.some((b) =>
      overlapsInterval(startsAt, endsAt, b.startsAt, b.endsAt),
    );
    if (blocked) {
      return { startTime, endTime: endHm, status: "unavailable" as const };
    }

    if (startsAt.getTime() <= now.getTime()) {
      return { startTime, endTime: endHm, status: "unavailable" as const };
    }

    return { startTime, endTime: endHm, status: "available" as const };
  });
}
