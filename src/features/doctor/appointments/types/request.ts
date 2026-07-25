import { z } from "zod";
import { DateTime } from "luxon";

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
    startDate: DateTime.fromJSDate(startDate).startOf("day").toJSDate(),
    endDate: DateTime.fromJSDate(endDate).endOf("day").toJSDate(),
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
    dateFrom: DateTime.fromJSDate(dateFrom).startOf("day").toJSDate(),
    dateUntil: DateTime.fromJSDate(dateUntil).endOf("day").toJSDate(),
  }));

export type GetAppointmentSlotRequest = z.infer<
  typeof getAppointmentSlotSchema
>;
