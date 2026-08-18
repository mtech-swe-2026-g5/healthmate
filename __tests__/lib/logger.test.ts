import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { logger } from "@/lib/logger";

beforeEach(() => {
  vi.spyOn(console, "debug").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("logger", () => {
  it("prefixes each level and always passes a context object", () => {
    logger.info("booked", { bookingReference: "HM-A1B2C3" });
    logger.warn("slow");
    logger.error("failed", new Error("boom"));

    expect(console.info).toHaveBeenCalledWith("[INFO] booked", {
      bookingReference: "HM-A1B2C3",
    });
    expect(console.warn).toHaveBeenCalledWith("[WARN] slow", {});
    expect(console.error).toHaveBeenCalledWith(
      "[ERROR] failed",
      expect.any(Error),
      {},
    );
  });

  it("emits debug output only in development", () => {
    vi.stubEnv("NODE_ENV", "production");
    logger.debug("noisy");
    expect(console.debug).not.toHaveBeenCalled();

    vi.stubEnv("NODE_ENV", "development");
    logger.debug("noisy", { step: 1 });
    expect(console.debug).toHaveBeenCalledWith("[DEBUG] noisy", { step: 1 });
  });
});
