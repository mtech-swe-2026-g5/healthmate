"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdArrowBack, MdEventRepeat, MdInfoOutline } from "react-icons/md";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

import { useRescheduleAppointment } from "../hooks/use-reschedule-appointment";
import { useSlots } from "../hooks/use-slots";
import {
  formatAppointmentWeekdayDate,
  formatAppointmentTime,
  formatClinicCalendarDate,
  formatSlotLabel,
} from "../lib/date-utils";
import type { AppointmentConfirmation } from "../services/client";
import { SlotCalendar } from "./SlotCalendar";
import { SlotGrid } from "./SlotGrid";

type RescheduleViewProps = {
  appointment: AppointmentConfirmation;
};

/**
 * Slot picker for moving an existing appointment.
 * Reuses the booking wizard's calendar and slot grid, so availability follows
 * the same working-hours and conflict rules as a first-time booking.
 */
export function RescheduleView({ appointment }: RescheduleViewProps) {
  const router = useRouter();
  const { date, startTime, submitting, error, selectDate, selectSlot, submit } =
    useRescheduleAppointment(appointment.id);
  const {
    slots,
    loading: slotsLoading,
    error: slotsError,
  } = useSlots(appointment.doctor.id, date);

  const currentLabel = `${formatAppointmentWeekdayDate(appointment.startsAt)} at ${formatAppointmentTime(appointment.startsAt)}`;
  const detailHref = `/appointments/${appointment.id}`;

  const handleConfirm = async () => {
    const updated = await submit();
    if (updated) router.push(detailHref);
  };

  return (
    <div className="flex flex-col gap-[var(--spacing-hm-lg)] pb-8">
      <nav aria-label="Breadcrumb">
        <Link
          href={detailHref}
          className="inline-flex items-center gap-1 font-dm-sans text-label-md text-[var(--color-on-surface-variant)] transition-colors hover:text-[var(--color-primary)]"
        >
          <MdArrowBack size={20} aria-hidden />
          Back to appointment
        </Link>
      </nav>

      <header>
        <h1 className="font-dm-sans text-headline-lg tracking-tight text-[var(--color-on-surface)]">
          Reschedule appointment
        </h1>
        <p className="mt-1 font-literata text-body-md text-[var(--color-on-surface-variant)]">
          Pick a new slot with Dr. {appointment.doctor.firstName}{" "}
          {appointment.doctor.lastName}. Your booking reference{" "}
          {appointment.bookingReference} stays the same.
        </p>
      </header>

      <div className="flex items-start gap-[var(--spacing-hm-md)] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] p-[var(--spacing-hm-lg)]">
        <MdInfoOutline
          className="mt-0.5 shrink-0 text-[var(--color-primary)]"
          size={20}
          aria-hidden
        />
        <div>
          <p className="font-dm-sans text-label-sm tracking-wider text-[var(--color-on-surface-variant)] uppercase">
            Currently scheduled
          </p>
          <p className="font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
            {currentLabel}
          </p>
          <p className="mt-1 font-literata text-body-md text-[var(--color-on-surface-variant)]">
            This slot is released as soon as you confirm the new time.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] p-[var(--spacing-hm-lg)] shadow-sm">
        <SlotCalendar selectedDate={date} onSelectDate={selectDate} />
        <SlotGrid
          slots={slots}
          selectedStartTime={startTime}
          onSelect={(nextStartTime) => selectSlot(nextStartTime)}
          loading={slotsLoading}
          error={slotsError}
          selectedDateLabel={date ? formatClinicCalendarDate(date) : null}
        />
      </section>

      {error && (
        <p
          role="alert"
          className="font-literata text-body-md text-[var(--color-error)]"
        >
          {error}
        </p>
      )}

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-[var(--spacing-hm-md)] rounded-xl border border-[var(--color-outline-variant)] bg-white p-[var(--spacing-hm-lg)] shadow-lg">
        <p className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
          {date && startTime ? (
            <>
              New time:{" "}
              <span className="font-bold text-[var(--color-on-surface)]">
                {formatClinicCalendarDate(date)} at {formatSlotLabel(startTime)}
              </span>
            </>
          ) : (
            "Select a date and an available time to continue."
          )}
        </p>
        <div className="flex flex-wrap items-center gap-[var(--spacing-hm-md)]">
          <Link
            href={detailHref}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-surface-container-high)] px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-md font-bold text-[var(--color-on-surface)] transition-all hover:opacity-80 active:scale-95"
          >
            Keep current time
          </Link>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!date || !startTime || submitting}
            aria-busy={submitting || undefined}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-md font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? (
              <LoadingSpinner size={18} onDark label="Rescheduling" />
            ) : (
              <MdEventRepeat size={18} aria-hidden />
            )}
            {submitting ? "Rescheduling…" : "Confirm new time"}
          </button>
        </div>
      </div>
    </div>
  );
}
