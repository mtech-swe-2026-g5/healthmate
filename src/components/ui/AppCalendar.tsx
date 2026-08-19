"use client";

import "./AppCalendar.css";
import { Calendar, Event, luxonLocalizer, Views } from "react-big-calendar";
import { DateTime } from "luxon";
import { useCallback, useEffect, useRef, useState } from "react";
import Model from "@/components/ui/Model";
import { LoadingState } from "@/components/ui/PageLoading";
import {
  CALENDAR_FIRST_DAY_OF_WEEK,
  getCalendarWeekRange,
} from "@/lib/calendar-week";

const localizer = luxonLocalizer(DateTime, {
  firstDayOfWeek: CALENDAR_FIRST_DAY_OF_WEEK,
});

type OnScheduleCallback = (startDate: Date, endDate: Date) => void;
type OnRangeChangeCallback = (startDate: Date, endDate: Date) => void;
type OnEventSelectCallback = (event: AppCalendarEvent) => void;

export interface OnScheduleCallbackResult {
  id: string;
  title: string;
}

export interface AppCalendarEvent extends Event {
  id?: string;
  readonly?: boolean;
}

export interface AppCalendarSlotConfiguration {
  dayOfWeek: number;
  startTime: Date;
  endTime: Date;
  // IANA timezone identifier (e.g. "Asia/Kolkata") that startTime/endTime are
  // wall-clock times in. Required for accurate timezone conversion.
  timezone: string;
  validFrom?: Date;
  validUntil?: Date | null;
}

export interface AppCalendarProps {
  isLoading: boolean;
  events?: AppCalendarEvent[];
  allowOverlap?: boolean;
  allowEventCreation?: boolean;
  slotConfigurations?: AppCalendarSlotConfiguration[];
  onSchedule?: OnScheduleCallback;
  onEventSelect?: OnEventSelectCallback;
  onRangeChange?: OnRangeChangeCallback;
  className?: string;
  /** Extra CSS classes for calendar events (e.g. blocked-time styling). */
  getEventClassName?: (event: AppCalendarEvent) => string | undefined;
}

function isWithinValidityWindow(
  zoned: DateTime,
  config: AppCalendarSlotConfiguration,
): boolean {
  if (config.validFrom) {
    const validFrom = DateTime.fromJSDate(config.validFrom)
      .setZone(config.timezone)
      .startOf("day");
    if (zoned < validFrom) {
      return false;
    }
  }
  if (config.validUntil) {
    const validUntil = DateTime.fromJSDate(config.validUntil)
      .setZone(config.timezone)
      .endOf("day");
    if (zoned > validUntil) {
      return false;
    }
  }
  return true;
}

function isWithinTimeOfDay(
  zoned: DateTime,
  config: AppCalendarSlotConfiguration,
): boolean {
  // config.startTime/endTime come from a Prisma `@db.Time` column, which has
  // no timezone of its own. Prisma represents it as a Date on the 1970-01-01
  // epoch with the raw wall-clock value written to the UTC fields, so it
  // must always be read back with the UTC getters, regardless of the
  // viewer's timezone — correctness instead comes from zoning `zoned` into
  // the slot's own `config.timezone` before comparing.
  const startOfDay = zoned.startOf("day");
  const slotStart = startOfDay.set({
    hour: config.startTime.getUTCHours(),
    minute: config.startTime.getUTCMinutes(),
  });
  const slotEnd = startOfDay.set({
    hour: config.endTime.getUTCHours(),
    minute: config.endTime.getUTCMinutes(),
  });
  return zoned >= slotStart && zoned < slotEnd;
}

// Luxon weekdays are 1 (Monday) - 7 (Sunday); the app's day-of-week
// convention (matching JS Date#getDay and the SlotConfiguration schema) is
// 0 (Sunday) - 6 (Saturday).
function toSundayBasedWeekday(zoned: DateTime): number {
  return zoned.weekday % 7;
}

function isConfigActiveAt(
  instant: DateTime,
  config: AppCalendarSlotConfiguration,
): boolean {
  const zoned = instant.setZone(config.timezone);
  return (
    toSundayBasedWeekday(zoned) === config.dayOfWeek &&
    isWithinValidityWindow(zoned, config) &&
    isWithinTimeOfDay(zoned, config)
  );
}

export function isSlotActive(
  date: Date,
  slotConfigurations?: AppCalendarSlotConfiguration[],
): boolean {
  if (!slotConfigurations || slotConfigurations.length === 0) {
    return true;
  }

  const instant = DateTime.fromJSDate(date);
  return slotConfigurations.some((config) => isConfigActiveAt(instant, config));
}

function isBetweenExclusive(date: Date, start?: Date, end?: Date): boolean {
  if (!start || !end) {
    return false;
  }
  return date.getTime() > start.getTime() && date.getTime() < end.getTime();
}

export default function AppCalendar(props: AppCalendarProps) {
  const onRangeChange = props.onRangeChange;
  const onSchedule = props.onSchedule;
  const [notice, setNotice] = useState<string | null>(null);
  // react-big-calendar renders "today"/current-time-dependent content based
  // on the local clock and timezone. Rendering it during SSR would use the
  // server's clock/timezone, which almost always differs from the viewer's
  // browser, causing a hydration mismatch. Deferring the calendar itself to
  // a client-only render (after mount) avoids that entirely.
  const [hasMounted, setHasMounted] = useState(false);

  const hasSyncedInitialRange = useRef(false);

  useEffect(() => {
    // Intentional client-only-mount detection: this is the standard pattern
    // for deferring hydration-unsafe rendering to after mount, so the single
    // extra render this causes is expected and required here (unlike the
    // typical cascading-render pitfall this rule guards against).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
  }, []);

  // react-big-calendar does not fire onRangeChange on first paint. Sync the
  // parent's fetch window to the visible Sunday–Saturday week so appointments
  // appear without requiring prev/next navigation.
  useEffect(() => {
    if (!hasMounted || !onRangeChange || hasSyncedInitialRange.current) {
      return;
    }
    hasSyncedInitialRange.current = true;
    const { start, end } = getCalendarWeekRange(new Date());
    onRangeChange(start, end);
  }, [hasMounted, onRangeChange]);

  const handleOnRangeChange = useCallback(
    (range: Date[] | { start: Date; end: Date }) => {
      if (onRangeChange) {
        if (Array.isArray(range)) {
          onRangeChange(
            DateTime.fromJSDate(range[0]).startOf("day").toJSDate(),
            DateTime.fromJSDate(range[range.length - 1])
              .endOf("day")
              .toJSDate(),
          );
        } else {
          onRangeChange(
            DateTime.fromJSDate(range.start).startOf("day").toJSDate(),
            DateTime.fromJSDate(range.end).endOf("day").toJSDate(),
          );
        }
      }
    },
    [onRangeChange],
  );

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      if (props.slotConfigurations?.length) {
        const lastMinute = new Date(end.getTime() - 1);
        if (
          !isSlotActive(start, props.slotConfigurations) ||
          !isSlotActive(lastMinute, props.slotConfigurations)
        ) {
          setNotice("Cannot schedule outside active hours.");
          return;
        }
      }
      if (!props.allowOverlap) {
        const overlapEvents = props.events?.filter(
          (event) =>
            isBetweenExclusive(start, event.start, event.end) ||
            isBetweenExclusive(end, event.start, event.end),
        );
        if (overlapEvents?.length) {
          setNotice("Cannot schedule overlap events.");
          return;
        }
      }
      if (onSchedule) {
        onSchedule(start, end);
      }
    },
    [props.events, props.allowOverlap, props.slotConfigurations, onSchedule],
  );

  const rootClassName = [
    props.className,
    props.isLoading ? "loading" : null,
    "relative",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={rootClassName}
      aria-busy={props.isLoading || !hasMounted || undefined}
    >
      {!hasMounted ? (
        <LoadingState label="Loading calendar…" />
      ) : (
        <>
          {props.isLoading && (
            <div className="pointer-events-none absolute inset-x-0 top-2 z-10 flex justify-center">
              <LoadingState label="Refreshing schedule…" compact />
            </div>
          )}
          <Calendar
            localizer={localizer}
            defaultView={Views.WEEK}
            views={[Views.WEEK, Views.DAY]}
            events={props.events}
            onSelectEvent={props.onEventSelect}
            onSelectSlot={
              props.allowEventCreation ? handleSelectSlot : undefined
            }
            selectable={props.allowEventCreation}
            scrollToTime={new Date()}
            onRangeChange={handleOnRangeChange}
            slotPropGetter={(date) =>
              isSlotActive(date, props.slotConfigurations)
                ? {}
                : { className: "app-calendar-slot-inactive" }
            }
            eventPropGetter={(event, start) => {
              const inactive = !isSlotActive(start, props.slotConfigurations)
                ? "app-calendar-event-inactive"
                : undefined;
              const extra = props.getEventClassName?.(event);
              const className = [inactive, extra].filter(Boolean).join(" ");
              return className ? { className } : {};
            }}
          />
        </>
      )}
      <Model
        title="Unable to schedule"
        content={notice ?? ""}
        isOpen={notice !== null}
        onClose={() => setNotice(null)}
      />
    </div>
  );
}
