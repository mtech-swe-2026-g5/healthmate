import { logger } from "@/lib/logger";

import { sendEmail } from "../lib/mailer";
import { runAfterResponse } from "../lib/scheduler";
import { renderWelcomeEmail } from "../templates/account-welcome";
import type { EmailDeliveryResult, WelcomeEmailInput } from "../types";

/**
 * Sends the account confirmation email. Never throws — a failed welcome email
 * must not fail the registration that triggered it.
 *
 * @param input - Sign-in email, given name, and role of the new account
 * @returns Delivery status and the number of attempts made
 */
export async function sendWelcomeEmail(
  input: WelcomeEmailInput,
): Promise<EmailDeliveryResult> {
  const logContext = { event: "account.registered", role: input.role };

  try {
    return await sendEmail(renderWelcomeEmail(input), logContext);
  } catch (error) {
    logger.error("Welcome email render failed", error, logContext);
    return { status: "failed", attempts: 0 };
  }
}

/**
 * Fire-and-forget entry point for the registration flow.
 * Delivery runs after the HTTP response is flushed so sign-up stays fast.
 *
 * @param input - Sign-in email, given name, and role of the new account
 */
export function scheduleWelcomeEmail(input: WelcomeEmailInput): void {
  runAfterResponse(async () => {
    await sendWelcomeEmail(input);
  });
}
