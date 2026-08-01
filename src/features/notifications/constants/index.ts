/** Audiences that can receive an appointment notification. */
export const NOTIFICATION_AUDIENCES = ["patient", "doctor"] as const;

/**
 * Retries attempted after the first failed SMTP dispatch.
 * Total attempts = EMAIL_MAX_RETRIES + 1; exhausting them logs a critical error.
 */
export const EMAIL_MAX_RETRIES = 3;

/** Exponential backoff between retries: 500ms, 1s, 2s. */
export const EMAIL_RETRY_BASE_DELAY_MS = 500;

/**
 * SMTP socket timeouts. Worst case (4 attempts + backoff) stays under the
 * 2-minute delivery window the booking notification is held to.
 */
export const SMTP_CONNECTION_TIMEOUT_MS = 10_000;
export const SMTP_GREETING_TIMEOUT_MS = 10_000;
export const SMTP_SOCKET_TIMEOUT_MS = 20_000;

export const DEFAULT_SMTP_PORT = 587;
export const DEFAULT_EMAIL_FROM_NAME = "HealthMate";
export const DEFAULT_APP_URL = "http://localhost:3000";
