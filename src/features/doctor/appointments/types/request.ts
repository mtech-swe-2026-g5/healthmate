import {z} from "zod";

/**
 * Schema for weekly calendar appointments request
 * Requests appointments for a specific week identified by year and ISO week number
 */
export const getWeeklyAppointmentsSchema = z.object({
    doctorId: z.string().and(z.uuid("Invalid doctor ID format")),
    startDate: z
        .date("Invalid date format"),
    endDate: z
        .date("Invalid date format"),
}).refine(
    (data) => {
        // Validate that the date range is valid
        return data.startDate <= data.endDate;
    },
    {
        message: "Start date must be before or equal to end date",
        path: ["startDate"],
    }
);

export type GetWeeklyAppointmentsRequest = z.infer<typeof getWeeklyAppointmentsSchema>;


