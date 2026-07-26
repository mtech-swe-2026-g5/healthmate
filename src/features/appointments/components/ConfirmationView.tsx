"use client";

import Link from "next/link";
import {
  MdArrowForward,
  MdCheck,
  MdDescription,
  MdPerson,
} from "react-icons/md";

import type { AppointmentConfirmation } from "../services/client";
import { formatAppointmentDateTime } from "../lib/date-utils";

type ConfirmationViewProps = {
  appointment: AppointmentConfirmation;
  patientEmail?: string | null;
};

export function ConfirmationView({
  appointment,
  patientEmail,
}: ConfirmationViewProps) {
  const dateTimeLabel = formatAppointmentDateTime(appointment.startsAt);

  const initials =
    `${appointment.doctor.firstName[0] ?? ""}${appointment.doctor.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="mx-auto flex w-full max-w-[640px] flex-col items-center">
      <div className="w-full animate-[scaleUp_0.6s_cubic-bezier(0.34,1.56,0.64,1)_forwards] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-[var(--spacing-hm-lg)] text-center shadow-sm md:p-[var(--spacing-hm-xl)]">
        <div className="mb-[var(--spacing-hm-lg)] flex justify-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[var(--color-primary-container)]/10">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)] text-white">
              <MdCheck size={40} aria-hidden />
            </span>
          </div>
        </div>

        <h2 className="mb-2 font-dm-sans text-headline-lg text-[var(--color-on-surface)]">
          Booking Confirmed!
        </h2>
        <p className="mb-[var(--spacing-hm-xl)] font-literata text-body-md text-[var(--color-on-surface-variant)]">
          Your appointment has been successfully scheduled
          {patientEmail ? (
            <>
              . We&apos;ve sent a confirmation to{" "}
              <span className="font-bold text-[var(--color-on-surface)]">
                {patientEmail}
              </span>
            </>
          ) : (
            "."
          )}
        </p>

        <div className="relative mb-[var(--spacing-hm-xl)] overflow-hidden rounded-lg border border-[var(--color-outline-variant)]/50 bg-[var(--color-surface-container-low)] p-[var(--spacing-hm-lg)] text-left">
          <div className="mb-[var(--spacing-hm-md)] flex items-start justify-between gap-3">
            <div>
              <span className="font-dm-sans text-label-sm tracking-wider text-[var(--color-on-surface-variant)] uppercase">
                Reference Number
              </span>
              <p className="font-dm-sans text-title-lg font-bold text-[var(--color-primary)]">
                {appointment.bookingReference}
              </p>
            </div>
            <span className="rounded bg-[var(--color-primary)]/10 px-2 py-1 font-dm-sans text-label-sm font-bold text-[var(--color-primary)]">
              {appointment.timing === "upcoming" ? "UPCOMING" : "PAST"}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-[var(--spacing-hm-lg)] border-t border-[var(--color-outline-variant)]/30 pt-[var(--spacing-hm-md)] md:grid-cols-2">
            <div className="flex gap-[var(--spacing-hm-md)]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--color-primary-container)]/15 font-dm-sans text-label-md font-bold text-[var(--color-primary)]">
                {initials || <MdPerson size={20} />}
              </div>
              <div>
                <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                  Provider
                </p>
                <p className="font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
                  Dr. {appointment.doctor.firstName}{" "}
                  {appointment.doctor.lastName},{" "}
                  {appointment.doctor.specialization}
                </p>
              </div>
            </div>
            <div>
              <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                Date &amp; Time
              </p>
              <p className="font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
                {dateTimeLabel}
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-[var(--color-outline-variant)]/30 pt-[var(--spacing-hm-lg)]">
          <Link
            href="/appointments"
            className="inline-flex items-center gap-1 font-dm-sans text-label-md font-bold text-[var(--color-primary)] hover:underline"
          >
            View My Appointments
            <MdArrowForward size={16} aria-hidden />
          </Link>
          <p className="mt-2 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
            You can review this booking anytime from your appointments list.
          </p>
          <Link
            href={`/appointments/${appointment.id}`}
            className="mt-4 inline-flex items-center gap-1.5 font-dm-sans text-label-md text-[var(--color-on-surface-variant)] underline hover:text-[var(--color-primary)]"
          >
            <MdDescription size={16} aria-hidden />
            View booking details
          </Link>
        </div>
      </div>
    </div>
  );
}
