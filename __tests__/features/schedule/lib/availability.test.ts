import { describe, expect, it } from "vitest";

import {
  buildBookableSlotStarts,
  formatBlockRange,
  isBreakWindow,
  isWithinBuffer,
  overlapsInterval,
} from "@/features/schedule/lib/availability";
import { isValidTimeRange } from "@/features/schedule/lib/time";
import {
  createTimeOffSchema,
  daySessionSchema,
} from "@/features/doctor/schedule/types/schemas";
import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";
import { DateTime } from "luxon";

describe("schedule time validation", () => {
  it("validates HH:mm ranges", () => {
    expect(isValidTimeRange("09:00", "17:00")).toBe(true);
    expect(isValidTimeRange("17:00", "09:00")).toBe(false);
  });

  it("parses day sessions", () => {
    const parsed = daySessionSchema.parse({
      startTime: "10:00",
      endTime: "12:00",
      label: "Morning clinic",
    });
    expect(parsed.label).toBe("Morning clinic");
  });
});

describe("schedule availability helpers", () => {
  it("detects break windows by label", () => {
    expect(
      isBreakWindow({
        startTime: "12:00",
        endTime: "13:00",
        label: "Lunch Break",
      }),
    ).toBe(true);
    expect(
      isBreakWindow({ startTime: "09:00", endTime: "12:00", label: "Morning" }),
    ).toBe(false);
  });

  it("detects interval overlap", () => {
    const aStart = new Date("2026-07-27T09:00:00Z");
    const aEnd = new Date("2026-07-27T10:00:00Z");
    const bStart = new Date("2026-07-27T09:30:00Z");
    const bEnd = new Date("2026-07-27T10:30:00Z");
    expect(overlapsInterval(aStart, aEnd, bStart, bEnd)).toBe(true);
  });

  it("respects buffer spacing", () => {
    const existingStart = new Date("2026-07-27T10:00:00Z");
    const existingEnd = new Date("2026-07-27T11:00:00Z");
    const candidateStart = new Date("2026-07-27T11:05:00Z");
    const candidateEnd = new Date("2026-07-27T12:05:00Z");
    expect(
      isWithinBuffer(
        candidateStart,
        candidateEnd,
        existingStart,
        existingEnd,
        15,
      ),
    ).toBe(true);
  });

  it("builds patient slots using duration plus buffer as the start interval", () => {
    expect(
      buildBookableSlotStarts("2026-07-27", {
        dayOfWeek: 1,
        slotDurationMinutes: 45,
        bufferMinutes: 15,
        windows: [{ startTime: "11:00", endTime: "15:00" }],
      }),
    ).toEqual(["11:00", "12:00", "13:00", "14:00"]);
  });

  it("formats all-day closed date ranges without clock times", () => {
    const start = DateTime.fromISO("2026-08-25", { zone: CLINIC_TIMEZONE })
      .startOf("day")
      .toJSDate();
    const end = DateTime.fromISO("2026-08-27", { zone: CLINIC_TIMEZONE })
      .endOf("day")
      .toJSDate();
    expect(formatBlockRange(start, end)).toBe("Aug 25 – Aug 27, 2026");
  });

  it("formats a single all-day closed date", () => {
    const start = DateTime.fromISO("2026-08-25", { zone: CLINIC_TIMEZONE })
      .startOf("day")
      .toJSDate();
    const end = DateTime.fromISO("2026-08-25", { zone: CLINIC_TIMEZONE })
      .endOf("day")
      .toJSDate();
    expect(formatBlockRange(start, end)).toBe("Aug 25, 2026");
  });

  it("formats timed ranges on the same day", () => {
    const start = DateTime.fromISO("2026-08-25T10:00:00", {
      zone: CLINIC_TIMEZONE,
    }).toJSDate();
    const end = DateTime.fromISO("2026-08-25T11:00:00", {
      zone: CLINIC_TIMEZONE,
    }).toJSDate();
    expect(formatBlockRange(start, end)).toContain("10:00");
  });

  it("skips break windows when building bookable starts", () => {
    expect(
      buildBookableSlotStarts("2026-07-27", {
        dayOfWeek: 1,
        slotDurationMinutes: 60,
        bufferMinutes: 0,
        windows: [
          { startTime: "11:00", endTime: "13:00" },
          { startTime: "13:00", endTime: "14:00", label: "Lunch Break" },
        ],
      }),
    ).toEqual(["11:00", "12:00"]);
  });
});

describe("createTimeOffSchema", () => {
  it("requires a reason and ordered dates", () => {
    expect(
      createTimeOffSchema.safeParse({
        dateFrom: "2026-08-25",
        dateTo: "2026-08-24",
        reason: "Holiday",
      }).success,
    ).toBe(false);
    expect(
      createTimeOffSchema.parse({
        dateFrom: "2026-08-25",
        dateTo: "2026-08-26",
        reason: "  Festival  ",
      }).reason,
    ).toBe("Festival");
  });
});
