import Razorpay from "razorpay";

import { AppError } from "@/lib/errors";

export function getRazorpayClient(): Razorpay {
  const key_id =
    process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new AppError("Razorpay keys are not configured", 503);
  }

  return new Razorpay({ key_id, key_secret });
}

export function getRazorpayKeyId(): string {
  const keyId =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new AppError("Razorpay key id is not configured", 503);
  }
  return keyId;
}

export function getRazorpayKeySecret(): string {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new AppError("Razorpay key secret is not configured", 503);
  }
  return secret;
}

export function getRazorpayWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new AppError("Razorpay webhook secret is not configured", 503);
  }
  return secret;
}

/**
 * Razorpay's Node SDK throws plain objects `{ statusCode, error }` instead of
 * Error instances. Map those (and unknown failures) to AppError so API routes
 * do not collapse into opaque 500s.
 */
export function toRazorpayAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (error && typeof error === "object" && "statusCode" in error) {
    const razorpayError = error as {
      statusCode?: number;
      error?: { description?: string; code?: string; reason?: string };
    };
    const description =
      razorpayError.error?.description ??
      razorpayError.error?.reason ??
      razorpayError.error?.code ??
      "Payment provider rejected the request";
    const statusCode = razorpayError.statusCode;
    const status =
      typeof statusCode === "number" && statusCode >= 400 && statusCode < 500
        ? statusCode
        : 502;
    return new AppError(description, status);
  }

  if (error instanceof Error) {
    return new AppError(error.message || "Payment provider error", 502);
  }

  return new AppError("Payment provider error", 502);
}
