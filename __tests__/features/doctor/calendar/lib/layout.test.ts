import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";
import {
  buildHourLabels,
  currentTimeIndicatorOffset,
  formatHourLabel,
  getWeekDayColumns,
  isWeekendDay,
  placeTimedEvents,
  resolveGridBounds,
  ROW_HEIGHT_PX,
} from "@/features/doctor/calendar/lib/layout";
import { getCalendarWeekRange } from "@/lib/calendar-week";

describe("doctor calendar layout", () => {
  it("builds seven day columns from a Sunday week start", () => {
    const { start } = getCalendarWeekRange(new Date("2026-07-14T12:00:00Z"));
    const days = getWeekDayColumns(start);

    expect(days).toHaveLength(7);
    expect(days[0].weekday % 7).toBe(0);
    expect(days[6].weekday % 7).toBe(6);
  });

  it("falls back to default grid bounds when slot configs are missing", () => {
    expect(resolveGridBounds(undefined)).toEqual({
      startHour: 8,
      endHour: 19,
    });
  });

  it("derives grid bounds from slot configuration hours", () => {
    const bounds = resolveGridBounds([
      {
        startTime: new Date("1970-01-01T09:00:00.000Z"),
        endTime: new Date("1970-01-01T17:00:00.000Z"),
      },
    ]);

    expect(bounds.startHour).toBe(8);
    expect(bounds.endHour).toBe(18);
  });

  it("builds hour labels inclusive of start and end", () => {
    expect(buildHourLabels(8, 10)).toEqual([8, 9, 10]);
  });

  it("places timed events on the correct day column", () => {
    const weekStart = DateTime.fromISO("2026-07-12", { zone: CLINIC_TIMEZONE })
      .startOf("day")
      .toJSDate();
    const placed = placeTimedEvents(
      [
        {
          id: "apt-1",
          title: "John Doe",
          start: DateTime.fromISO("2026-07-14T10:00:00", {
            zone: CLINIC_TIMEZONE,
          }).toJSDate(),
          end: DateTime.fromISO("2026-07-14T11:00:00", {
            zone: CLINIC_TIMEZONE,
          }).toJSDate(),
          variant: "appointment",
        },
      ],
      weekStart,
      8,
      19,
    );

    expect(placed).toHaveLength(1);
    expect(placed[0].dayIndex).toBe(2);
    expect(placed[0].top).toBe(2 * ROW_HEIGHT_PX);
    expect(placed[0].height).toBe(ROW_HEIGHT_PX);
  });

  it("skips events outside the visible week", () => {
    const weekStart = DateTime.fromISO("2026-07-12", { zone: CLINIC_TIMEZONE })
      .startOf("day")
      .toJSDate();
    const placed = placeTimedEvents(
      [
        {
          id: "outside",
          title: "Outside week",
          start: DateTime.fromISO("2026-07-20T10:00:00", {
            zone: CLINIC_TIMEZONE,
          }).toJSDate(),
          end: DateTime.fromISO("2026-07-20T11:00:00", {
            zone: CLINIC_TIMEZONE,
          }).toJSDate(),
          variant: "appointment",
        },
      ],
      weekStart,
      8,
      19,
    );

    expect(placed).toHaveLength(0);
  });

  it("places all-day closed events across the full grid height", () => {
    const weekStart = DateTime.fromISO("2026-08-16", { zone: CLINIC_TIMEZONE })
      .startOf("day")
      .toJSDate();
    const placed = placeTimedEvents(
      [
        {
          id: "closed-1",
          title: "Holiday",
          start: DateTime.fromISO("2026-08-20T00:00:00", {
            zone: CLINIC_TIMEZONE,
          })
            .startOf("day")
            .toJSDate(),
          end: DateTime.fromISO("2026-08-20T00:00:00", {
            zone: CLINIC_TIMEZONE,
          })
            .endOf("day")
            .toJSDate(),
          variant: "blocked",
          isAllDayClosed: true,
          subtitle: "Closed",
        },
      ],
      weekStart,
      8,
      19,
    );

    expect(placed).toHaveLength(1);
    expect(placed[0]?.dayIndex).toBe(4);
    expect(placed[0]?.top).toBe(0);
    expect(placed[0]?.height).toBe(12 * ROW_HEIGHT_PX);
    expect(placed[0]?.isAllDayClosed).toBe(true);
  });

  it("returns current time indicator for today within grid hours", () => {
    const weekStart = DateTime.fromISO("2026-07-12", { zone: CLINIC_TIMEZONE })
      .startOf("day")
      .toJSDate();
    const now = DateTime.fromISO("2026-07-14T10:30:00", {
      zone: CLINIC_TIMEZONE,
    }).toJSDate();

    const indicator = currentTimeIndicatorOffset(now, weekStart, 8, 19);

    expect(indicator).not.toBeNull();
    expect(indicator?.dayIndex).toBe(2);
    expect(indicator?.top).toBe(2.5 * ROW_HEIGHT_PX);
  });

  it("formats hour labels in clinic timezone", () => {
    expect(formatHourLabel(9)).toBe("09:00");
  });

  it("identifies weekend days", () => {
    const sunday = DateTime.fromISO("2026-07-12", { zone: CLINIC_TIMEZONE });
    const monday = DateTime.fromISO("2026-07-13", { zone: CLINIC_TIMEZONE });

    expect(isWeekendDay(sunday)).toBe(true);
    expect(isWeekendDay(monday)).toBe(false);
  });
});
