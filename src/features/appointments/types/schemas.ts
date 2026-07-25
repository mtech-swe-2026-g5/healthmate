import { z } from 'zod';

export const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export const appointmentDetailsSchema = z.object({
  reasonForVisit: z
    .string()
    .trim()
    .min(1, 'Reason for visit is required')
    .max(200, 'Reason for visit must be 200 characters or fewer'),
  additionalNotes: z
    .string()
    .trim()
    .max(500, 'Additional notes must be 500 characters or fewer')
    .optional()
    .or(z.literal('')),
});

export type AppointmentDetailsInput = z.infer<typeof appointmentDetailsSchema>;

export const createAppointmentSchema = z.object({
  doctorId: z.string().uuid('Invalid doctor id'),
  date: z
    .string()
    .regex(DATE_REGEX, 'Date must be YYYY-MM-DD')
    .refine((val) => {
      const [y, m, d] = val.split('-').map(Number);
      const parsed = new Date(y, m - 1, d);
      return (
        parsed.getFullYear() === y &&
        parsed.getMonth() === m - 1 &&
        parsed.getDate() === d
      );
    }, 'Invalid calendar date'),
  startTime: z.string().regex(TIME_REGEX, 'Time must be HH:mm'),
  reasonForVisit: z
    .string()
    .trim()
    .min(1, 'Reason for visit is required')
    .max(200, 'Reason for visit must be 200 characters or fewer'),
  additionalNotes: z
    .string()
    .trim()
    .max(500, 'Additional notes must be 500 characters or fewer')
    .optional()
    .or(z.literal('')),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;

export const slotsQuerySchema = z.object({
  date: z
    .string()
    .regex(DATE_REGEX, 'Date must be YYYY-MM-DD')
    .refine((val) => {
      const [y, m, d] = val.split('-').map(Number);
      const parsed = new Date(y, m - 1, d);
      return (
        parsed.getFullYear() === y &&
        parsed.getMonth() === m - 1 &&
        parsed.getDate() === d
      );
    }, 'Invalid calendar date'),
});
