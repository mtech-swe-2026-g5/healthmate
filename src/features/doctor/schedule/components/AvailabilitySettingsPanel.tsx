"use client";

import { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { MdDelete, MdEventBusy } from "react-icons/md";

import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";
import { defaultWeeklyHours } from "@/features/doctor/schedule/lib/defaults";
import type {
  DoctorScheduleResponse,
  UpdateScheduleSettingsInput,
  WeeklyDay,
} from "@/features/doctor/schedule/types/schemas";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const BUFFER_OPTIONS = [10, 15, 20] as const;

type AvailabilitySettingsPanelProps = {
  schedule?: DoctorScheduleResponse;
  isSaving: boolean;
  deletingBlockId?: string | null;
  onSave: (input: UpdateScheduleSettingsInput) => Promise<void>;
  onAddBlock: (input: {
    dateFrom: string;
    dateTo: string;
    reason: string;
  }) => Promise<void>;
  onDeleteBlock: (blockId: string) => Promise<void>;
};

export function AvailabilitySettingsPanel({
  schedule,
  isSaving,
  deletingBlockId,
  onSave,
  onAddBlock,
  onDeleteBlock,
}: AvailabilitySettingsPanelProps) {
  return (
    <AvailabilitySettingsForm
      key={schedule ? JSON.stringify(schedule.settings) : "loading"}
      schedule={schedule}
      isSaving={isSaving}
      deletingBlockId={deletingBlockId}
      onSave={onSave}
      onAddBlock={onAddBlock}
      onDeleteBlock={onDeleteBlock}
    />
  );
}

function AvailabilitySettingsForm({
  schedule,
  isSaving,
  deletingBlockId,
  onSave,
  onAddBlock,
  onDeleteBlock,
}: AvailabilitySettingsPanelProps) {
  const [accepting, setAccepting] = useState(
    schedule?.settings.acceptingNewPatients ?? true,
  );
  const [bufferMinutes, setBufferMinutes] = useState<10 | 15 | 20>(
    (schedule?.settings.bufferMinutes as 10 | 15 | 20) ?? 15,
  );
  const [slotDurationMinutes, setSlotDurationMinutes] = useState(
    schedule?.settings.slotDurationMinutes ?? 60,
  );
  const [weeklyHours, setWeeklyHours] = useState<WeeklyDay[]>(
    defaultWeeklyHours(schedule?.weeklyHours),
  );
  const [blockFrom, setBlockFrom] = useState("");
  const [blockTo, setBlockTo] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [blockError, setBlockError] = useState<string | null>(null);
  const [isAddingBlock, setIsAddingBlock] = useState(false);

  const todayYmd = useMemo(
    () => DateTime.now().setZone(CLINIC_TIMEZONE).toFormat("yyyy-MM-dd"),
    [],
  );

  const save = () => {
    onSave({
      acceptingNewPatients: accepting,
      bufferMinutes,
      slotDurationMinutes,
      weeklyHours,
    });
  };

  const updateDay = (dayOfWeek: number, patch: Partial<WeeklyDay>) => {
    setWeeklyHours((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)),
    );
  };

  const addClosedDates = async () => {
    setBlockError(null);
    if (!blockFrom || !blockTo) {
      setBlockError("Choose a from date and a to date.");
      return;
    }
    if (blockFrom < todayYmd || blockTo < todayYmd) {
      setBlockError("Closed dates must be today or in the future.");
      return;
    }
    if (blockTo < blockFrom) {
      setBlockError("End date must be on or after the start date.");
      return;
    }
    if (!blockReason.trim()) {
      setBlockError("Add a reason for the closed dates.");
      return;
    }

    setIsAddingBlock(true);
    try {
      await onAddBlock({
        dateFrom: blockFrom,
        dateTo: blockTo,
        reason: blockReason.trim(),
      });
      setBlockFrom("");
      setBlockTo("");
      setBlockReason("");
    } catch (error) {
      setBlockError(
        error instanceof Error ? error.message : "Could not block dates.",
      );
    } finally {
      setIsAddingBlock(false);
    }
  };

  return (
    <section
      className="w-full rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] shadow-[0px_4px_20px_rgba(26,107,114,0.08)]"
      aria-labelledby="availability-settings-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-outline-variant)]/20 p-6">
        <div>
          <h2
            id="availability-settings-heading"
            className="font-dm-sans text-headline-md text-[var(--color-on-surface)]"
          >
            Availability Settings
          </h2>
          <p className="mt-1 font-literata text-body-md text-[var(--color-on-surface-variant)]">
            Configure working hours and booking rules.
          </p>
        </div>
        <button
          type="button"
          disabled={isSaving}
          onClick={save}
          className="rounded-xl bg-[var(--color-primary)] px-6 py-3 font-dm-sans text-label-md text-[var(--color-on-primary)] shadow-lg transition-all hover:scale-[1.01] disabled:opacity-60"
        >
          {isSaving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 p-6 xl:grid-cols-12">
        <section className="xl:col-span-12">
          <h2 className="mb-2 font-dm-sans text-label-md font-bold tracking-wider text-[var(--color-outline)] uppercase">
            Availability Days
          </h2>
          <p className="mb-4 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
            Turn a day off to close it for patient booking.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
            {weeklyHours.map((day) => (
              <DayAvailabilityRow
                key={day.dayOfWeek}
                day={day}
                onChange={(patch) => updateDay(day.dayOfWeek, patch)}
              />
            ))}
          </div>
        </section>

        <section className="flex items-center justify-between rounded-xl border border-[var(--color-outline-variant)]/20 bg-[var(--color-surface-container-highest)]/20 p-4 xl:col-span-4">
          <div>
            <h2 className="font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
              Accepting New Patients
            </h2>
            <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
              Hide this doctor from public booking when off
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={accepting}
            aria-label="Accepting new patients"
            onClick={() => setAccepting((v) => !v)}
            className={`relative h-6 w-12 shrink-0 rounded-full transition-colors ${
              accepting
                ? "bg-[var(--color-primary)]"
                : "bg-[var(--color-outline-variant)]"
            }`}
          >
            <span
              className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
                accepting ? "right-1" : "left-1"
              }`}
            />
          </button>
        </section>

        <section className="xl:col-span-4">
          <h2 className="mb-4 font-dm-sans text-label-md font-bold tracking-wider text-[var(--color-outline)] uppercase">
            Session Duration (mins)
          </h2>
          <input
            id="slot-duration"
            type="number"
            min={15}
            max={120}
            step={15}
            value={slotDurationMinutes}
            onChange={(e) =>
              setSlotDurationMinutes(Number(e.target.value) || 60)
            }
            className="w-full rounded-lg border border-[var(--color-outline-variant)]/50 px-3 py-2 font-dm-sans text-label-md"
            aria-describedby="slot-duration-hint"
          />
          <p
            id="slot-duration-hint"
            className="mt-2 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]"
          >
            Patient slots start every {slotDurationMinutes + bufferMinutes}{" "}
            minutes ({slotDurationMinutes} min session + {bufferMinutes} min
            buffer).
          </p>
        </section>

        <section className="xl:col-span-4">
          <h2 className="mb-4 font-dm-sans text-label-md font-bold tracking-wider text-[var(--color-outline)] uppercase">
            Buffer Between Sessions
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {BUFFER_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setBufferMinutes(value)}
                className={`rounded-lg py-2 font-dm-sans text-label-md ${
                  bufferMinutes === value
                    ? "border-2 border-[var(--color-primary)] bg-[var(--color-primary-container)]/10 font-bold text-[var(--color-primary)]"
                    : "border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]"
                }`}
              >
                {value} min
              </button>
            ))}
          </div>
        </section>

        <section className="xl:col-span-12">
          <h2 className="mb-2 font-dm-sans text-label-md font-bold tracking-wider text-[var(--color-outline)] uppercase">
            Holidays &amp; Time Off
          </h2>
          <p className="mb-4 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
            Block a future date range. Any confirmed appointments on those days
            will be automatically cancelled and patients notified.
          </p>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                  From date
                  <input
                    type="date"
                    min={todayYmd}
                    value={blockFrom}
                    onChange={(e) => setBlockFrom(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--color-outline-variant)]/50 px-3 py-2 font-dm-sans text-label-md text-[var(--color-on-surface)]"
                  />
                </label>
                <label className="block font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                  To date
                  <input
                    type="date"
                    min={blockFrom || todayYmd}
                    value={blockTo}
                    onChange={(e) => setBlockTo(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-[var(--color-outline-variant)]/50 px-3 py-2 font-dm-sans text-label-md text-[var(--color-on-surface)]"
                  />
                </label>
              </div>
              <label className="block font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                Reason
                <input
                  type="text"
                  maxLength={120}
                  placeholder="e.g. Festival holiday"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-[var(--color-outline-variant)]/50 px-3 py-2 font-dm-sans text-label-md text-[var(--color-on-surface)]"
                />
              </label>
              {blockError ? (
                <p
                  role="alert"
                  className="font-dm-sans text-label-sm text-[var(--color-error)]"
                >
                  {blockError}
                </p>
              ) : null}
              <button
                type="button"
                disabled={isAddingBlock}
                onClick={() => void addClosedDates()}
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-outline-variant)] py-4 font-dm-sans text-label-md text-[var(--color-outline)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] disabled:opacity-60"
              >
                <MdEventBusy size={18} />
                {isAddingBlock ? "Blocking…" : "Add closed dates"}
              </button>
            </div>

            <div className="space-y-2">
              {schedule?.blocks.length ? (
                schedule.blocks.map((block) => (
                  <div
                    key={block.id}
                    className="flex items-start justify-between gap-2 rounded-lg bg-[var(--color-surface-container-low)] px-3 py-2"
                  >
                    <div>
                      <p className="font-dm-sans text-label-sm text-[var(--color-on-surface)]">
                        {block.label}
                      </p>
                      {block.reason ? (
                        <p className="text-xs text-[var(--color-outline)] italic">
                          {block.reason}
                        </p>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove closed dates ${block.label}`}
                      disabled={deletingBlockId === block.id}
                      onClick={() => onDeleteBlock(block.id)}
                      className="text-[var(--color-outline)] transition-colors hover:text-[var(--color-error)] disabled:animate-pulse disabled:opacity-50"
                    >
                      {deletingBlockId === block.id ? (
                        <span className="inline-block h-[18px] w-[18px] animate-spin rounded-full border-2 border-current border-t-transparent" />
                      ) : (
                        <MdDelete size={18} />
                      )}
                    </button>
                  </div>
                ))
              ) : (
                <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                  No closed dates added yet.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

function DayAvailabilityRow({
  day,
  onChange,
}: {
  day: WeeklyDay;
  onChange: (patch: Partial<WeeklyDay>) => void;
}) {
  const session = day.sessions[0] ?? {
    startTime: "09:00",
    endTime: "17:00",
    label: null,
  };

  return (
    <div
      className={`rounded-xl bg-[var(--color-surface-container-low)] p-3 ${
        day.enabled ? "" : "opacity-70"
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-dm-sans text-label-md font-medium">
          {DAY_NAMES[day.dayOfWeek]}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={day.enabled}
          aria-label={`${DAY_NAMES[day.dayOfWeek]} available`}
          onClick={() =>
            onChange({
              enabled: !day.enabled,
              sessions: !day.enabled
                ? [{ startTime: "09:00", endTime: "17:00", label: null }]
                : [],
            })
          }
          className={`relative h-6 w-11 rounded-full transition-colors ${
            day.enabled
              ? "bg-[var(--color-primary)]"
              : "bg-[var(--color-outline-variant)]"
          }`}
        >
          <span
            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
              day.enabled ? "right-1" : "left-1"
            }`}
          />
        </button>
      </div>
      {day.enabled ? (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
            From
            <input
              type="time"
              value={session.startTime}
              onChange={(e) =>
                onChange({
                  sessions: [
                    { ...session, startTime: e.target.value.slice(0, 5) },
                  ],
                })
              }
              className="mt-1 w-full rounded-lg border border-[var(--color-outline-variant)]/50 px-2 py-1 font-dm-sans text-label-md text-[var(--color-on-surface)]"
            />
          </label>
          <label className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
            To
            <input
              type="time"
              value={session.endTime}
              onChange={(e) =>
                onChange({
                  sessions: [
                    { ...session, endTime: e.target.value.slice(0, 5) },
                  ],
                })
              }
              className="mt-1 w-full rounded-lg border border-[var(--color-outline-variant)]/50 px-2 py-1 font-dm-sans text-label-md text-[var(--color-on-surface)]"
            />
          </label>
        </div>
      ) : (
        <p className="mt-1 font-dm-sans text-label-sm text-[var(--color-outline)]">
          Closed
        </p>
      )}
    </div>
  );
}
