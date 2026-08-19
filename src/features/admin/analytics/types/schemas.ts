import { z } from "zod";

export const appointmentGranularitySchema = z.enum([
  "daily",
  "weekly",
  "monthly",
]);

export type AppointmentGranularity = z.infer<
  typeof appointmentGranularitySchema
>;

export const appointmentsSummaryQuerySchema = z.object({
  granularity: appointmentGranularitySchema.default("daily"),
});
