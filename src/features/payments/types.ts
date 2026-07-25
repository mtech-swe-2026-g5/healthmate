import { z } from "zod";

import { DATE_REGEX, TIME_REGEX } from "@/features/appointments/types";

export const createPaymentOrderSchema = z.object({
  doctorId: z.string().uuid(),
  date: z.string().regex(DATE_REGEX, "date must be YYYY-MM-DD"),
  startTime: z.string().regex(TIME_REGEX, "startTime must be HH:mm"),
  reasonForVisit: z
    .string()
    .min(1, "Reason for visit is required")
    .max(200, "Reason for visit must be 200 characters or fewer"),
  additionalNotes: z
    .string()
    .max(500, "Additional notes must be 500 characters or fewer")
    .optional(),
});

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;

export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
