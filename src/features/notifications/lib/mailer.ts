import { logger } from "@/lib/logger";

import { EMAIL_MAX_RETRIES, EMAIL_RETRY_BASE_DELAY_MS } from "../constants";
import { getSmtpConfig } from "./email-config";
import { maskEmail } from "./mask-email";
import { getTransporter } from "./transport";
import type { EmailDeliveryResult, EmailMessage } from "../types";

/** Context attached to delivery logs; never carries PHI or raw addresses. */
export type EmailLogContext = Record<string, string | number>;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Exponential backoff: 500ms, 1s, 2s. */
function backoffDelayMs(attempt: number): number {
  return EMAIL_RETRY_BASE_DELAY_MS * 2 ** (attempt - 1);
}

/**
 * Sends one email, retrying transient SMTP/network failures.
 *
 * Makes up to `EMAIL_MAX_RETRIES + 1` attempts with exponential backoff. When
 * every attempt fails the error is logged at critical severity and the result
 * is returned rather than thrown — a notification must never fail its caller.
 *
 * @param message - Fully rendered recipient, subject, and bodies
 * @param logContext - Non-identifying context (event, audience, booking ref)
 * @returns Delivery status and the number of attempts made
 */
export async function sendEmail(
  message: EmailMessage,
  logContext: EmailLogContext = {},
): Promise<EmailDeliveryResult> {
  const config = getSmtpConfig();

  if (!config) {
    logger.warn("Email notification skipped — SMTP is not configured", {
      ...logContext,
      recipient: maskEmail(message.to),
    });
    return { status: "skipped", attempts: 0 };
  }

  const transporter = getTransporter(config);
  const maxAttempts = EMAIL_MAX_RETRIES + 1;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      await transporter.sendMail({
        from: config.from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });

      logger.info("Email notification sent", {
        ...logContext,
        recipient: maskEmail(message.to),
        attempts: attempt,
      });
      return { status: "sent", attempts: attempt };
    } catch (error) {
      lastError = error;
      logger.warn("Email notification attempt failed", {
        ...logContext,
        recipient: maskEmail(message.to),
        attempt,
        maxAttempts,
      });

      if (attempt < maxAttempts) {
        await delay(backoffDelayMs(attempt));
      }
    }
  }

  logger.error("Email notification failed after all retries", lastError, {
    ...logContext,
    severity: "critical",
    recipient: maskEmail(message.to),
    attempts: maxAttempts,
  });

  return { status: "failed", attempts: maxAttempts };
}
