import { describe, expect, it } from "vitest";

import {
  mapAppointmentsToCalendarEvents,
  mapBlocksToCalendarEvents,
  filterBlocksForRange,
  mapSlotConfigurations,
  mergeCalendarEvents,
} from "@/features/doctor/calendar/lib/map-calendar-data";
import type { Appointment } from "@/features/doctor/appointments/types/response";

describe("map-calendar-data", () => {
  const appointment: Appointment = {
    id: "apt-1",
    patient: {
      id: "pat-1",
      firstName: "John",
      lastName: "Doe",
      age: 30,
      gender: "male",
      phoneNumber: "+1234567890",
      bloodGroup: "O+",
    },
    start: new Date("2026-07-14T10:00:00"),
    end: new Date("2026-07-14T11:00:00"),
  };

  it("maps appointments to calendar events", () => {
    expect(mapAppointmentsToCalendarEvents([appointment])).toEqual([
      {
        id: "apt-1",
        title: "John Doe",
        start: appointment.start,
        end: appointment.end,
        variant: "appointment",
      },
    ]);
  });

  it("returns empty list for undefined appointments", () => {
    expect(mapAppointmentsToCalendarEvents(undefined)).toEqual([]);
  });

  it("maps schedule blocks with fallback titles", () => {
    const mapped = mapBlocksToCalendarEvents([
      {
        id: "b1",
        startsAt: "2026-07-14T00:00:00.000Z",
        endsAt: "2026-07-14T23:59:59.999Z",
        reason: null,
        blockType: "BREAK",
      },
      {
        id: "b2",
        startsAt: "2026-08-19T18:30:00.000Z",
        endsAt: "2026-08-22T18:29:59.999Z",
        reason: "Holiday",
        blockType: "TIME_OFF",
      },
    ]);

    expect(mapped[0]).toEqual(
      expect.objectContaining({
        id: "block-b1",
        title: "Break",
        variant: "blocked",
      }),
    );

    const closedDays = mapped.filter((event) => event.isAllDayClosed);
    expect(closedDays.length).toBeGreaterThanOrEqual(3);
    expect(closedDays.every((event) => event.title === "Holiday")).toBe(true);
    expect(closedDays[0]).toEqual(
      expect.objectContaining({
        variant: "blocked",
        subtitle: "Closed",
      }),
    );
  });

  it("filters blocks to a visible calendar range", () => {
    const blocks = [
      {
        id: "b1",
        startsAt: "2026-08-01T00:00:00.000Z",
        endsAt: "2026-08-03T00:00:00.000Z",
        reason: "Away",
        blockType: "TIME_OFF" as const,
        label: "Aug 1 – Aug 3",
      },
      {
        id: "b2",
        startsAt: "2026-09-01T00:00:00.000Z",
        endsAt: "2026-09-02T00:00:00.000Z",
        reason: "Later",
        blockType: "TIME_OFF" as const,
        label: "Sep",
      },
    ];

    const inRange = filterBlocksForRange(
      blocks,
      new Date("2026-08-02T00:00:00.000Z"),
      new Date("2026-08-08T23:59:59.999Z"),
    );

    expect(inRange).toHaveLength(1);
    expect(inRange[0]?.id).toBe("b1");
  });

  it("maps slot configurations and merges event groups", () => {
    const slots = mapSlotConfigurations([
      {
        dayOfWeek: 1,
        startTime: new Date("1970-01-01T09:00:00.000Z"),
        endTime: new Date("1970-01-01T17:00:00.000Z"),
        timezone: "Asia/Kolkata",
        validFrom: new Date("2026-01-01T00:00:00.000Z"),
        validUntil: null,
      },
    ]);

    expect(slots?.[0]?.dayOfWeek).toBe(1);
    expect(
      mergeCalendarEvents(
        mapAppointmentsToCalendarEvents([appointment]),
        mapBlocksToCalendarEvents([]),
      ),
    ).toHaveLength(1);
  });
});
