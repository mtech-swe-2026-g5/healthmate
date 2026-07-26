import { act, cleanup, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

import type {
  AppCalendarEvent,
  AppCalendarSlotConfiguration,
} from "@/components/ui/AppCalendar";
import AppCalendar from "@/components/ui/AppCalendar";

type MockCalendarProps = {
  events?: AppCalendarEvent[];
  selectable?: boolean;
  onSelectSlot?: (slot: { start: Date; end: Date }) => void;
  onSelectEvent?: (event: { title: string }) => void;
  onRangeChange?: (range: Date[] | { start: Date; end: Date }) => void;
  slotPropGetter?: (date: Date) => { className?: string };
  eventPropGetter?: (
    event: AppCalendarEvent,
    start: Date,
    end: Date,
    isSelected: boolean,
  ) => { className?: string };
};

const mockState = vi.hoisted(() => ({
  calendarProps: null as MockCalendarProps | null,
  luxonLocalizer: vi.fn(() => "mock-localizer"),
  uuidV4: vi.fn(() => "generated-event-id"),
  prompt: vi.fn(() => "New Event"),
}));

const getCalendarProps = () => {
  if (!mockState.calendarProps) {
    throw new Error("Calendar props were not captured");
  }

  return mockState.calendarProps;
};

const getNoticeModal = (container: HTMLElement) =>
  container.querySelector("#modalContainer");

const expectNoticeHidden = (container: HTMLElement) => {
  const modal = getNoticeModal(container);
  expect(modal?.className).toContain("hidden");
};

const expectNoticeVisibleWith = (container: HTMLElement, message: string) => {
  const modal = getNoticeModal(container);
  expect(modal?.className).toContain("flex");
  expect(modal?.textContent).toContain(message);
};

vi.mock("react-big-calendar", () => ({
  Calendar: vi.fn((props: MockCalendarProps) => {
    mockState.calendarProps = props;
    return <div data-testid="app-calendar" />;
  }),
  Views: {
    WEEK: "WEEK",
    DAY: "DAY",
  },
  luxonLocalizer: mockState.luxonLocalizer,
}));

vi.mock("uuid", () => ({
  v4: mockState.uuidV4,
}));

describe("AppCalendar", () => {
  beforeEach(() => {
    mockState.calendarProps = null;
    vi.clearAllMocks();
    vi.stubGlobal("prompt", mockState.prompt);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("renders the calendar with the provided events and class name", () => {
    const events: AppCalendarEvent[] = [
      {
        id: "existing-event",
        title: "Existing appointment",
        start: new Date("2026-07-12T09:00:00.000Z"),
        end: new Date("2026-07-12T10:00:00.000Z"),
      },
    ];

    const { container } = render(
      <AppCalendar
        isLoading
        className="calendar-shell"
        events={events}
        allowEventCreation={false}
      />,
    );

    const calendar = container.querySelector('[data-testid="app-calendar"]');

    expect(calendar).not.toBeNull();
    expect(calendar?.parentElement).toBe(container.firstElementChild);
    expect((calendar?.parentElement as HTMLElement | null)?.className).toBe(
      "calendar-shell loading relative",
    );
    const calendarProps = getCalendarProps();

    expect(calendarProps.events).toEqual(events);
    expect(calendarProps.selectable).toBe(false);
    expect(calendarProps.onSelectSlot).toBeUndefined();
  });

  it("should call back the onSchedule function when an event is scheduled", async () => {
    const onSchedule = vi.fn();
    render(
      <AppCalendar isLoading allowEventCreation onSchedule={onSchedule} />,
    );

    const slot = {
      start: new Date("2026-07-12T11:00:00.000Z"),
      end: new Date("2026-07-12T11:30:00.000Z"),
    };

    act(() => {
      getCalendarProps().onSelectSlot?.(slot);
    });

    await waitFor(() => {
      expect(onSchedule).toHaveBeenCalledWith(slot.start, slot.end);
    });
    onSchedule.mockClear();
    const { container } = render(
      <AppCalendar
        isLoading={false}
        className="calendar-shell"
        allowEventCreation={false}
      />,
    );
    const calendar = container.querySelector('[data-testid="app-calendar"]');
    expect((calendar?.parentElement as HTMLElement | null)?.className).toBe(
      "calendar-shell relative",
    );
    expect(onSchedule).not.toHaveBeenCalled();
  });

  it("does not throw when a slot is selected and no onSchedule handler is provided", () => {
    render(<AppCalendar isLoading allowEventCreation />);

    const slot = {
      start: new Date("2026-07-12T11:00:00.000Z"),
      end: new Date("2026-07-12T11:30:00.000Z"),
    };

    expect(() => {
      act(() => {
        getCalendarProps().onSelectSlot?.(slot);
      });
    }).not.toThrow();
  });

  it.each([
    {
      name: "normalizes an array range",
      range: [
        new Date("2026-07-12T09:15:00"),
        new Date("2026-07-13T10:30:00"),
      ] as Date[],
      expectedStart: new Date("2026-07-12T00:00:00"),
      expectedEnd: new Date("2026-07-13T23:59:59.999"),
    },
    {
      name: "normalizes a start/end range object",
      range: {
        start: new Date("2026-07-14T13:45:00"),
        end: new Date("2026-07-16T08:20:00"),
      },
      expectedStart: new Date("2026-07-14T00:00:00"),
      expectedEnd: new Date("2026-07-16T23:59:59.999"),
    },
  ])(
    "calls onRangeChange when the calendar range changes and %s",
    ({ range, expectedStart, expectedEnd }) => {
      const onRangeChange = vi.fn();

      render(<AppCalendar isLoading onRangeChange={onRangeChange} />);

      act(() => {
        getCalendarProps().onRangeChange?.(range);
      });

      expect(onRangeChange).toHaveBeenCalledTimes(1);
      expect(onRangeChange).toHaveBeenCalledWith(
        new Date(expectedStart),
        new Date(expectedEnd),
      );
    },
  );

  it("does nothing when the calendar range changes and no onRangeChange handler is provided", () => {
    render(<AppCalendar isLoading />);

    expect(() => {
      act(() => {
        getCalendarProps().onRangeChange?.({
          start: new Date("2026-07-12T09:15:00.000Z"),
          end: new Date("2026-07-16T08:20:00.000Z"),
        });
      });
    }).not.toThrow();

    expect(mockState.prompt).not.toHaveBeenCalled();
  });

  it("allows overlapping appointments when overlap is enabled", async () => {
    const events: AppCalendarEvent[] = [
      {
        id: "existing-event",
        title: "Existing appointment",
        start: new Date("2026-07-12T09:00:00.000Z"),
        end: new Date("2026-07-12T10:00:00.000Z"),
      },
    ];
    const onSchedule = vi.fn(() => ({
      id: "allowed-overlap",
      title: "Allowed overlap",
    }));

    const { container } = render(
      <AppCalendar
        isLoading
        events={events}
        allowEventCreation
        allowOverlap
        onSchedule={onSchedule}
      />,
    );

    act(() => {
      getCalendarProps().onSelectSlot?.({
        start: new Date("2026-07-12T08:30:00.000Z"),
        end: new Date("2026-07-12T09:30:00.000Z"),
      });
    });

    await waitFor(() => {
      expect(onSchedule).toHaveBeenCalledTimes(1);
    });

    expectNoticeHidden(container);
  });

  it.each([
    {
      name: "accepts a non-overlapping slot",
      slot: {
        start: new Date("2026-07-12T10:30:00.000Z"),
        end: new Date("2026-07-12T10:45:00.000Z"),
      },
      shouldAlert: false,
      expectedScheduleCalls: 1,
    },
    {
      name: "rejects a slot when the first overlap condition fails",
      slot: {
        start: new Date("2026-07-12T09:30:00.000Z"),
        end: new Date("2026-07-12T10:30:00.000Z"),
      },
      shouldAlert: true,
      expectedScheduleCalls: 0,
    },
    {
      name: "rejects a slot when the second overlap condition fails",
      slot: {
        start: new Date("2026-07-12T08:30:00.000Z"),
        end: new Date("2026-07-12T09:30:00.000Z"),
      },
      shouldAlert: true,
      expectedScheduleCalls: 0,
    },
  ])("$name", ({ slot, shouldAlert, expectedScheduleCalls }) => {
    const events: AppCalendarEvent[] = [
      {
        id: "existing-event",
        title: "Existing appointment",
        start: new Date("2026-07-12T09:00:00.000Z"),
        end: new Date("2026-07-12T10:00:00.000Z"),
      },
    ];
    const onSchedule = vi.fn(() => ({
      id: "new-event",
      title: "New appointment",
    }));

    const { container } = render(
      <AppCalendar
        isLoading
        events={events}
        allowEventCreation
        allowOverlap={false}
        onSchedule={onSchedule}
      />,
    );

    act(() => {
      getCalendarProps().onSelectSlot?.(slot);
    });

    expect(onSchedule).toHaveBeenCalledTimes(expectedScheduleCalls);
    if (shouldAlert) {
      expectNoticeVisibleWith(container, "Cannot schedule overlap events.");
    } else {
      expectNoticeHidden(container);
    }
  });

  it("dismisses the schedule notice when the modal is closed", async () => {
    const events: AppCalendarEvent[] = [
      {
        id: "existing-event",
        title: "Existing appointment",
        start: new Date("2026-07-12T09:00:00.000Z"),
        end: new Date("2026-07-12T10:00:00.000Z"),
      },
    ];

    const { container } = render(
      <AppCalendar
        isLoading
        events={events}
        allowEventCreation
        allowOverlap={false}
      />,
    );

    act(() => {
      getCalendarProps().onSelectSlot?.({
        start: new Date("2026-07-12T09:30:00.000Z"),
        end: new Date("2026-07-12T10:30:00.000Z"),
      });
    });

    expectNoticeVisibleWith(container, "Cannot schedule overlap events.");

    const user = userEvent.setup();
    await user.click(container.querySelector("#closeIconBtn")!);

    expectNoticeHidden(container);
  });

  describe("Slot configuration restrictions", () => {
    // 2026-07-13 is a Monday, 2026-07-14 is a Tuesday, 2026-07-18 is a
    // Saturday. startTime/endTime are naive wall-clock times interpreted in
    // the slot's own `timezone` (Asia/Kolkata, UTC+5:30) — all test instants
    // below are expressed in UTC ("Z") so the assertions are independent of
    // the machine running the tests.
    const mondaySlotConfiguration: AppCalendarSlotConfiguration = {
      dayOfWeek: 1,
      startTime: new Date("1970-01-01T09:00:00.000Z"),
      endTime: new Date("1970-01-01T17:00:00.000Z"),
      timezone: "Asia/Kolkata",
    };

    it("marks every cell active when slotConfigurations is not provided", () => {
      render(<AppCalendar isLoading />);

      expect(
        getCalendarProps().slotPropGetter?.(new Date("2026-07-13T02:30:00Z")),
      ).toEqual({});
    });

    it("marks a cell inside the configured hours as active", () => {
      render(
        <AppCalendar
          isLoading
          slotConfigurations={[mondaySlotConfiguration]}
        />,
      );

      // 2026-07-13T04:30:00Z is 10:00 IST on Monday.
      const result = getCalendarProps().slotPropGetter?.(
        new Date("2026-07-13T04:30:00Z"),
      );

      expect(result).toEqual({});
    });

    it("marks a cell outside the configured hours as inactive", () => {
      render(
        <AppCalendar
          isLoading
          slotConfigurations={[mondaySlotConfiguration]}
        />,
      );

      // 2026-07-13T02:30:00Z is 08:00 IST on Monday, before the 09:00 start.
      const result = getCalendarProps().slotPropGetter?.(
        new Date("2026-07-13T02:30:00Z"),
      );

      expect(result).toEqual({ className: "app-calendar-slot-inactive" });
    });

    it("marks a cell on a day without a matching configuration as inactive", () => {
      render(
        <AppCalendar
          isLoading
          slotConfigurations={[mondaySlotConfiguration]}
        />,
      );

      // 2026-07-14T04:30:00Z is 10:00 IST on Tuesday (config is Monday-only).
      const result = getCalendarProps().slotPropGetter?.(
        new Date("2026-07-14T04:30:00Z"),
      );

      expect(result).toEqual({ className: "app-calendar-slot-inactive" });
    });

    it("treats a cell before validFrom as inactive", () => {
      render(
        <AppCalendar
          isLoading
          slotConfigurations={[
            {
              ...mondaySlotConfiguration,
              validFrom: new Date("2026-08-01T00:00:00Z"),
            },
          ]}
        />,
      );

      const result = getCalendarProps().slotPropGetter?.(
        new Date("2026-07-13T04:30:00Z"),
      );

      expect(result).toEqual({ className: "app-calendar-slot-inactive" });
    });

    it("treats a cell after validUntil as inactive", () => {
      render(
        <AppCalendar
          isLoading
          slotConfigurations={[
            {
              ...mondaySlotConfiguration,
              validUntil: new Date("2026-07-06T23:59:59.999Z"),
            },
          ]}
        />,
      );

      const result = getCalendarProps().slotPropGetter?.(
        new Date("2026-07-13T04:30:00Z"),
      );

      expect(result).toEqual({ className: "app-calendar-slot-inactive" });
    });

    it("unions multiple configurations for the same day", () => {
      render(
        <AppCalendar
          isLoading
          slotConfigurations={[
            {
              dayOfWeek: 1,
              startTime: new Date("1970-01-01T09:00:00.000Z"),
              endTime: new Date("1970-01-01T11:00:00.000Z"),
              timezone: "Asia/Kolkata",
            },
            {
              dayOfWeek: 1,
              startTime: new Date("1970-01-01T13:00:00.000Z"),
              endTime: new Date("1970-01-01T15:00:00.000Z"),
              timezone: "Asia/Kolkata",
            },
          ]}
        />,
      );

      const slotPropGetter = getCalendarProps().slotPropGetter;

      // 10:00, 12:00 and 14:00 IST respectively.
      expect(slotPropGetter?.(new Date("2026-07-13T04:30:00Z"))).toEqual({});
      expect(slotPropGetter?.(new Date("2026-07-13T06:30:00Z"))).toEqual({
        className: "app-calendar-slot-inactive",
      });
      expect(slotPropGetter?.(new Date("2026-07-13T08:30:00Z"))).toEqual({});
    });

    it("evaluates active hours in the slot's own timezone, independent of the viewer's local timezone", () => {
      // Regression test: startTime/endTime are naive wall-clock values with
      // no timezone of their own. Correctness comes from zoning the viewed
      // instant into the slot's own `timezone` before comparing — not from
      // the browser/test-runner's local timezone. All instants here are
      // absolute UTC ("Z") values, so this test's result cannot depend on
      // which timezone the machine running it happens to be in.
      render(
        <AppCalendar
          isLoading
          slotConfigurations={[
            {
              dayOfWeek: 6,
              startTime: new Date("1970-01-01T11:00:00.000Z"),
              endTime: new Date("1970-01-01T19:00:00.000Z"),
              timezone: "Asia/Kolkata",
            },
          ]}
        />,
      );

      const slotPropGetter = getCalendarProps().slotPropGetter;

      // 2026-07-18 is a Saturday. 14:00, 10:00 and 20:00 IST respectively.
      expect(slotPropGetter?.(new Date("2026-07-18T08:30:00Z"))).toEqual({});
      expect(slotPropGetter?.(new Date("2026-07-18T04:30:00Z"))).toEqual({
        className: "app-calendar-slot-inactive",
      });
      expect(slotPropGetter?.(new Date("2026-07-18T14:30:00Z"))).toEqual({
        className: "app-calendar-slot-inactive",
      });
    });

    it("blocks scheduling a new event outside the active hours", () => {
      const onSchedule = vi.fn();

      const { container } = render(
        <AppCalendar
          isLoading
          allowEventCreation
          slotConfigurations={[mondaySlotConfiguration]}
          onSchedule={onSchedule}
        />,
      );

      act(() => {
        getCalendarProps().onSelectSlot?.({
          start: new Date("2026-07-13T02:30:00Z"),
          end: new Date("2026-07-13T03:00:00Z"),
        });
      });

      expect(onSchedule).not.toHaveBeenCalled();
      expectNoticeVisibleWith(
        container,
        "Cannot schedule outside active hours.",
      );
    });

    it("allows scheduling a new event inside the active hours", () => {
      const onSchedule = vi.fn();

      const { container } = render(
        <AppCalendar
          isLoading
          allowEventCreation
          slotConfigurations={[mondaySlotConfiguration]}
          onSchedule={onSchedule}
        />,
      );

      const slot = {
        start: new Date("2026-07-13T04:30:00Z"),
        end: new Date("2026-07-13T05:00:00Z"),
      };

      act(() => {
        getCalendarProps().onSelectSlot?.(slot);
      });

      expect(onSchedule).toHaveBeenCalledWith(slot.start, slot.end);
      expectNoticeHidden(container);
    });

    it("darkens an existing event that starts outside the active hours", () => {
      render(
        <AppCalendar
          isLoading
          slotConfigurations={[mondaySlotConfiguration]}
        />,
      );

      const event: AppCalendarEvent = {
        id: "early-event",
        title: "Early appointment",
        start: new Date("2026-07-13T02:30:00Z"),
        end: new Date("2026-07-13T03:00:00Z"),
      };

      const result = getCalendarProps().eventPropGetter?.(
        event,
        event.start as Date,
        event.end as Date,
        false,
      );

      expect(result).toEqual({ className: "app-calendar-event-inactive" });
    });

    it("does not darken an existing event that starts inside the active hours", () => {
      render(
        <AppCalendar
          isLoading
          slotConfigurations={[mondaySlotConfiguration]}
        />,
      );

      const event: AppCalendarEvent = {
        id: "normal-event",
        title: "Normal appointment",
        start: new Date("2026-07-13T04:30:00Z"),
        end: new Date("2026-07-13T05:00:00Z"),
      };

      const result = getCalendarProps().eventPropGetter?.(
        event,
        event.start as Date,
        event.end as Date,
        false,
      );

      expect(result).toEqual({});
    });
  });
});
