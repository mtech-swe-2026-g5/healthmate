'use client';

import { useMemo, useState } from 'react';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

import { formatYmd } from '../lib/date-utils';

type SlotCalendarProps = {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function daysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

/** Monday-first weekday index: Mon=0 … Sun=6 */
function mondayFirstIndex(day: Date): number {
  return (day.getDay() + 6) % 7;
}

function isSelectable(date: Date, today: Date): boolean {
  if (date.getDay() === 0) return false;
  const ymd = formatYmd(date);
  const todayYmd = formatYmd(today);
  return ymd >= todayYmd;
}

export function SlotCalendar({ selectedDate, onSelectDate }: SlotCalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(today));

  const cells = useMemo(() => {
    const first = startOfMonth(viewMonth);
    const total = daysInMonth(viewMonth);
    const leading = mondayFirstIndex(first);
    const items: Array<{ date: Date | null; key: string }> = [];

    for (let i = 0; i < leading; i += 1) {
      items.push({ date: null, key: `pad-${i}` });
    }
    for (let day = 1; day <= total; day += 1) {
      const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day);
      items.push({ date, key: formatYmd(date) });
    }
    return items;
  }, [viewMonth]);

  const monthLabel = viewMonth.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const canGoPrev =
    viewMonth.getFullYear() > today.getFullYear() ||
    (viewMonth.getFullYear() === today.getFullYear() &&
      viewMonth.getMonth() > today.getMonth());

  return (
    <div>
      <div className="mb-[var(--spacing-hm-lg)] flex items-center justify-between gap-3">
        <h3 className="font-dm-sans text-headline-md text-[var(--color-on-surface)]">
          Select Date &amp; Time
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Previous month"
            disabled={!canGoPrev}
            onClick={() =>
              setViewMonth(
                new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1),
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-surface-container)] disabled:opacity-30"
          >
            <MdChevronLeft size={22} />
          </button>
          <span className="min-w-[9rem] text-center font-dm-sans text-title-lg text-[var(--color-on-surface)]">
            {monthLabel}
          </span>
          <button
            type="button"
            aria-label="Next month"
            onClick={() =>
              setViewMonth(
                new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1),
              )
            }
            className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-[var(--color-surface-container)]"
          >
            <MdChevronRight size={22} />
          </button>
        </div>
      </div>

      <div
        className="mb-[var(--spacing-hm-xl)] grid grid-cols-7 gap-1"
        role="grid"
        aria-label="Appointment calendar"
      >
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label) => (
          <div
            key={label}
            className="py-2 text-center font-dm-sans text-label-md text-[var(--color-on-surface-variant)] opacity-60"
          >
            {label}
          </div>
        ))}

        {cells.map(({ date, key }) => {
          if (!date) {
            return <div key={key} className="py-4" />;
          }

          const ymd = formatYmd(date);
          const selectable = isSelectable(date, today);
          const selected = selectedDate === ymd;
          const isSunday = date.getDay() === 0;

          if (!selectable) {
            return (
              <div
                key={key}
                className={`rounded-xl py-4 text-center font-dm-sans text-label-md ${
                  isSunday ? 'cursor-not-allowed opacity-30' : 'opacity-20'
                }`}
              >
                {date.getDate()}
              </div>
            );
          }

          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              aria-selected={selected}
              onClick={() => onSelectDate(ymd)}
              className={`relative rounded-xl py-4 text-center font-dm-sans text-label-md transition-all duration-200 ${
                selected
                  ? 'bg-[var(--color-primary-container)] text-white shadow-md ring-1 ring-[var(--color-primary)]'
                  : 'hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface)]'
              }`}
            >
              {date.getDate()}
              <span
                className={`absolute bottom-2 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                  selected ? 'bg-white' : 'bg-[var(--color-primary)]'
                }`}
                aria-hidden
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
