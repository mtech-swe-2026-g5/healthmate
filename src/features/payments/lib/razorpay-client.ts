import Razorpay from "razorpay";

import { AppError } from "@/lib/errors";

/** Trim pasted values — Vercel dashboard pastes sometimes include trailing newlines. */
function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

export function getRazorpayClient(): Razorpay {
  const key_id = env("RAZORPAY_KEY_ID") ?? env("NEXT_PUBLIC_RAZORPAY_KEY_ID");
  const key_secret = env("RAZORPAY_KEY_SECRET");

  if (!key_id && !key_secret) {
    throw new AppError(
      "Razorpay keys are not configured (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)",
      503,
    );
  }
  if (!key_id) {
    throw new AppError(
      "Razorpay key id is not configured (set RAZORPAY_KEY_ID or NEXT_PUBLIC_RAZORPAY_KEY_ID)",
      503,
    );
  }
  if (!key_secret) {
    throw new AppError(
      "Razorpay key secret is not configured (set RAZORPAY_KEY_SECRET)",
      503,
    );
  }

  return new Razorpay({ key_id, key_secret });
}

export function getRazorpayKeyId(): string {
  const keyId = env("NEXT_PUBLIC_RAZORPAY_KEY_ID") ?? env("RAZORPAY_KEY_ID");
  if (!keyId) {
    throw new AppError(
      "Razorpay key id is not configured (set NEXT_PUBLIC_RAZORPAY_KEY_ID or RAZORPAY_KEY_ID)",
      503,
    );
  }
  return keyId;
}

export function getRazorpayKeySecret(): string {
  const secret = env("RAZORPAY_KEY_SECRET");
  if (!secret) {
    throw new AppError(
      "Razorpay key secret is not configured (set RAZORPAY_KEY_SECRET)",
      503,
    );
  }
  return secret;
}

export function getRazorpayWebhookSecret(): string {
  const secret = env("RAZORPAY_WEBHOOK_SECRET");
  if (!secret) {
    throw new AppError(
      "Razorpay webhook secret is not configured (set RAZORPAY_WEBHOOK_SECRET)",
      503,
    );
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
