import { after } from "next/server";

import { logger } from "@/lib/logger";

/**
 * Runs work once the HTTP response has been flushed, so email delivery never
 * adds latency to the booking API. Outside a request scope (seed scripts,
 * unit tests) `after` throws, so the task is detached instead.
 */
export function runAfterResponse(task: () => Promise<void>): void {
  const safeTask = async () => {
    try {
      await task();
    } catch (error) {
      logger.error("Background notification task threw", error);
    }
  };

  try {
    after(safeTask);
  } catch {
    void safeTask();
  }
}
