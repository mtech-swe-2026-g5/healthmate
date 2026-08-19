import { z } from "zod";
import { DateTime } from "luxon";

import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";

function clinicDayBoundary(date: Date, boundary: "start" | "end"): Date {
  const zoned = DateTime.fromJSDate(date).setZone(CLINIC_TIMEZONE);
  return (boundary === "start" ? zoned.startOf("day") : zoned.endOf("day")).toJSDate();
}

/**
 * Schema for weekly calendar appointments request
 * Requests appointments for a specific week identified by year and ISO week number
 */
export const getWeeklyAppointmentsSchema = z
  .object({
    doctorId: z.string().and(z.uuid("Invalid doctor ID format")),
    startDate: z.date("Invalid date format"),
    endDate: z.date("Invalid date format"),
  })
  .refine(
    (data) => {
      // Validate that the date range is valid
      return data.startDate <= data.endDate;
    },
    {
      message: "Start date must be before or equal to end date",
      path: ["startDate"],
    },
  )
  .transform(({ doctorId, startDate, endDate }) => ({
    doctorId,
    startDate: clinicDayBoundary(startDate, "start"),
    endDate: clinicDayBoundary(endDate, "end"),
  }));

export type GetWeeklyAppointmentsRequest = z.infer<
  typeof getWeeklyAppointmentsSchema
>;

export const getAppointmentSlotSchema = z
  .object({
    doctorId: z.string().and(z.uuid("Invalid doctor ID format")),
    dateFrom: z.date("Invalid date format"),
    dateUntil: z.date("Invalid date format"),
  })
  .refine(
    (data) => {
      // Validate that the date range is valid
      return data.dateFrom <= data.dateUntil;
    },
    {
      message: "Date from must be before or equal to date until",
      path: ["dateFrom"],
    },
  )
  .transform(({ doctorId, dateFrom, dateUntil }) => ({
    doctorId,
    dateFrom: clinicDayBoundary(dateFrom, "start"),
    dateUntil: clinicDayBoundary(dateUntil, "end"),
  }));

export type GetAppointmentSlotRequest = z.infer<
  typeof getAppointmentSlotSchema
>;
