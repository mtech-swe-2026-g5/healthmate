import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';

import {
  addMinutes,
  buildSlotStarts,
  combineDateAndTime,
  dayOfWeekFromYmd,
  formatHm,
  formatYmd,
  type TimeSlot,
} from '../lib/date-utils';

export type { TimeSlot } from '../lib/date-utils';
export {
  addMinutes,
  buildSlotStarts,
  combineDateAndTime,
  dateFromYmd,
  dayOfWeekFromYmd,
  formatHm,
  formatYmd,
} from '../lib/date-utils';

export async function generateSlots(
  doctorId: string,
  date: string,
  now: Date = new Date(),
): Promise<TimeSlot[]> {
  const doctor = await prisma.doctor.findFirst({
    where: { id: doctorId, isActive: true },
    select: { id: true },
  });

  if (!doctor) {
    throw new AppError('Doctor not found', 404);
  }

  const dayOfWeek = dayOfWeekFromYmd(date);
  const hours = await prisma.workingHours.findUnique({
    where: { dayOfWeek },
  });

  if (!hours || !hours.isActive) {
    throw new AppError(
      'No working hours for this date (Sundays and inactive days are closed)',
      400,
    );
  }

  const todayYmd = formatYmd(now);
  if (date < todayYmd) {
    throw new AppError('Cannot book appointments in the past', 400);
  }

  const dayStart = combineDateAndTime(date, '00:00');
  const dayEnd = addMinutes(combineDateAndTime(date, '23:59'), 1);

  const bookings = await prisma.appointment.findMany({
    where: {
      doctorId,
      status: 'CONFIRMED',
      startsAt: { gte: dayStart, lt: dayEnd },
    },
    select: { startsAt: true },
  });

  const bookedStarts = new Set(bookings.map((b) => formatHm(b.startsAt)));
  const starts = buildSlotStarts(
    hours.startTime,
    hours.endTime,
    hours.slotDurationMinutes,
  );

  return starts.map((startTime) => {
    const startsAt = combineDateAndTime(date, startTime);
    const endsAt = addMinutes(startsAt, hours.slotDurationMinutes);
    const endTime = formatHm(endsAt);

    if (bookedStarts.has(startTime)) {
      return { startTime, endTime, status: 'booked' as const };
    }

    if (startsAt.getTime() <= now.getTime()) {
      return { startTime, endTime, status: 'unavailable' as const };
    }

    return { startTime, endTime, status: 'available' as const };
  });
}
