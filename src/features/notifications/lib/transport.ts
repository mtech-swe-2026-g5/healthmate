import nodemailer, { type Transporter } from "nodemailer";

import {
  SMTP_CONNECTION_TIMEOUT_MS,
  SMTP_GREETING_TIMEOUT_MS,
  SMTP_SOCKET_TIMEOUT_MS,
} from "../constants";
import type { SmtpConfig } from "../types";

type CachedTransport = { key: string; transporter: Transporter };

const globalForTransport = globalThis as unknown as {
  healthmateSmtpTransport: CachedTransport | undefined;
};

function cacheKey(config: SmtpConfig): string {
  return [
    config.host,
    config.port,
    config.secure,
    config.auth?.user ?? "anonymous",
    config.from,
  ].join("|");
}

/**
 * Pooled transporter reused across dispatches. Cached on globalThis so dev
 * hot-reloads do not leak SMTP connections (same pattern as the Prisma client).
 */
export function getTransporter(config: SmtpConfig): Transporter {
  const key = cacheKey(config);
  const cached = globalForTransport.healthmateSmtpTransport;
  if (cached?.key === key) return cached.transporter;

  cached?.transporter.close();

  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth ?? undefined,
    pool: true,
    connectionTimeout: SMTP_CONNECTION_TIMEOUT_MS,
    greetingTimeout: SMTP_GREETING_TIMEOUT_MS,
    socketTimeout: SMTP_SOCKET_TIMEOUT_MS,
  });

  globalForTransport.healthmateSmtpTransport = { key, transporter };
  return transporter;
}

/** Drops the pooled transporter — used by tests and config reloads. */
export function resetTransporter(): void {
  globalForTransport.healthmateSmtpTransport?.transporter.close();
  globalForTransport.healthmateSmtpTransport = undefined;
}
