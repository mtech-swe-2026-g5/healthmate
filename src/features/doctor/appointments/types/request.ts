import {z} from "zod";
import moment from "moment";

/**
 * Schema for weekly calendar appointments request
 * Requests appointments for a specific week identified by year and ISO week number
 */
export const getWeeklyAppointmentsSchema = z.object({
    doctorId: z.string().and(z.uuid("Invalid doctor ID format")),
    year: z
        .number()
        .int("Year must be an integer")
        .min(2000, "Year must be 2000 or later"),
    week: z
        .number()
        .int("Week must be an integer")
        .min(1, "Week must be between 1 and 53")
        .max(53, "Week must be between 1 and 53"),
}).refine(
    (data) => {
        // Validate that the year and week combination is valid
        const startOfWeek = moment().year(data.year).week(data.week).startOf('week');
        return startOfWeek.isValid();
    },
    {
        message: "Invalid year and week combination",
        path: ["week"],
    }
);

export type GetWeeklyAppointmentsRequest = z.infer<typeof getWeeklyAppointmentsSchema>;


