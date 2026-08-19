import { z } from "zod";

export const PATIENT_ROSTER_STATUS = ["all", "active", "inactive", "new"] as const;

export type PatientRosterStatusFilter = (typeof PATIENT_ROSTER_STATUS)[number];

export const listDoctorPatientsQuerySchema = z.object({
  q: z.string().max(120).optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(10),
  status: z.enum(PATIENT_ROSTER_STATUS).optional().default("all"),
});

export type ListDoctorPatientsQuery = z.infer<typeof listDoctorPatientsQuerySchema>;
