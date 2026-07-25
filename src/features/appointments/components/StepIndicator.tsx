"use client";

import { MdCheck } from "react-icons/md";

import { BOOKING_STEPS } from "../constants";
import type { BookingStepId } from "../constants";

type StepIndicatorProps = {
  current: BookingStepId;
};

export function StepIndicator({ current }: StepIndicatorProps) {
  const currentIndex = BOOKING_STEPS.findIndex((s) => s.id === current);

  return (
    <nav
      className="mx-auto mb-[var(--spacing-hm-xxl)] max-w-3xl"
      aria-label="Booking progress"
    >
      <ol className="relative flex items-center justify-between">
        <li
          className="pointer-events-none absolute top-5 left-0 right-0 -z-10 h-0.5 -translate-y-1/2 bg-[var(--color-surface-variant)]"
          aria-hidden
        />
        {BOOKING_STEPS.map((step, index) => {
          const isActive = index === currentIndex;
          const isComplete = index < currentIndex;

          return (
            <li
              key={step.id}
              className="flex flex-col items-center gap-2 bg-[var(--color-background)] px-2"
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-full font-dm-sans text-label-md font-bold transition-colors duration-200 ${
                  isActive
                    ? "bg-[var(--color-primary)] text-white"
                    : isComplete
                      ? "bg-[var(--color-primary-container)] text-[var(--color-on-primary-container)]"
                      : "bg-[var(--color-surface-variant)] text-[var(--color-on-surface-variant)]"
                }`}
                aria-current={isActive ? "step" : undefined}
              >
                {isComplete ? <MdCheck size={20} aria-hidden /> : index + 1}
              </span>
              <span
                className={`font-dm-sans text-label-md ${
                  isActive || isComplete
                    ? "font-bold text-[var(--color-primary)]"
                    : "text-[var(--color-on-surface-variant)]"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
