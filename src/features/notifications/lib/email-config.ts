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

/** Vercel's system variables are bare hostnames with no scheme. */
function toAbsoluteUrl(value: string): string {
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withScheme.replace(/\/+$/, "");
}

function isLocalhost(url: string): boolean {
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(
    url,
  );
}

/**
 * Absolute base URL for links inside emails.
 *
 * Resolution order:
 *  1. `NEXT_PUBLIC_APP_URL` — explicit override (ignored on Vercel when it
 *     points at localhost, which happens when a local `.env` is copied up)
 *  2. `VERCEL_PROJECT_PRODUCTION_URL` — the stable production domain, injected
 *     by Vercel at runtime, so no rebuild is needed for it to take effect
 *  3. `VERCEL_URL` — per-deployment host, the preview fallback
 *  4. `AUTH_URL`
 *  5. localhost
 *
 * Steps 2–3 mean a Vercel deployment links to itself with no configuration.
 */
export function getAppUrl(): string {
  const isOnVercel = readEnv("VERCEL") === "1";
  const explicit = readEnv("NEXT_PUBLIC_APP_URL");

  if (explicit && !(isOnVercel && isLocalhost(explicit))) {
    return toAbsoluteUrl(explicit);
  }

  const vercelHost =
    readEnv("VERCEL_PROJECT_PRODUCTION_URL") ?? readEnv("VERCEL_URL");
  if (vercelHost) return toAbsoluteUrl(vercelHost);

  const authUrl = readEnv("AUTH_URL");
  if (authUrl && !(isOnVercel && isLocalhost(authUrl))) {
    return toAbsoluteUrl(authUrl);
  }

  return DEFAULT_APP_URL;
}
