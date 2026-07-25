"use client";

import {
  MdArrowBack,
  MdArrowForward,
  MdCalendarToday,
  MdInfo,
  MdPerson,
  MdSchedule,
} from "react-icons/md";

import { FieldError } from "@/features/auth/components/FieldError";

import type { DoctorListItem } from "../types/doctor";

type AppointmentDetailsFormProps = {
  doctor: DoctorListItem;
  date: string;
  startTime: string;
  endTime: string;
  reasonForVisit: string;
  additionalNotes: string;
  reasonError: string | null;
  submitError: string | null;
  submitting: boolean;
  submitLabel?: string;
  onReasonChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
};

function formatDisplayTime(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

function DoctorAvatar({ doctor }: { doctor: DoctorListItem }) {
  const initials =
    `${doctor.firstName[0] ?? ""}${doctor.lastName[0] ?? ""}`.toUpperCase();
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-primary-fixed)] bg-[var(--color-primary-container)]/15 font-dm-sans text-title-lg font-bold text-[var(--color-primary)]">
      {initials || <MdPerson size={24} />}
    </div>
  );
}

export function AppointmentDetailsForm({
  doctor,
  date,
  startTime,
  endTime,
  reasonForVisit,
  additionalNotes,
  reasonError,
  submitError,
  submitting,
  submitLabel = "Confirm Booking",
  onReasonChange,
  onNotesChange,
  onBack,
  onSubmit,
}: AppointmentDetailsFormProps) {
  const dateLabel = new Date(`${date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="grid grid-cols-1 gap-[var(--spacing-hm-xl)] lg:grid-cols-12">
      <div className="space-y-[var(--spacing-hm-xl)] lg:col-span-7">
        <div>
          <h2 className="font-dm-sans text-headline-lg text-[var(--color-primary)]">
            Appointment Details
          </h2>
          <p className="mt-2 font-literata text-body-md text-[var(--color-on-surface-variant)]">
            Please provide more information about your visit to help Dr.{" "}
            {doctor.lastName} prepare for your consultation.
          </p>
        </div>

        <div className="space-y-[var(--spacing-hm-lg)]">
          <div className="relative">
            <label
              htmlFor="reasonForVisit"
              className="mb-2 block font-dm-sans text-label-md text-[var(--color-on-surface)]"
            >
              Reason for visit{" "}
              <span className="text-[var(--color-error)]">*</span>
            </label>
            <textarea
              id="reasonForVisit"
              value={reasonForVisit}
              onChange={(e) => onReasonChange(e.target.value)}
              maxLength={200}
              rows={4}
              placeholder="Describe the reason for your visit"
              aria-invalid={reasonError ? "true" : "false"}
              aria-describedby={
                reasonError ? "reasonForVisit-error" : undefined
              }
              className={`w-full resize-none rounded-xl border bg-transparent p-[var(--spacing-hm-md)] font-literata text-body-md text-[var(--color-on-surface)] outline-none transition-all focus:ring-1 ${
                reasonError
                  ? "border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]"
                  : "border-[var(--color-outline-variant)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              }`}
            />
            <p className="mt-1 font-literata text-label-sm text-[var(--color-on-surface-variant)]">
              {reasonForVisit.length}/200
            </p>
            {reasonError && (
              <FieldError id="reasonForVisit-error">{reasonError}</FieldError>
            )}
          </div>

          <div className="relative">
            <label
              htmlFor="additionalNotes"
              className="mb-2 block font-dm-sans text-label-md text-[var(--color-on-surface)]"
            >
              Notes for doctor{" "}
              <span className="text-[var(--color-on-surface-variant)]">
                (optional)
              </span>
            </label>
            <textarea
              id="additionalNotes"
              value={additionalNotes}
              onChange={(e) => onNotesChange(e.target.value)}
              maxLength={500}
              rows={5}
              placeholder="Anything else the doctor should know"
              className="w-full resize-none rounded-xl border border-[var(--color-outline-variant)] bg-transparent p-[var(--spacing-hm-md)] font-literata text-body-md text-[var(--color-on-surface)] outline-none transition-all focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]"
            />
            <p className="mt-1 font-literata text-label-sm text-[var(--color-on-surface-variant)]">
              {additionalNotes.length}/500
            </p>
          </div>

          <div className="flex items-start gap-[var(--spacing-hm-md)] rounded-xl bg-[var(--color-surface-container-low)] p-[var(--spacing-hm-md)]">
            <MdInfo
              size={22}
              className="mt-0.5 shrink-0 text-[var(--color-primary)]"
              aria-hidden
            />
            <p className="font-literata text-label-md text-[var(--color-on-surface-variant)] italic">
              Your information is securely encrypted and HIPAA compliant. Only
              your assigned medical provider will have access to these notes.
            </p>
          </div>

          {submitError && (
            <p
              role="alert"
              className="font-literata text-body-md text-[var(--color-error)]"
            >
              {submitError}
            </p>
          )}

          <div className="flex flex-col gap-[var(--spacing-hm-md)] pt-[var(--spacing-hm-lg)] sm:flex-row">
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--color-primary)] py-[var(--spacing-hm-lg)] font-dm-sans text-label-md text-white shadow-md transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-60"
            >
              {submitting ? "Confirming…" : submitLabel}
              {!submitting && <MdArrowForward size={18} aria-hidden />}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center justify-center gap-2 rounded-xl px-[var(--spacing-hm-xl)] py-[var(--spacing-hm-lg)] font-dm-sans text-label-md text-[var(--color-primary)] transition-all hover:bg-[var(--color-surface-container-high)]"
            >
              <MdArrowBack size={18} aria-hidden />
              Back
            </button>
          </div>
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
            <div className="flex items-center gap-[var(--spacing-hm-md)]">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-secondary-container)] text-[var(--color-on-secondary-container)]">
                <MdSchedule size={20} aria-hidden />
              </div>
              <div>
                <p className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                  Time
                </p>
                <p className="font-literata text-body-md font-bold text-[var(--color-on-surface)]">
                  {formatDisplayTime(startTime)} — {formatDisplayTime(endTime)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
