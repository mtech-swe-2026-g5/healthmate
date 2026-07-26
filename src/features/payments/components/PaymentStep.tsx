"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  MdArrowBack,
  MdCalendarToday,
  MdCheck,
  MdContentCopy,
  MdInfoOutline,
  MdLock,
  MdPayment,
  MdPerson,
  MdSchedule,
} from "react-icons/md";

import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import {
  formatClinicCalendarDate,
  formatSlotLabel,
} from "@/features/appointments/lib/date-utils";
import type { DoctorListItem } from "@/features/appointments/types/doctor";

type PaymentStepProps = {
  doctor: DoctorListItem;
  date: string;
  startTime: string;
  endTime: string;
  feeInr: number;
  paying: boolean;
  error: string | null;
  onBack: () => void;
  onPay: () => void;
};

const TEST_CARDS = [
  {
    network: "Visa",
    number: "4100 2800 0000 1007",
    type: "Debit",
    subType: "Consumer",
  },
  {
    network: "Mastercard",
    number: "5555 5100 0008 1006",
    type: "Credit",
    subType: "Business",
  },
] as const;

function DoctorAvatar({ doctor }: { doctor: DoctorListItem }) {
  const initials =
    `${doctor.firstName[0] ?? ""}${doctor.lastName[0] ?? ""}`.toUpperCase();
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-primary-fixed)] bg-[var(--color-primary-container)]/15 font-dm-sans text-title-lg font-bold text-[var(--color-primary)]">
      {initials || <MdPerson size={24} />}
    </div>
  );
}

const COPIED_RESET_MS = 2000;

export function PaymentStep({
  doctor,
  date,
  startTime,
  endTime,
  feeInr,
  paying,
  error,
  onBack,
  onPay,
}: PaymentStepProps) {
  const dateLabel = formatClinicCalendarDate(date);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const copiedResetRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copiedResetRef.current !== null) {
        window.clearTimeout(copiedResetRef.current);
      }
    };
  }, []);

  const copyCardNumber = useCallback(async (number: string) => {
    try {
      await navigator.clipboard.writeText(number.replace(/\s/g, ""));
      setCopiedNumber(number);
      if (copiedResetRef.current !== null) {
        window.clearTimeout(copiedResetRef.current);
      }
      copiedResetRef.current = window.setTimeout(() => {
        setCopiedNumber(null);
        copiedResetRef.current = null;
      }, COPIED_RESET_MS);
    } catch {
      // Clipboard may be unavailable; ignore — number remains visible.
    }
  }, []);

  return (
    <div className="grid grid-cols-1 gap-[var(--spacing-hm-xl)] lg:grid-cols-12">
      <div className="space-y-[var(--spacing-hm-xl)] lg:col-span-7">
        <div>
          <h2
            id="payment-step-heading"
            className="font-dm-sans text-headline-lg text-[var(--color-primary)]"
          >
            Payment
          </h2>
          <p className="mt-2 font-literata text-body-md text-[var(--color-on-surface-variant)]">
            Pay the consultation fee to confirm your appointment with Dr.{" "}
            {doctor.lastName}.
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)] px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-xl)]">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-dm-sans text-label-md tracking-wide text-[var(--color-on-surface-variant)] uppercase">
                Consultation fee
              </p>
              <p className="mt-1 font-dm-sans text-display-lg text-[var(--color-on-surface)]">
                ₹{feeInr}
              </p>
            </div>
            <p className="flex items-center gap-2 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
              <MdLock
                size={16}
                className="text-[var(--color-primary)]"
                aria-hidden
              />
              Secured by Razorpay
            </p>
          </div>
        </div>

        <div className="space-y-[var(--spacing-hm-md)]">
          <div className="flex items-start gap-3">
            <MdInfoOutline
              size={22}
              className="mt-0.5 shrink-0 text-[var(--color-primary)]"
              aria-hidden
            />
            <div>
              <h3 className="font-dm-sans text-title-lg text-[var(--color-on-surface)]">
                Test cards
              </h3>
              <p className="mt-1 font-literata text-body-md text-[var(--color-on-surface-variant)]">
                Use any of these Razorpay test cards in Checkout. Enter a random
                CVV and any future expiry date.
              </p>
            </div>
          </div>

          <ul className="divide-y divide-[var(--color-outline-variant)]/25 overflow-hidden rounded-xl border border-[var(--color-outline-variant)]/30">
            {TEST_CARDS.map((card) => {
              const copied = copiedNumber === card.number;
              return (
                <li
                  key={card.number}
                  className="flex flex-wrap items-center justify-between gap-3 bg-[var(--color-surface-container-lowest)] px-[var(--spacing-hm-md)] py-3 sm:px-[var(--spacing-hm-lg)]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
                        {card.network}
                      </span>
                      <span className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                        {card.type} · {card.subType}
                      </span>
                    </div>
                    <p className="font-dm-sans text-body-md tracking-wider text-[var(--color-on-surface)] tabular-nums">
                      {card.number}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void copyCardNumber(card.number);
                    }}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 font-dm-sans text-label-sm text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/5"
                    aria-label={
                      copied
                        ? `${card.network} card number copied`
                        : `Copy ${card.network} card number`
                    }
                  >
                    {copied ? (
                      <MdCheck size={16} aria-hidden />
                    ) : (
                      <MdContentCopy size={16} aria-hidden />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {error && (
          <p
            role="alert"
            className="font-literata text-body-md text-[var(--color-error)]"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col gap-[var(--spacing-hm-md)] pt-[var(--spacing-hm-md)] sm:flex-row">
          <button
            type="button"
            onClick={onPay}
            disabled={paying}
            aria-busy={paying || undefined}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-[var(--spacing-hm-lg)] font-dm-sans text-label-md text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
          >
            {paying ? (
              <LoadingSpinner size={18} onDark label="Processing payment" />
            ) : (
              <MdPayment size={20} aria-hidden />
            )}
            {paying ? "Processing…" : `Pay ₹${feeInr}`}
          </button>
          <button
            type="button"
            onClick={onBack}
            disabled={paying}
            className="inline-flex items-center justify-center gap-2 rounded-xl px-[var(--spacing-hm-xl)] py-[var(--spacing-hm-lg)] font-dm-sans text-label-md text-[var(--color-primary)] transition-all hover:bg-[var(--color-surface-container-high)] disabled:opacity-50"
          >
            <MdArrowBack size={18} aria-hidden />
            Back
          </button>
        </div>
      </div>

      <aside className="lg:col-span-5">
        <div className="sticky top-24 rounded-2xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface)] p-[var(--spacing-hm-lg)] shadow-[0px_4px_20px_rgba(26,107,114,0.08)]">
          <h3 className="mb-[var(--spacing-hm-lg)] font-dm-sans text-title-lg text-[var(--color-on-surface)]">
            Booking Summary
          </h3>

          <div className="mb-[var(--spacing-hm-lg)] flex items-center gap-[var(--spacing-hm-md)] rounded-xl bg-[var(--color-surface-container-low)] p-[var(--spacing-hm-md)]">
            <DoctorAvatar doctor={doctor} />
            <div>
              <p className="font-dm-sans text-title-lg text-[var(--color-primary)]">
                Dr. {doctor.firstName} {doctor.lastName}
              </p>
              <p className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                {doctor.specialization}
              </p>
            </div>
          </div>

          <div className="space-y-[var(--spacing-hm-md)]">
            <div className="flex items-center gap-[var(--spacing-hm-md)] border-b border-[var(--color-outline-variant)]/20 pb-[var(--spacing-hm-md)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]">
                <MdCalendarToday size={20} aria-hidden />
              </div>
              <div>
                <p className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                  Date
                </p>
                <p className="font-literata text-body-md font-bold text-[var(--color-on-surface)]">
                  {dateLabel}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-[var(--spacing-hm-md)] border-b border-[var(--color-outline-variant)]/20 pb-[var(--spacing-hm-md)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]">
                <MdSchedule size={20} aria-hidden />
              </div>
              <div>
                <p className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                  Time
                </p>
                <p className="font-literata text-body-md font-bold text-[var(--color-on-surface)]">
                  {formatSlotLabel(startTime)} — {formatSlotLabel(endTime)}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-1">
              <p className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                Amount due
              </p>
              <p className="font-dm-sans text-title-lg font-bold text-[var(--color-primary)]">
                ₹{feeInr}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
