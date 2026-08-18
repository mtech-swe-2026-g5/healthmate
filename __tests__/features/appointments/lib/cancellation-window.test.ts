import { afterEach, describe, expect, it } from "vitest";

import {
  buildCutoffMessage,
  getCancellationCutoffHours,
  hasCancellationCutoffPassed,
} from "@/features/appointments/lib/cancellation-window";
import { DEFAULT_CANCELLATION_CUTOFF_HOURS } from "@/features/appointments/constants";

const NOW = new Date("2026-08-15T10:00:00.000Z");

function hoursFromNow(hours: number): Date {
  return new Date(NOW.getTime() + hours * 3_600_000);
}

describe("getCancellationCutoffHours", () => {
  afterEach(() => {
    delete process.env.APPOINTMENT_CANCELLATION_CUTOFF_HOURS;
  });

  it("falls back to the default when unset", () => {
    expect(getCancellationCutoffHours()).toBe(
      DEFAULT_CANCELLATION_CUTOFF_HOURS,
    );
  });

  it("reads a configured window", () => {
    process.env.APPOINTMENT_CANCELLATION_CUTOFF_HOURS = "2";
    expect(getCancellationCutoffHours()).toBe(2);
  });

  it("accepts zero to disable the window", () => {
    process.env.APPOINTMENT_CANCELLATION_CUTOFF_HOURS = "0";
    expect(getCancellationCutoffHours()).toBe(0);
  });

  it("falls back when the value is not a number", () => {
    process.env.APPOINTMENT_CANCELLATION_CUTOFF_HOURS = "soon";
    expect(getCancellationCutoffHours()).toBe(
      DEFAULT_CANCELLATION_CUTOFF_HOURS,
    );
  });

  it("falls back when the value is negative", () => {
    process.env.APPOINTMENT_CANCELLATION_CUTOFF_HOURS = "-5";
    expect(getCancellationCutoffHours()).toBe(
      DEFAULT_CANCELLATION_CUTOFF_HOURS,
    );
  });
});

describe("hasCancellationCutoffPassed", () => {
  it("allows a change outside the window", () => {
    expect(hasCancellationCutoffPassed(hoursFromNow(25), 24, NOW)).toBe(false);
  });

  it("refuses a change inside the window", () => {
    expect(hasCancellationCutoffPassed(hoursFromNow(23), 24, NOW)).toBe(true);
  });

  // "Up to 24 hours prior" — exactly on the boundary still counts as in time.
  it("allows a change exactly on the boundary", () => {
    expect(hasCancellationCutoffPassed(hoursFromNow(24), 24, NOW)).toBe(false);
  });

  it("refuses a change one minute inside the boundary", () => {
    const justInside = new Date(NOW.getTime() + 24 * 3_600_000 - 60_000);
    expect(hasCancellationCutoffPassed(justInside, 24, NOW)).toBe(true);
  });

  it("refuses an appointment that has already started", () => {
    expect(hasCancellationCutoffPassed(hoursFromNow(-1), 24, NOW)).toBe(true);
  });

  it("allows any future appointment when the window is zero", () => {
    expect(hasCancellationCutoffPassed(hoursFromNow(0.5), 0, NOW)).toBe(false);
  });
});

describe("buildCutoffMessage", () => {
  it("pluralises multi-hour windows", () => {
    expect(buildCutoffMessage(24)).toContain("24 hours");
  });

  it("uses the singular for a one-hour window", () => {
    expect(buildCutoffMessage(1)).toContain("1 hour");
    expect(buildCutoffMessage(1)).not.toContain("1 hours");
  });
});
