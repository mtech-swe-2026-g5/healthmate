"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdCancel, MdEditCalendar } from "react-icons/md";

import Model from "@/components/ui/Model";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

import { useCancelAppointment } from "../hooks/use-cancel-appointment";
import {
  formatAppointmentDate,
  formatAppointmentTime,
} from "../lib/date-utils";
import type { AppointmentConfirmation } from "../services/client";

type AppointmentActionsProps = {
  appointment: AppointmentConfirmation;
};

/**
 * Reschedule + cancel controls for an upcoming appointment.
 * Rendered only when the server says the change window is still open, so the
 * cut-off rule is never duplicated on the client.
 */
export function AppointmentActions({ appointment }: AppointmentActionsProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isRefreshing, startRefresh] = useTransition();
  const { cancel, submitting, error } = useCancelAppointment(appointment.id);

  // The request and the router refresh that follows it are one operation as far
  // as the patient is concerned — keep the controls busy across both.
  const busy = submitting || isRefreshing;

  const handleConfirmCancel = async () => {
    const cancelled = await cancel();
    if (cancelled) startRefresh(() => router.refresh());
  };

  const dateLabel = formatAppointmentDate(appointment.startsAt);
  const timeLabel = formatAppointmentTime(appointment.startsAt);

  return (
    <div className="flex flex-wrap items-center gap-[var(--spacing-hm-md)]">
      <Link
        href={`/appointments/${appointment.id}/reschedule`}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-secondary-container)] px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-md font-bold text-[var(--color-on-secondary-container)] transition-all hover:opacity-80 active:scale-95"
      >
        <MdEditCalendar size={18} aria-hidden />
        Reschedule
      </Link>

      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={busy}
        aria-busy={busy || undefined}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-error)] px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-md font-bold text-[var(--color-error)] transition-all hover:bg-[var(--color-error-container)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy ? (
          <LoadingSpinner size={18} label="Cancelling appointment" />
        ) : (
          <MdCancel size={18} aria-hidden />
        )}
        {busy ? "Cancelling…" : "Cancel appointment"}
      </button>

      {error && (
        <p
          role="alert"
          className="w-full font-literata text-body-md text-[var(--color-error)]"
        >
          {error}
        </p>
      )}

      <Model
        title="Cancel this appointment?"
        isOpen={confirmOpen}
        busy={busy}
        confirmLabel="Yes, cancel it"
        busyLabel="Cancelling…"
        cancelLabel="Keep appointment"
        confirmVariant="danger"
        onClose={() => setConfirmOpen(false)}
        onCancel={async () => setConfirmOpen(false)}
        onConfirm={handleConfirmCancel}
        content={
          <span>
            Your {dateLabel} appointment at {timeLabel} with Dr.{" "}
            {appointment.doctor.firstName} {appointment.doctor.lastName} will be
            cancelled and the slot released to other patients. We will email you
            and the doctor a confirmation. This cannot be undone — you would
            need to book again.
          </span>
        }
      />
    </div>
  );
}
