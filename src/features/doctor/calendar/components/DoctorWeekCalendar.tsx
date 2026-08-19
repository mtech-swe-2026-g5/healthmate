import "./DoctorWeekCalendar.css";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import {
  MdChevronLeft,
  MdChevronRight,
  MdLock,
  MdPerson,
} from "react-icons/md";

import { isSlotActive } from "@/components/ui/AppCalendar";
import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";
import {
  buildHourLabels,
  currentTimeIndicatorOffset,
  DAY_HEADER_HEIGHT_PX,
  formatHourLabel,
  getWeekDayColumns,
  isWeekendDay,
  placeTimedEvents,
  resolveGridBounds,
  ROW_HEIGHT_PX,
  TIME_COLUMN_WIDTH_PX,
} from "@/features/doctor/calendar/lib/layout";
import type {
  DoctorCalendarEvent,
  DoctorCalendarSlotConfiguration,
} from "@/features/doctor/calendar/types";
import { getCalendarWeekRange, shiftCalendarWeek } from "@/lib/calendar-week";
import { LoadingState } from "@/components/ui/PageLoading";

const MOBILE_BREAKPOINT = 768;
const MOBILE_VISIBLE_DAYS = 3;

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

export type DoctorWeekCalendarProps = {
  weekStart: Date;
  events?: DoctorCalendarEvent[];
  slotConfigurations?: DoctorCalendarSlotConfiguration[];
  isLoading?: boolean;
  onEventSelect?: (event: DoctorCalendarEvent) => void;
  onWeekChange?: (weekStart: Date, weekEnd: Date) => void;
  showNavigation?: boolean;
  className?: string;
};

export function DoctorWeekCalendar({
  weekStart,
  events = [],
  slotConfigurations,
  isLoading = false,
  onEventSelect,
  onWeekChange,
  showNavigation = false,
  className,
}: DoctorWeekCalendarProps) {
  const isMobile = useIsMobile();
  const [now, setNow] = useState(() => new Date());
  const [hasMounted, setHasMounted] = useState(false);
  const [mobileOffset, setMobileOffset] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasMounted(true);
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileOffset(0);
  }, [weekStart]);

  const allDays = useMemo(() => getWeekDayColumns(weekStart), [weekStart]);
  const weekEnd = useMemo(
    () => getCalendarWeekRange(weekStart).end,
    [weekStart],
  );

  const visibleDays = useMemo(() => {
    if (!isMobile) return allDays;
    const start = Math.max(
      0,
      Math.min(mobileOffset, allDays.length - MOBILE_VISIBLE_DAYS),
    );
    return allDays.slice(start, start + MOBILE_VISIBLE_DAYS);
  }, [isMobile, allDays, mobileOffset]);

  const visibleDayIndices = useMemo(() => {
    if (!isMobile) return allDays.map((_, i) => i);
    const start = Math.max(
      0,
      Math.min(mobileOffset, allDays.length - MOBILE_VISIBLE_DAYS),
    );
    return Array.from({ length: MOBILE_VISIBLE_DAYS }, (_, i) => start + i);
  }, [isMobile, allDays, mobileOffset]);

  const numCols = visibleDays.length;

  const canShiftMobileLeft = mobileOffset > 0;
  const canShiftMobileRight =
    mobileOffset < allDays.length - MOBILE_VISIBLE_DAYS;

  const shiftMobile = useCallback(
    (dir: -1 | 1) => {
      setMobileOffset((prev) => {
        const next = prev + dir;
        return Math.max(
          0,
          Math.min(next, allDays.length - MOBILE_VISIBLE_DAYS),
        );
      });
    },
    [allDays.length],
  );

  const { startHour, endHour } = useMemo(
    () => resolveGridBounds(slotConfigurations),
    [slotConfigurations],
  );
  const hourLabels = useMemo(
    () => buildHourLabels(startHour, endHour),
    [startHour, endHour],
  );
  const mobileRowHeight = isMobile ? 48 : ROW_HEIGHT_PX;
  const gridHeight = hourLabels.length * mobileRowHeight;

  const normalizedEvents = useMemo(
    () =>
      events.map((event) => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        variant: event.variant ?? ("appointment" as const),
        subtitle: event.subtitle,
        isAllDayClosed: event.isAllDayClosed,
      })),
    [events],
  );

  const closedByDayIndex = useMemo(() => {
    const map = new Map<number, string>();
    for (const event of events) {
      if (!event.isAllDayClosed) continue;
      const start = DateTime.fromJSDate(event.start).setZone(CLINIC_TIMEZONE);
      const dayIndex = allDays.findIndex((day) => day.hasSame(start, "day"));
      if (dayIndex >= 0) {
        map.set(dayIndex, event.title);
      }
    }
    return map;
  }, [events, allDays]);

  const placedEvents = useMemo(
    () => placeTimedEvents(normalizedEvents, weekStart, startHour, endHour),
    [normalizedEvents, weekStart, startHour, endHour],
  );

  const scaleY = mobileRowHeight / ROW_HEIGHT_PX;

  const nowIndicator = useMemo(
    () =>
      hasMounted
        ? currentTimeIndicatorOffset(now, weekStart, startHour, endHour)
        : null,
    [hasMounted, now, weekStart, startHour, endHour],
  );

  const eventById = useMemo(
    () => new Map(events.map((event) => [event.id, event])),
    [events],
  );

  const shiftWeek = (weeks: number) => {
    if (!onWeekChange) return;
    const next = shiftCalendarWeek(weekStart, weeks);
    onWeekChange(next.start, next.end);
  };

  const weekLabel = `${DateTime.fromJSDate(weekStart).setZone(CLINIC_TIMEZONE).toFormat("MMM d")} – ${DateTime.fromJSDate(weekEnd).setZone(CLINIC_TIMEZONE).toFormat("MMM d, yyyy")}`;

  const rootClass = [
    "doctor-week-calendar",
    className,
    isLoading ? "is-loading" : null,
  ]
    .filter(Boolean)
    .join(" ");

  const colMinWidth = isMobile ? "80px" : "120px";

  return (
    <div className={rootClass} aria-busy={isLoading || undefined}>
      {showNavigation && onWeekChange ? (
        <div className="doctor-week-calendar__toolbar">
          <button
            type="button"
            className="doctor-week-calendar__nav-btn"
            onClick={() => shiftWeek(-1)}
            aria-label="Previous week"
          >
            <MdChevronLeft size={22} />
          </button>
          <button
            type="button"
            className="doctor-week-calendar__week-label"
            onClick={() => {
              const current = getCalendarWeekRange(
                DateTime.now().setZone(CLINIC_TIMEZONE).toJSDate(),
              );
              onWeekChange(current.start, current.end);
            }}
          >
            {weekLabel}
          </button>
          <button
            type="button"
            className="doctor-week-calendar__nav-btn"
            onClick={() => shiftWeek(1)}
            aria-label="Next week"
          >
            <MdChevronRight size={22} />
          </button>
        </div>
      ) : null}

      {isMobile ? (
        <div className="doctor-week-calendar__mobile-day-nav">
          <button
            type="button"
            disabled={!canShiftMobileLeft}
            onClick={() => shiftMobile(-1)}
            className="doctor-week-calendar__mobile-nav-btn"
            aria-label="Show earlier days"
          >
            <MdChevronLeft size={20} />
          </button>
          <span className="doctor-week-calendar__mobile-day-range">
            {visibleDays[0]?.toFormat("EEE d")} –{" "}
            {visibleDays[visibleDays.length - 1]?.toFormat("EEE d")}
          </span>
          <button
            type="button"
            disabled={!canShiftMobileRight}
            onClick={() => shiftMobile(1)}
            className="doctor-week-calendar__mobile-nav-btn"
            aria-label="Show later days"
          >
            <MdChevronRight size={20} />
          </button>
        </div>
      ) : null}

      <div className="doctor-week-calendar__scroll custom-scrollbar">
        <div
          className="doctor-week-calendar__grid"
          style={{
            gridTemplateColumns: `${isMobile ? 48 : TIME_COLUMN_WIDTH_PX}px repeat(${numCols}, minmax(${colMinWidth}, 1fr))`,
          }}
        >
          <div
            className="doctor-week-calendar__corner"
            style={{ height: isMobile ? 48 : DAY_HEADER_HEIGHT_PX }}
          >
            <span className="doctor-week-calendar__time-heading">
              {isMobile ? "" : "Time"}
            </span>
          </div>

          {visibleDays.map((day, idx) => {
            const globalIndex = visibleDayIndices[idx]!;
            const isToday = day.hasSame(
              DateTime.now().setZone(CLINIC_TIMEZONE),
              "day",
            );
            const weekend = isWeekendDay(day);
            const closedReason = closedByDayIndex.get(globalIndex);
            return (
              <div
                key={day.toISODate()}
                className={`doctor-week-calendar__day-header ${isToday ? "is-today" : ""} ${weekend ? "is-weekend" : ""} ${closedReason ? "is-closed" : ""}`}
                style={{ height: isMobile ? 48 : DAY_HEADER_HEIGHT_PX }}
              >
                <span className="doctor-week-calendar__day-name">
                  {day.toFormat("ccc").toUpperCase()}
                </span>
                {isToday ? (
                  <span className="doctor-week-calendar__day-number is-today-badge">
                    {day.day}
                  </span>
                ) : (
                  <span className="doctor-week-calendar__day-number">
                    {day.day}
                  </span>
                )}
                {closedReason && !isMobile ? (
                  <span
                    className="doctor-week-calendar__closed-badge"
                    title={closedReason}
                  >
                    {closedReason}
                  </span>
                ) : null}
              </div>
            );
          })}

          <div
            className="doctor-week-calendar__time-column"
            style={{ height: gridHeight }}
          >
            {hourLabels.map((hour) => (
              <div
                key={hour}
                className="doctor-week-calendar__time-label"
                style={{ height: mobileRowHeight }}
              >
                {formatHourLabel(hour)}
              </div>
            ))}
          </div>

          {visibleDays.map((day, idx) => {
            const globalIndex = visibleDayIndices[idx]!;
            const weekend = isWeekendDay(day);
            const isToday = day.hasSame(
              DateTime.now().setZone(CLINIC_TIMEZONE),
              "day",
            );
            const closedReason = closedByDayIndex.get(globalIndex);
            return (
              <div
                key={`col-${day.toISODate()}`}
                className={`doctor-week-calendar__day-column ${weekend ? "is-weekend" : ""} ${isToday ? "is-today" : ""} ${closedReason ? "is-closed" : ""}`}
                style={{ height: gridHeight }}
              >
                {hourLabels.map((hour) => {
                  const cellDate = day
                    .set({ hour, minute: 0, second: 0, millisecond: 0 })
                    .toJSDate();
                  const active = isSlotActive(cellDate, slotConfigurations);
                  return (
                    <div
                      key={hour}
                      className={`doctor-week-calendar__hour-cell ${active ? "" : "is-inactive"}`}
                      style={{ height: mobileRowHeight }}
                    />
                  );
                })}

                {nowIndicator?.dayIndex === globalIndex ? (
                  <div
                    className="doctor-week-calendar__now-line"
                    style={{ top: nowIndicator.top * scaleY }}
                    aria-hidden
                  >
                    <span className="doctor-week-calendar__now-dot" />
                  </div>
                ) : null}

                {placedEvents
                  .filter((event) => event.dayIndex === globalIndex)
                  .map((event) => {
                    const source = eventById.get(event.id);
                    const isBlocked = event.variant === "blocked";
                    const isAllDayClosed = event.isAllDayClosed ?? false;
                    const eventTop = event.top * scaleY;
                    const eventHeight = event.height * scaleY;
                    return (
                      <button
                        key={event.id}
                        type="button"
                        disabled={isBlocked}
                        className={`doctor-week-calendar__event ${isBlocked ? "is-blocked" : "is-appointment"} ${isAllDayClosed ? "is-all-day-closed" : ""}`}
                        style={{ top: eventTop, height: eventHeight }}
                        onClick={() => source && onEventSelect?.(source)}
                      >
                        <p className="doctor-week-calendar__event-title">
                          {event.title}
                        </p>
                        {!isMobile && event.subtitle ? (
                          <p className="doctor-week-calendar__event-sub">
                            {event.subtitle}
                          </p>
                        ) : null}
                        {!isMobile ? (
                          !isBlocked ? (
                            <span className="doctor-week-calendar__event-icon">
                              <MdPerson size={14} aria-hidden />
                            </span>
                          ) : (
                            <span className="doctor-week-calendar__event-icon">
                              <MdLock size={14} aria-hidden />
                            </span>
                          )
                        ) : null}
                      </button>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="doctor-week-calendar__loading">
          <LoadingState label="Loading schedule…" compact />
        </div>
      ) : null}
    </div>
  );
}
