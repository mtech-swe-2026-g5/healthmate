"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MdArrowForward,
  MdEventAvailable,
  MdHistory,
  MdInfo,
  MdLocationOn,
  MdMail,
  MdMedicalServices,
  MdPendingActions,
  MdSchedule,
  MdSms,
  MdWavingHand,
} from "react-icons/md";

import { Toast } from "@/components/ui/Toast";
import type { AppointmentConfirmation } from "@/features/appointments/services/client";
import {
  formatAppointmentDate,
  formatAppointmentTime,
  formatAppointmentWeekdayDate,
} from "@/features/appointments/lib/date-utils";

import {
  daysUntil,
  formatCountdownLabel,
  greetingForHour,
} from "../lib/greeting";

export type PatientDashboardViewProps = {
  firstName: string;
  upcoming: AppointmentConfirmation[];
  pastCount: number;
};

const CARD =
  "rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] shadow-[0px_4px_20px_rgba(26,107,114,0.08)]";

function doctorName(appointment: AppointmentConfirmation): string {
  return `Dr. ${appointment.doctor.lastName}`;
}

export function PatientDashboardView({
  firstName,
  upcoming,
  pastCount,
}: PatientDashboardViewProps) {
  const next = upcoming[0] ?? null;
  const greeting = greetingForHour(new Date().getHours());
  const todayLabel = new Date().toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const [emailOn, setEmailOn] = useState(true);
  const [smsOn, setSmsOn] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  const showReminderToast = () => {
    setToast("Reminder settings updated successfully.");
  };

  const countdownDays = next ? daysUntil(new Date(next.startsAt)) : null;

  return (
    <>
      {toast && (
        <Toast
          message={toast}
          variant="success"
          onClose={() => setToast(null)}
        />
      )}

      <header className="mb-[var(--spacing-hm-xl)] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MdWavingHand
            size={28}
            className="text-[var(--color-primary)]"
            aria-hidden
          />
          <h1 className="font-dm-sans text-headline-md text-[var(--color-on-surface)] md:text-headline-lg">
            {greeting}, {firstName}
          </h1>
        </div>
        <p className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
          {todayLabel}
        </p>
      </header>

      <div className="space-y-[var(--spacing-hm-xl)]">
        <section className="grid grid-cols-1 gap-[var(--spacing-hm-lg)] md:grid-cols-3">
          <div
            className={`${CARD} p-[var(--spacing-hm-lg)] transition-transform hover:scale-[1.01]`}
          >
            <div className="mb-[var(--spacing-hm-md)] flex items-start justify-between">
              <div className="rounded-lg bg-[var(--color-primary)]/10 p-2">
                <MdEventAvailable
                  size={22}
                  className="text-[var(--color-primary)]"
                  aria-hidden
                />
              </div>
              <span className="font-dm-sans text-headline-md font-bold text-[var(--color-primary)]">
                {upcoming.length}
              </span>
            </div>
            <p className="font-dm-sans text-label-md tracking-wider text-[var(--color-on-surface-variant)] uppercase">
              Upcoming
            </p>
            <p className="font-dm-sans text-title-lg text-[var(--color-on-surface)]">
              {next ? `Next: ${doctorName(next)}` : "No visits scheduled"}
            </p>
          </div>

          <div
            className={`${CARD} p-[var(--spacing-hm-lg)] transition-transform hover:scale-[1.01]`}
          >
            <div className="mb-[var(--spacing-hm-md)] flex items-start justify-between">
              <div className="rounded-lg bg-[var(--color-secondary)]/10 p-2">
                <MdHistory
                  size={22}
                  className="text-[var(--color-secondary)]"
                  aria-hidden
                />
              </div>
              <span className="font-dm-sans text-headline-md font-bold text-[var(--color-secondary)]">
                {pastCount}
              </span>
            </div>
            <p className="font-dm-sans text-label-md tracking-wider text-[var(--color-on-surface-variant)] uppercase">
              Past Visits
            </p>
            <p className="font-dm-sans text-title-lg text-[var(--color-on-surface)]">
              Completed Care
            </p>
          </div>

          <div
            className={`${CARD} p-[var(--spacing-hm-lg)] transition-transform hover:scale-[1.01]`}
          >
            <div className="mb-[var(--spacing-hm-md)] flex items-start justify-between">
              <div className="rounded-lg bg-[var(--color-tertiary)]/10 p-2">
                <MdPendingActions
                  size={22}
                  className="text-[var(--color-tertiary)]"
                  aria-hidden
                />
              </div>
              <span className="font-dm-sans text-headline-md font-bold text-[var(--color-tertiary)]">
                0
              </span>
            </div>
            <p className="font-dm-sans text-label-md tracking-wider text-[var(--color-on-surface-variant)] uppercase">
              Pending
            </p>
            <p className="font-dm-sans text-title-lg text-[var(--color-on-surface)]">
              All Confirmed
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 items-start gap-[var(--spacing-hm-lg)] lg:grid-cols-3">
          <section className={`${CARD} overflow-hidden lg:col-span-2`}>
            <div className="flex items-center justify-between border-b border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-bright)] p-[var(--spacing-hm-lg)]">
              <h2 className="font-dm-sans text-headline-md text-[var(--color-on-surface)]">
                Upcoming Appointments
              </h2>
              <Link
                href="/appointments"
                className="inline-flex items-center gap-1 font-dm-sans text-label-md text-[var(--color-primary)] hover:underline"
              >
                View All
                <MdArrowForward size={16} aria-hidden />
              </Link>
            </div>

            {upcoming.length === 0 ? (
              <div className="space-y-4 p-[var(--spacing-hm-lg)]">
                <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
                  You have no upcoming appointments. Book a visit when you are
                  ready.
                </p>
                <Link
                  href="/appointments/book"
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-3 font-dm-sans text-label-md text-white transition-opacity hover:opacity-90"
                >
                  <MdEventAvailable size={18} aria-hidden />
                  Book appointment
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[var(--color-surface-container-low)]">
                      <th className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                        Doctor
                      </th>
                      <th className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                        Date &amp; Time
                      </th>
                      <th className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                        Mode
                      </th>
                      <th className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                        Status
                      </th>
                      <th className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-outline-variant)]/20">
                    {upcoming.slice(0, 5).map((appointment) => (
                      <tr
                        key={appointment.id}
                        className="transition-colors hover:bg-[var(--color-surface-container-low)]"
                      >
                        <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-lg)]">
                          <div className="flex items-center gap-[var(--spacing-hm-md)]">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
                              <MdMedicalServices
                                size={20}
                                className="text-[var(--color-primary)]"
                                aria-hidden
                              />
                            </div>
                            <div>
                              <p className="font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
                                {doctorName(appointment)}
                              </p>
                              <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                                {appointment.doctor.specialization}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-lg)]">
                          <p className="font-dm-sans text-label-md text-[var(--color-on-surface)]">
                            {formatAppointmentDate(appointment.startsAt)}
                          </p>
                          <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                            {formatAppointmentTime(appointment.startsAt)}
                          </p>
                        </td>
                        <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-lg)]">
                          <span className="flex items-center gap-1 font-dm-sans text-label-md text-[var(--color-on-surface)]">
                            <MdLocationOn size={18} aria-hidden />
                            In-person
                          </span>
                        </td>
                        <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-lg)]">
                          <span className="inline-block rounded-full bg-[var(--color-primary)]/10 px-[var(--spacing-hm-md)] py-1 font-dm-sans text-label-sm text-[var(--color-primary)]">
                            Confirmed
                          </span>
                        </td>
                        <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-lg)]">
                          <Link
                            href={`/appointments/${appointment.id}`}
                            className="font-dm-sans text-label-sm text-[var(--color-primary)] hover:underline"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="border-t border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-low)]/50 p-[var(--spacing-hm-lg)] text-center">
              <p className="font-literata text-body-md text-[var(--color-on-surface-variant)] italic">
                Your care is our priority. Bring any recent reports to your next
                visit.
              </p>
            </div>
          </section>

          <aside className="space-y-[var(--spacing-hm-lg)]">
            {next && countdownDays !== null ? (
              <div className="relative overflow-hidden rounded-xl border border-[var(--color-primary-container)] bg-[var(--color-primary)] p-[var(--spacing-hm-lg)] text-white shadow-[0px_4px_20px_rgba(26,107,114,0.08)]">
                <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 blur-2xl" />
                <p className="mb-2 font-dm-sans text-label-md tracking-widest uppercase opacity-80">
                  Next Appointment
                </p>
                <h3 className="mb-[var(--spacing-hm-md)] font-dm-sans text-display-lg">
                  {formatCountdownLabel(countdownDays)}
                </h3>
                <div className="flex items-center gap-[var(--spacing-hm-md)] rounded-lg border border-white/10 bg-white/10 p-[var(--spacing-hm-md)]">
                  <MdSchedule size={22} aria-hidden />
                  <div className="font-dm-sans text-label-md">
                    <p>{formatAppointmentWeekdayDate(next.startsAt)}</p>
                    <p className="opacity-70">
                      {formatAppointmentTime(next.startsAt)} with{" "}
                      {doctorName(next)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className={`${CARD} p-[var(--spacing-hm-lg)]`}>
                <p className="mb-2 font-dm-sans text-label-md tracking-widest text-[var(--color-on-surface-variant)] uppercase">
                  Next Appointment
                </p>
                <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
                  Nothing scheduled yet.
                </p>
                <Link
                  href="/appointments/book"
                  className="mt-4 inline-flex items-center gap-1.5 font-dm-sans text-label-md font-bold text-[var(--color-primary)] hover:underline"
                >
                  <MdEventAvailable size={18} aria-hidden />
                  Schedule a visit
                </Link>
              </div>
            )}

            <div className={`${CARD} p-[var(--spacing-hm-lg)]`}>
              <h3 className="mb-[var(--spacing-hm-lg)] font-dm-sans text-title-lg text-[var(--color-on-surface)]">
                Reminders
              </h3>
              <div className="space-y-[var(--spacing-hm-md)]">
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <span className="flex items-center gap-[var(--spacing-hm-md)]">
                    <MdMail
                      size={20}
                      className="text-[var(--color-primary)]"
                      aria-hidden
                    />
                    <span className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                      Email Notifications
                    </span>
                  </span>
                  <span className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={emailOn}
                      onChange={(e) => {
                        setEmailOn(e.target.checked);
                        showReminderToast();
                      }}
                    />
                    <span className="h-6 w-11 rounded-full bg-[var(--color-surface-container-highest)] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-primary)] peer-checked:after:translate-x-full" />
                  </span>
                </label>
                <label className="flex cursor-pointer items-center justify-between gap-3">
                  <span className="flex items-center gap-[var(--spacing-hm-md)]">
                    <MdSms
                      size={20}
                      className="text-[var(--color-primary)]"
                      aria-hidden
                    />
                    <span className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                      SMS Notifications
                    </span>
                  </span>
                  <span className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={smsOn}
                      onChange={(e) => {
                        setSmsOn(e.target.checked);
                        showReminderToast();
                      }}
                    />
                    <span className="h-6 w-11 rounded-full bg-[var(--color-surface-container-highest)] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-[var(--color-primary)] peer-checked:after:translate-x-full" />
                  </span>
                </label>
              </div>
              <div className="mt-[var(--spacing-hm-lg)] border-t border-[var(--color-outline-variant)]/30 pt-[var(--spacing-hm-lg)]">
                <div className="flex items-start gap-[var(--spacing-hm-md)] text-[var(--color-on-surface-variant)]">
                  <MdInfo
                    size={20}
                    className="shrink-0 text-[var(--color-secondary)]"
                    aria-hidden
                  />
                  <p className="font-dm-sans text-label-sm">
                    We&apos;ll send you a 24-hour and 2-hour reminder before
                    every session. Preferences are preview-only for now.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border-l-4 border-[var(--color-primary)] bg-[var(--color-surface-variant)]/30 p-[var(--spacing-hm-lg)]">
              <p className="mb-1 font-dm-sans text-label-md font-bold text-[var(--color-primary)]">
                Daily Health Tip
              </p>
              <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
                Regular morning walks of just 15 minutes can support heart
                health and energy through the day.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
