import { DateTime } from "luxon";

import { requireRole } from "@/features/auth/services/permissions";
import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";
import { scheduleAppointmentNotifications } from "@/features/notifications/services/dispatch";
import { formatBlockRange } from "@/features/schedule/lib/availability";
import { dbTimeToHm } from "@/features/schedule/lib/time";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/prisma";

import {
  createTimeOffSchema,
  type CreateTimeOffInput,
  type DoctorScheduleResponse,
  sessionsToDbTimes,
  type UpdateScheduleSettingsInput,
  updateScheduleSettingsSchema,
  type WeeklyDay,
} from "../types/schemas";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function assertDoctorAccess(role: string | undefined): void {
  if (!role) throw new AppError("Unauthorized", 401);
  requireRole(role, ["doctor"]);
}

export async function getDoctorIdForUser(userId: string): Promise<string> {
  const doctor = await prisma.doctor.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!doctor) throw new AppError("Doctor profile not found", 404);
  return doctor.id;
}

async function loadWeeklyHours(doctorId: string): Promise<WeeklyDay[]> {
  const configs = await prisma.slotConfiguration.findMany({
    where: { doctorId, active: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });

  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const dayConfigs = configs.filter((c) => c.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      enabled: dayConfigs.length > 0,
      sessions: dayConfigs.map((c) => ({
        startTime: dbTimeToHm(c.startTime),
        endTime: dbTimeToHm(c.endTime),
        label: c.label,
      })),
    };
  });
}

export async function getDoctorSchedule(
  userId: string,
  role: string | undefined,
): Promise<DoctorScheduleResponse> {
  assertDoctorAccess(role);
  const doctorId = await getDoctorIdForUser(userId);

  const [doctor, blocks, weeklyHours] = await Promise.all([
    prisma.doctor.findUniqueOrThrow({
      where: { id: doctorId },
      select: {
        acceptingNewPatients: true,
        bufferMinutes: true,
        slotDurationMinutes: true,
      },
    }),
    prisma.scheduleBlock.findMany({
      where: {
        doctorId,
        endsAt: {
          gte: DateTime.now()
            .setZone(CLINIC_TIMEZONE)
            .minus({ days: 90 })
            .startOf("day")
            .toJSDate(),
        },
      },
      orderBy: { startsAt: "asc" },
    }),
    loadWeeklyHours(doctorId),
  ]);

  return {
    settings: doctor,
    weeklyHours,
    blocks: blocks.map((b) => ({
      id: b.id,
      startsAt: b.startsAt.toISOString(),
      endsAt: b.endsAt.toISOString(),
      reason: b.reason,
      blockType: b.blockType,
      label: formatBlockRange(b.startsAt, b.endsAt),
    })),
  };
}

export async function updateDoctorSchedule(
  userId: string,
  role: string | undefined,
  rawInput: unknown,
): Promise<DoctorScheduleResponse> {
  assertDoctorAccess(role);
  const doctorId = await getDoctorIdForUser(userId);
  const input: UpdateScheduleSettingsInput =
    updateScheduleSettingsSchema.parse(rawInput);

  for (const day of input.weeklyHours) {
    if (day.enabled && day.sessions.length === 0) {
      throw new AppError(
        `Add at least one session for ${DAY_LABELS[day.dayOfWeek] ?? "day"}`,
        400,
      );
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.doctor.update({
      where: { id: doctorId },
      data: {
        acceptingNewPatients: input.acceptingNewPatients,
        bufferMinutes: input.bufferMinutes,
        slotDurationMinutes: input.slotDurationMinutes,
      },
    });

    await tx.slotConfiguration.deleteMany({ where: { doctorId } });

    const validFrom = DateTime.fromObject(
      { year: 2026, month: 1, day: 1 },
      { zone: CLINIC_TIMEZONE },
    ).toJSDate();

    for (const day of input.weeklyHours) {
      if (!day.enabled) continue;
      for (const session of sessionsToDbTimes(day.sessions)) {
        await tx.slotConfiguration.create({
          data: {
            doctorId,
            dayOfWeek: day.dayOfWeek,
            startTime: session.startTime,
            endTime: session.endTime,
            label: session.label,
            timezone: CLINIC_TIMEZONE,
            validFrom,
            active: true,
          },
        });
      }
    }
  });

  return getDoctorSchedule(userId, role);
}

export async function createDoctorScheduleBlock(
  userId: string,
  role: string | undefined,
  rawInput: unknown,
) {
  assertDoctorAccess(role);
  const doctorId = await getDoctorIdForUser(userId);
  const parsed = createTimeOffSchema.safeParse(rawInput);
  if (!parsed.success) {
    throw new AppError(
      parsed.error.issues[0]?.message ?? "Invalid closed dates",
      400,
    );
  }
  const input: CreateTimeOffInput = parsed.data;

  const todayYmd = DateTime.now()
    .setZone(CLINIC_TIMEZONE)
    .toFormat("yyyy-MM-dd");
  if (input.dateFrom < todayYmd) {
    throw new AppError("Closed dates must start today or in the future", 400);
  }

  const startsAt = DateTime.fromISO(input.dateFrom, { zone: CLINIC_TIMEZONE })
    .startOf("day")
    .toJSDate();
  const endsAt = DateTime.fromISO(input.dateTo, { zone: CLINIC_TIMEZONE })
    .endOf("day")
    .toJSDate();

  const conflicting = await prisma.appointment.findMany({
    where: {
      doctorId,
      status: "CONFIRMED",
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
    select: { id: true, startsAt: true, endsAt: true },
  });

  const now = new Date();

  const block = await prisma.$transaction(async (tx) => {
    if (conflicting.length > 0) {
      await tx.appointment.updateMany({
        where: { id: { in: conflicting.map((a) => a.id) } },
        data: { status: "CANCELLED", cancelledAt: now },
      });

      await tx.appointmentHistory.createMany({
        data: conflicting.map((a) => ({
          appointmentId: a.id,
          event: "CANCELLED" as const,
          previousStartsAt: a.startsAt,
          previousEndsAt: a.endsAt,
          changedByUserId: userId,
          changedByRole: "doctor",
        })),
      });
    }

    return tx.scheduleBlock.create({
      data: {
        doctorId,
        startsAt,
        endsAt,
        reason: input.reason,
        blockType: "TIME_OFF",
      },
    });
  });

  for (const appointment of conflicting) {
    scheduleAppointmentNotifications("appointment.cancelled", appointment.id, {
      cancelledBy: "doctor",
    });
  }

  return {
    id: block.id,
    startsAt: block.startsAt.toISOString(),
    endsAt: block.endsAt.toISOString(),
    reason: block.reason,
    blockType: block.blockType,
    label: formatBlockRange(block.startsAt, block.endsAt),
    cancelledAppointments: conflicting.length,
  };
}

export async function deleteDoctorScheduleBlock(
  userId: string,
  role: string | undefined,
  blockId: string,
) {
  assertDoctorAccess(role);
  const doctorId = await getDoctorIdForUser(userId);

  const block = await prisma.scheduleBlock.findFirst({
    where: { id: blockId, doctorId },
    select: { id: true },
  });

  if (!block) throw new AppError("Schedule block not found", 404);

  await prisma.scheduleBlock.delete({ where: { id: blockId } });
}
