/**
 * Structured logger for server-side code.
 * Keep PHI/PII out of the context object — mask identifiers before logging.
 */

type LogContext = Record<string, unknown>;

export const logger = {
  debug: (message: string, context?: LogContext) => {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, context ?? {});
    }
  },

  info: (message: string, context?: LogContext) => {
    console.info(`[INFO] ${message}`, context ?? {});
  },

  warn: (message: string, context?: LogContext) => {
    console.warn(`[WARN] ${message}`, context ?? {});
  },

  error: (message: string, error?: unknown, context?: LogContext) => {
    console.error(`[ERROR] ${message}`, error, context ?? {});
  },
};
