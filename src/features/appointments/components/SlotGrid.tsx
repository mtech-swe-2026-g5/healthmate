"use client";

import { MdWbSunny, MdWbTwilight } from "react-icons/md";

import type { TimeSlot } from "../lib/date-utils";

type SlotGridProps = {
  slots: TimeSlot[];
  selectedStartTime: string | null;
  onSelect: (startTime: string, endTime: string) => void;
  loading?: boolean;
  error?: string | null;
  selectedDateLabel?: string | null;
};

function formatDisplayTime(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function isMorning(hm: string): boolean {
  const hour = Number(hm.split(":")[0]);
  return hour < 12;
}

export function SlotGrid({
  slots,
  selectedStartTime,
  onSelect,
  loading,
  error,
  selectedDateLabel,
}: SlotGridProps) {
  if (loading) {
    return (
      <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
        Loading slots…
      </p>
    );
  }

  if (error) {
    return (
      <p
        role="alert"
        className="font-literata text-body-md text-[var(--color-error)]"
      >
        {error}
      </p>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
        Select a date to see available time slots.
      </p>
    );
  }

  const morning = slots.filter((s) => isMorning(s.startTime));
  const afternoon = slots.filter((s) => !isMorning(s.startTime));

  const renderGroup = (
    title: string,
    group: TimeSlot[],
    Icon: typeof MdWbSunny,
  ) => {
    if (group.length === 0) return null;
    return (
      <div className="mb-[var(--spacing-hm-lg)]">
        <p className="mb-2 inline-flex items-center gap-1.5 font-dm-sans text-label-sm font-bold tracking-wider text-[var(--color-on-surface-variant)] uppercase opacity-70">
          <Icon size={16} aria-hidden />
          {title}
        </p>
        <ul className="grid grid-cols-2 gap-[var(--spacing-hm-md)] sm:grid-cols-4">
          {group.map((slot) => {
            const isBooked = slot.status === "booked";
            const isUnavailable = slot.status === "unavailable";
            const disabled = isBooked || isUnavailable;
            const selected = selectedStartTime === slot.startTime;

            return (
              <li key={slot.startTime}>
                <button
                  type="button"
                  disabled={disabled}
                  aria-pressed={selected}
                  onClick={() => onSelect(slot.startTime, slot.endTime)}
                  className={`w-full rounded-full px-4 py-3 text-center font-dm-sans text-label-md transition-all duration-200 ${
                    isBooked
                      ? "cursor-not-allowed border border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface-variant)] line-through opacity-40"
                      : isUnavailable
                        ? "cursor-not-allowed border border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface-variant)] opacity-40"
                        : selected
                          ? "bg-[var(--color-primary)] text-white shadow-sm"
                          : "border border-[var(--color-outline-variant)] text-[var(--color-on-surface)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
                  }`}
                >
                  {formatDisplayTime(slot.startTime)}
                  {isBooked ? " · Booked" : ""}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-[var(--spacing-hm-md)] flex items-center justify-between gap-3">
        <h4 className="font-dm-sans text-title-lg text-[var(--color-on-surface)]">
          Available Times
        </h4>
        {selectedDateLabel && (
          <span className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
            {selectedDateLabel}
          </span>
        )}
      </div>
      {renderGroup("Morning", morning, MdWbSunny)}
      {renderGroup("Afternoon", afternoon, MdWbTwilight)}
    </div>
  );
}
