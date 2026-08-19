import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import {
  findBucketForInstant,
  resolvePeriodRange,
} from "@/features/admin/analytics/lib/period-range";

describe("resolvePeriodRange", () => {
  const reference = DateTime.fromISO("2026-08-19T12:00:00", {
    zone: "Asia/Kolkata",
  });

  it("returns seven daily buckets for the current week", () => {
    const period = resolvePeriodRange("daily", reference);
    expect(period.buckets).toHaveLength(7);
    expect(period.from.weekday).toBe(1);
    expect(period.to.diff(period.from, "days").days).toBe(7);
  });

  it("returns eight weekly buckets for the weekly view", () => {
    const period = resolvePeriodRange("weekly", reference);
    expect(period.buckets.length).toBeGreaterThanOrEqual(8);
    expect(period.granularity).toBe("weekly");
  });

  it("returns six monthly buckets for the monthly view", () => {
    const period = resolvePeriodRange("monthly", reference);
    expect(period.buckets).toHaveLength(6);
    expect(period.granularity).toBe("monthly");
  });
});

describe("findBucketForInstant", () => {
  const reference = DateTime.fromISO("2026-08-19T12:00:00", {
    zone: "Asia/Kolkata",
  });
  const period = resolvePeriodRange("daily", reference);

  it("maps an instant to the correct day bucket", () => {
    const instant = DateTime.fromISO("2026-08-20T15:30:00", {
      zone: "Asia/Kolkata",
    });
    const bucket = findBucketForInstant(period.buckets, instant);
    expect(bucket?.label).toContain("20");
  });
});
