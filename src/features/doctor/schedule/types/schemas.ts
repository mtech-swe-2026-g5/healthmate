import { z } from "zod";

import { hmToDbTime, isValidTimeRange } from "@/features/schedule/lib/time";

const hmSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Use HH:mm format");

export const daySessionSchema = z
  .object({
    startTime: hmSchema,
    endTime: hmSchema,
    label: z.string().trim().max(80).optional().nullable(),
  })
  .refine((v) => isValidTimeRange(v.startTime, v.endTime), {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const weeklyDaySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  enabled: z.boolean(),
  sessions: z.array(daySessionSchema).max(4),
});

export const updateScheduleSettingsSchema = z.object({
  acceptingNewPatients: z.boolean(),
  bufferMinutes: z.union([z.literal(10), z.literal(15), z.literal(20)]),
  slotDurationMinutes: z.number().int().min(15).max(120),
  weeklyHours: z.array(weeklyDaySchema).length(7),
});

export type UpdateScheduleSettingsInput = z.infer<
  typeof updateScheduleSettingsSchema
>;

const ymdSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");

export const createTimeOffSchema = z
  .object({
    dateFrom: ymdSchema,
    dateTo: ymdSchema,
    reason: z
      .string()
      .trim()
      .min(1, "Add a reason for the closed dates")
      .max(120),
  })
  .refine((v) => v.dateTo >= v.dateFrom, {
    message: "End date must be on or after the start date",
    path: ["dateTo"],
  });

export type CreateTimeOffInput = z.infer<typeof createTimeOffSchema>;

export type DaySession = z.infer<typeof daySessionSchema>;
export type WeeklyDay = z.infer<typeof weeklyDaySchema>;

export type ScheduleBlockResponse = {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  blockType: "TIME_OFF" | "BREAK";
  label: string;
};

export type DoctorScheduleResponse = {
  settings: {
    acceptingNewPatients: boolean;
    bufferMinutes: number;
    slotDurationMinutes: number;
  };
  weeklyHours: WeeklyDay[];
  blocks: ScheduleBlockResponse[];
};

export function sessionsToDbTimes(sessions: DaySession[]) {
  return sessions.map((s) => ({
    startTime: hmToDbTime(s.startTime),
    endTime: hmToDbTime(s.endTime),
    label: s.label ?? null,
  }));
}
