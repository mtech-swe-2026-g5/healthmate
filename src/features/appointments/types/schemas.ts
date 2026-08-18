import { z } from "zod";

export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * `YYYY-MM-DD` that also exists on the calendar — the regex alone accepts
 * rollovers such as `2026-02-31`, which `Date` would silently shift forward.
 */
const calendarDateSchema = z
  .string()
  .regex(DATE_REGEX, "Date must be YYYY-MM-DD")
  .refine((val) => {
    const [y, m, d] = val.split("-").map(Number);
    const parsed = new Date(y, m - 1, d);
    return (
      parsed.getFullYear() === y &&
      parsed.getMonth() === m - 1 &&
      parsed.getDate() === d
    );
  }, "Invalid calendar date");

export const appointmentDetailsSchema = z.object({
  reasonForVisit: z
    .string()
    .trim()
    .min(1, "Reason for visit is required")
    .max(200, "Reason for visit must be 200 characters or fewer"),
  additionalNotes: z
    .string()
    .trim()
    .max(500, "Additional notes must be 500 characters or fewer")
    .optional()
    .or(z.literal("")),
});

export type AppointmentDetailsInput = z.infer<typeof appointmentDetailsSchema>;

export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid("Invalid doctor id"),
  date: calendarDateSchema,
  startTime: z.string().regex(TIME_REGEX, "Time must be HH:mm"),
  reasonForVisit: z
    .string()
    .trim()
    .min(1, "Reason for visit is required")
    .max(200, "Reason for visit must be 200 characters or fewer"),
  additionalNotes: z
    .string()
    .trim()
    .max(500, "Additional notes must be 500 characters or fewer")
    .optional()
    .or(z.literal("")),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

/**
 * Reschedule moves an appointment within the same doctor's schedule, so only
 * the new slot is accepted — doctor, reason, and notes are carried over.
 */
export const rescheduleAppointmentSchema = z.object({
  date: calendarDateSchema,
  startTime: z.string().regex(TIME_REGEX, "Time must be HH:mm"),
});

export type RescheduleAppointmentInput = z.infer<
  typeof rescheduleAppointmentSchema
>;

export const slotsQuerySchema = z.object({
  date: calendarDateSchema,
});
