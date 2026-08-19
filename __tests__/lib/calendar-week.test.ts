import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";
import {
  getCalendarWeekRange,
  shiftCalendarWeek,
  CALENDAR_FIRST_DAY_OF_WEEK,
} from "@/lib/calendar-week";

function clinicDate(instant: Date): string {
  return DateTime.fromJSDate(instant).setZone(CLINIC_TIMEZONE).toISODate() ?? "";
}

describe("calendar-week", () => {
  it("uses Sunday as the first day of week", () => {
    expect(CALENDAR_FIRST_DAY_OF_WEEK).toBe(7);
  });

  it("returns Sunday–Saturday for a mid-week date", () => {
    const reference = DateTime.fromISO("2026-08-18T12:00:00", {
      zone: CLINIC_TIMEZONE,
    });
    const { start, end } = getCalendarWeekRange(reference);

    expect(clinicDate(start)).toBe("2026-08-16");
    expect(clinicDate(end)).toBe("2026-08-22");
  });

  it("returns the same week when the reference is Sunday", () => {
    const reference = DateTime.fromISO("2026-08-16T08:00:00", {
      zone: CLINIC_TIMEZONE,
    });
    const { start, end } = getCalendarWeekRange(reference);

    expect(clinicDate(start)).toBe("2026-08-16");
    expect(clinicDate(end)).toBe("2026-08-22");
  });

  it("shifts to adjacent calendar weeks", () => {
    const reference = DateTime.fromISO("2026-08-18T12:00:00", {
      zone: CLINIC_TIMEZONE,
    });
    const prev = shiftCalendarWeek(reference, -1);
    const next = shiftCalendarWeek(reference, 1);

    expect(clinicDate(prev.start)).toBe("2026-08-09");
    expect(clinicDate(next.start)).toBe("2026-08-23");
  });

  it("uses Sunday as the first clinic weekday even when the Date is a UTC Saturday", () => {
    const tuesdayUtc = new Date("2026-08-18T15:00:00.000Z");
    const { start } = getCalendarWeekRange(tuesdayUtc);
    expect(
      DateTime.fromJSDate(start).setZone(CLINIC_TIMEZONE).weekday % 7,
    ).toBe(0);
  });
});
