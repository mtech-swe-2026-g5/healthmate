import {
  DEFAULT_APP_URL,
  DEFAULT_EMAIL_FROM_NAME,
  DEFAULT_SMTP_PORT,
} from "../constants";
import type { SmtpConfig } from "../types";

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : null;
}

/** Explicit kill switch; defaults to enabled so configured environments send. */
export function isEmailNotificationsEnabled(): boolean {
  return readEnv("EMAIL_NOTIFICATIONS_ENABLED") !== "false";
}

/**
 * Resolves SMTP settings from the environment.
 * Returns null when the provider is not configured — callers skip delivery
 * rather than failing the booking that triggered it.
 */
export function getSmtpConfig(): SmtpConfig | null {
  if (!isEmailNotificationsEnabled()) return null;

  const host = readEnv("SMTP_HOST");
  if (!host) return null;

  const port = Number(readEnv("SMTP_PORT") ?? DEFAULT_SMTP_PORT);
  if (!Number.isInteger(port) || port <= 0) return null;

  const user = readEnv("SMTP_USER");
  const password = readEnv("SMTP_PASSWORD");
  const fromAddress = readEnv("EMAIL_FROM") ?? user;
  if (!fromAddress) return null;

  const fromName = readEnv("EMAIL_FROM_NAME") ?? DEFAULT_EMAIL_FROM_NAME;

  return {
    host,
    port,
    // Implicit TLS on 465; STARTTLS elsewhere unless SMTP_SECURE forces it.
    secure: readEnv("SMTP_SECURE") === "true" || port === 465,
    auth: user && password ? { user, pass: password } : null,
    from: `${fromName} <${fromAddress}>`,
  };
}

/** Absolute base URL used to build appointment links inside emails. */
export function getAppUrl(): string {
  const url =
    readEnv("NEXT_PUBLIC_APP_URL") ?? readEnv("AUTH_URL") ?? DEFAULT_APP_URL;
  return url.replace(/\/+$/, "");
}
