import Link from 'next/link';
import {
  MdArrowBack,
  MdCalendarMonth,
  MdCheckCircle,
  MdDescription,
  MdEvent,
  MdEventAvailable,
  MdEventNote,
  MdPerson,
  MdSchedule,
  MdTimer,
} from 'react-icons/md';

import type { AppointmentConfirmation } from '../services/client';

type AppointmentDetailViewProps = {
  appointment: AppointmentConfirmation;
};

function formatDisplayTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function durationMinutes(startsAt: string, endsAt: string): number {
  return Math.round(
    (new Date(endsAt).getTime() - new Date(startsAt).getTime()) / 60_000,
  );
}

export function AppointmentDetailView({
  appointment,
}: AppointmentDetailViewProps) {
  const doctor = appointment.doctor;
  const initials =
    `${doctor.firstName[0] ?? ''}${doctor.lastName[0] ?? ''}`.toUpperCase();
  const minutes = durationMinutes(appointment.startsAt, appointment.endsAt);
  const isUpcoming = appointment.timing === 'upcoming';

  return (
    <div className="flex flex-col gap-[var(--spacing-hm-lg)] pb-8">
      <nav aria-label="Breadcrumb">
        <Link
          href="/appointments"
          className="inline-flex items-center gap-1 font-dm-sans text-label-md text-[var(--color-on-surface-variant)] transition-colors hover:text-[var(--color-primary)]"
        >
          <MdArrowBack size={20} aria-hidden />
          Back to Appointments
        </Link>
      </nav>

      <div className="flex flex-col items-start justify-between gap-[var(--spacing-hm-md)] rounded-xl border border-[var(--color-outline-variant)]/20 bg-white p-[var(--spacing-hm-lg)] shadow-sm md:flex-row md:items-center">
        <div className="flex items-center gap-[var(--spacing-hm-lg)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary-container)]/10 font-dm-sans text-headline-md font-bold text-[var(--color-primary)]">
            {initials || <MdPerson size={28} />}
          </div>
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-[var(--spacing-hm-md)]">
              <h1 className="font-dm-sans text-headline-md text-[var(--color-on-surface)]">
                Dr. {doctor.firstName} {doctor.lastName}
              </h1>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-dm-sans text-label-sm ${
                  isUpcoming
                    ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'bg-[var(--color-success-container)] text-[var(--color-success)]'
                }`}
              >
                <MdCheckCircle size={14} aria-hidden />
                {isUpcoming ? 'Confirmed' : 'Completed'}
              </span>
            </div>
            <p className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
              {doctor.specialization} · Booking Ref:{' '}
              <span className="font-bold text-[var(--color-on-surface)]">
                {appointment.bookingReference}
              </span>
            </p>
          </div>
        </div>
        <Link
          href="/appointments/book"
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 font-dm-sans text-label-md font-bold text-white transition-all hover:opacity-90 active:scale-95"
        >
          <MdEventAvailable size={18} aria-hidden />
          Book another
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="flex flex-col gap-6 md:col-span-7">
          <section className="rounded-xl border border-[var(--color-outline-variant)]/30 bg-white p-[var(--spacing-hm-lg)] shadow-sm">
            <h2 className="mb-[var(--spacing-hm-lg)] font-dm-sans text-title-lg text-[var(--color-on-surface)]">
              Appointment Details
            </h2>
            <div className="grid grid-cols-1 gap-[var(--spacing-hm-md)] sm:grid-cols-3">
              <div className="rounded-lg border border-[var(--color-outline-variant)]/10 bg-[var(--color-surface-container-low)] p-[var(--spacing-hm-md)]">
                <p className="mb-1 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                  Date
                </p>
                <div className="flex items-center gap-1 text-[var(--color-on-surface)]">
                  <MdCalendarMonth
                    className="text-[var(--color-primary)]"
                    size={20}
                    aria-hidden
                  />
                  <span className="font-dm-sans text-label-md font-bold">
                    {formatDate(appointment.startsAt)}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-[var(--color-outline-variant)]/10 bg-[var(--color-surface-container-low)] p-[var(--spacing-hm-md)]">
                <p className="mb-1 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                  Time
                </p>
                <div className="flex items-center gap-1 text-[var(--color-on-surface)]">
                  <MdSchedule
                    className="text-[var(--color-primary)]"
                    size={20}
                    aria-hidden
                  />
                  <span className="font-dm-sans text-label-md font-bold">
                    {formatDisplayTime(appointment.startsAt)}
                  </span>
                </div>
              </div>
              <div className="rounded-lg border border-[var(--color-outline-variant)]/10 bg-[var(--color-surface-container-low)] p-[var(--spacing-hm-md)]">
                <p className="mb-1 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                  Duration
                </p>
                <div className="flex items-center gap-1 text-[var(--color-on-surface)]">
                  <MdTimer
                    className="text-[var(--color-primary)]"
                    size={20}
                    aria-hidden
                  />
                  <span className="font-dm-sans text-label-md font-bold">
                    {minutes} mins
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-[var(--spacing-hm-lg)] border-t border-[var(--color-outline-variant)]/20 pt-[var(--spacing-hm-lg)]">
              <p className="mb-2 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                Consultation Type
              </p>
              <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-secondary-container)] bg-[var(--color-secondary-container)]/50 px-3 py-2">
                <MdPerson
                  className="text-[var(--color-secondary)]"
                  size={20}
                  aria-hidden
                />
                <span className="font-dm-sans text-label-md font-bold text-[var(--color-on-secondary-fixed-variant)]">
                  In-person
                </span>
              </div>
            </div>
          </section>

          <section className="flex-1 rounded-xl border border-[var(--color-outline-variant)]/30 bg-white p-[var(--spacing-hm-lg)] shadow-sm">
            <div className="mb-[var(--spacing-hm-lg)]">
              <h3 className="mb-2 flex items-center gap-2 font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
                <MdEventNote
                  className="text-[var(--color-primary)]"
                  size={20}
                  aria-hidden
                />
                Reason for Visit
              </h3>
              <p className="rounded-lg bg-[var(--color-surface-container-low)]/50 p-[var(--spacing-hm-md)] font-literata text-body-md leading-relaxed text-[var(--color-on-surface-variant)]">
                {appointment.reasonForVisit}
              </p>
            </div>
            <div>
              <h3 className="mb-2 flex items-center gap-2 font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
                <MdDescription
                  className="text-[var(--color-primary)]"
                  size={20}
                  aria-hidden
                />
                Notes for Doctor
              </h3>
              <p className="font-literata text-body-md leading-relaxed text-[var(--color-on-surface-variant)]">
                {appointment.additionalNotes?.trim()
                  ? `“${appointment.additionalNotes.trim()}”`
                  : 'No additional notes provided.'}
              </p>
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-6 md:col-span-5">
          <section className="overflow-hidden rounded-xl border border-[var(--color-outline-variant)]/30 bg-white shadow-sm">
            <div className="flex items-center gap-[var(--spacing-hm-md)] bg-[var(--color-surface-container-high)] p-[var(--spacing-hm-lg)]">
              <MdPerson
                className="text-[var(--color-on-surface-variant)]"
                size={24}
                aria-hidden
              />
              <h2 className="font-dm-sans text-title-lg text-[var(--color-on-surface)]">
                Doctor Profile
              </h2>
            </div>
            <div className="flex flex-col gap-[var(--spacing-hm-lg)] p-[var(--spacing-hm-lg)]">
              <div className="flex items-center gap-[var(--spacing-hm-md)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary-container)]/15 font-dm-sans text-title-lg font-bold text-[var(--color-primary)]">
                  {initials || <MdPerson size={24} />}
                </div>
                <div>
                  <p className="font-dm-sans text-title-lg font-bold text-[var(--color-on-surface)]">
                    Dr. {doctor.firstName} {doctor.lastName}
                  </p>
                  <p className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                    {doctor.specialization}
                  </p>
                </div>
              </div>
              <div className="border-t border-[var(--color-outline-variant)]/20 pt-[var(--spacing-hm-lg)]">
                <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                  Clinic hours
                </p>
                <p className="font-dm-sans text-label-md text-[var(--color-on-surface)]">
                  Mon–Sat · 11:00 AM – 7:00 PM
                </p>
              </div>
              <div className="border-t border-[var(--color-outline-variant)]/20 pt-[var(--spacing-hm-lg)]">
                <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                  Status
                </p>
                <p className="font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
                  {appointment.status}
                </p>
              </div>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-xl bg-[var(--color-primary-container)] p-[var(--spacing-hm-lg)] text-[var(--color-on-primary-container)]">
            <div className="relative z-10">
              <h3 className="mb-2 font-dm-sans text-title-lg">Need to prepare?</h3>
              <p className="mb-[var(--spacing-hm-lg)] font-literata text-body-md opacity-90">
                Arrive a few minutes early and bring any recent reports related to
                your reason for visit.
              </p>
              <p className="font-dm-sans text-label-md">
                Slot ends at {formatDisplayTime(appointment.endsAt)}
              </p>
            </div>
          </section>
        </aside>
      </div>

      <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-[var(--spacing-hm-md)] rounded-xl border border-[var(--color-outline-variant)] bg-white p-[var(--spacing-hm-lg)] shadow-lg">
        <div className="flex flex-wrap items-center gap-[var(--spacing-hm-md)]">
          <Link
            href="/appointments/book"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-md font-bold text-white transition-all hover:opacity-90 active:scale-95"
          >
            <MdEventAvailable size={18} aria-hidden />
            Book another visit
          </Link>
          <Link
            href="/appointments"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-secondary-container)] px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-md font-bold text-[var(--color-on-secondary-container)] transition-all hover:opacity-80 active:scale-95"
          >
            <MdEvent size={18} aria-hidden />
            All appointments
          </Link>
        </div>
      </div>
    </div>
  );
}
