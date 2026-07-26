"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  MdAdd,
  MdCheckCircle,
  MdChevronRight,
  MdEventAvailable,
  MdHistory,
  MdPerson,
  MdUpcoming,
} from "react-icons/md";

import {
  fetchAppointments,
  type AppointmentConfirmation,
  type AppointmentsListResponse,
} from "../services/client";
import {
  formatAppointmentDate,
  formatAppointmentTime,
} from "../lib/date-utils";
import { LoadingState } from "@/components/ui/PageLoading";
import { Skeleton } from "@/components/ui/Skeleton";

type Tab = "upcoming" | "past";

function doctorInitials(appointment: AppointmentConfirmation): string {
  return `${appointment.doctor.firstName[0] ?? ""}${appointment.doctor.lastName[0] ?? ""}`.toUpperCase();
}

export function AppointmentsList() {
  const [data, setData] = useState<AppointmentsListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("upcoming");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const result = await fetchAppointments();
        if (!cancelled) setData(result);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to load appointments",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(() => {
    const list =
      tab === "upcoming" ? (data?.upcoming ?? []) : (data?.past ?? []);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) => {
      const haystack =
        `${a.doctor.firstName} ${a.doctor.lastName} ${a.doctor.specialization} ${a.bookingReference}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [data, tab, query]);

  if (loading) {
    return (
      <div className="space-y-[var(--spacing-hm-lg)]" aria-busy="true">
        <LoadingState label="Loading appointments…" compact />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Skeleton className="h-20 md:col-span-2" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
        <Skeleton className="h-14 w-full" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      </div>
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

  const upcomingCount = data?.upcoming.length ?? 0;
  const pastCount = data?.past.length ?? 0;

  return (
    <div className="space-y-[var(--spacing-hm-lg)]">
      <div className="grid grid-cols-1 gap-[var(--spacing-hm-lg)] md:grid-cols-4">
        <div className="flex flex-col justify-center md:col-span-2">
          <h1 className="font-dm-sans text-headline-lg tracking-tight text-[var(--color-on-surface)]">
            Appointment History
          </h1>
          <p className="mt-1 font-literata text-body-md text-[var(--color-on-surface-variant)]">
            Review your visits, track upcoming bookings, and manage your
            schedule.
          </p>
        </div>
        <div className="flex items-center gap-[var(--spacing-hm-md)] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] p-[var(--spacing-hm-md)] shadow-[0px_4px_20px_rgba(26,107,114,0.08)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-fixed)] text-[var(--color-primary)]">
            <MdUpcoming size={24} aria-hidden />
          </div>
          <div>
            <p className="font-dm-sans text-label-sm tracking-wider text-[var(--color-on-surface-variant)] uppercase">
              Upcoming
            </p>
            <p className="font-dm-sans text-headline-md text-[var(--color-primary)]">
              {upcomingCount}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-[var(--spacing-hm-md)] rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] p-[var(--spacing-hm-md)] shadow-[0px_4px_20px_rgba(26,107,114,0.08)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-secondary-container)] text-[var(--color-secondary)]">
            <MdEventAvailable size={24} aria-hidden />
          </div>
          <div>
            <p className="font-dm-sans text-label-sm tracking-wider text-[var(--color-on-surface-variant)] uppercase">
              Past visits
            </p>
            <p className="font-dm-sans text-headline-md text-[var(--color-secondary)]">
              {pastCount}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-[var(--color-outline-variant)] bg-[var(--color-surface)] shadow-[0px_4px_20px_rgba(26,107,114,0.08)]">
        <div className="flex flex-col border-b border-[var(--color-outline-variant)] md:flex-row">
          <button
            type="button"
            onClick={() => setTab("upcoming")}
            className={`flex-1 px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-md transition-colors ${
              tab === "upcoming"
                ? "border-b-2 border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]"
                : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]"
            }`}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <MdUpcoming size={20} aria-hidden /> Upcoming Schedule
            </span>
          </button>
          <button
            type="button"
            onClick={() => setTab("past")}
            className={`flex-1 px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-md transition-colors ${
              tab === "past"
                ? "border-b-2 border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]"
                : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-low)]"
            }`}
          >
            <span className="inline-flex items-center justify-center gap-2">
              <MdHistory size={20} aria-hidden /> Past Appointments
            </span>
          </button>
        </div>

        <div className="grid grid-cols-1 gap-[var(--spacing-hm-md)] bg-[var(--color-surface-container-lowest)] p-[var(--spacing-hm-lg)] sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
            <label
              htmlFor="filter-doctor"
              className="ml-1 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]"
            >
              Doctor name
            </label>
            <input
              id="filter-doctor"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by doctor or booking ref…"
              className="w-full rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)] px-[var(--spacing-hm-md)] py-2 font-dm-sans text-label-md outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            />
          </div>
          <div className="flex items-end">
            <Link
              href="/appointments/book"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary)] py-2 font-dm-sans text-label-md text-white transition-opacity hover:opacity-90"
            >
              <MdAdd size={18} aria-hidden />
              Book appointment
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-y border-[var(--color-outline-variant)] bg-[var(--color-surface-container-low)]">
                <th className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-sm tracking-wider text-[var(--color-on-surface-variant)] uppercase">
                  Date &amp; Time
                </th>
                <th className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-sm tracking-wider text-[var(--color-on-surface-variant)] uppercase">
                  Doctor
                </th>
                <th className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-sm tracking-wider text-[var(--color-on-surface-variant)] uppercase">
                  Type
                </th>
                <th className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] font-dm-sans text-label-sm tracking-wider text-[var(--color-on-surface-variant)] uppercase">
                  Status
                </th>
                <th className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] text-right font-dm-sans text-label-sm tracking-wider text-[var(--color-on-surface-variant)] uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-outline-variant)]">
              {rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-[var(--spacing-hm-lg)] py-10 text-center font-literata text-body-md text-[var(--color-on-surface-variant)]"
                  >
                    No {tab} appointments found.{" "}
                    {tab === "upcoming" && (
                      <Link
                        href="/appointments/book"
                        className="text-[var(--color-primary)] underline"
                      >
                        Book one
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                rows.map((appointment) => (
                  <tr
                    key={appointment.id}
                    className="transition-colors hover:bg-[var(--color-surface-container-low)]"
                  >
                    <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)]">
                      <p className="font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
                        {formatAppointmentDate(appointment.startsAt)}
                      </p>
                      <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                        {formatAppointmentTime(appointment.startsAt)}
                      </p>
                    </td>
                    <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)]">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary-fixed)] font-dm-sans text-xs font-bold text-[var(--color-primary)]">
                          {doctorInitials(appointment) || (
                            <MdPerson size={14} />
                          )}
                        </div>
                        <div>
                          <p className="font-dm-sans text-label-md text-[var(--color-on-surface)]">
                            Dr. {appointment.doctor.firstName}{" "}
                            {appointment.doctor.lastName}
                          </p>
                          <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                            {appointment.doctor.specialization}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)]">
                      <span className="inline-flex items-center gap-1 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                        <MdPerson size={18} aria-hidden /> In-person
                      </span>
                    </td>
                    <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)]">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-dm-sans text-label-sm font-semibold ${
                          appointment.timing === "upcoming"
                            ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                            : "bg-[var(--color-success-container)] text-[var(--color-success)]"
                        }`}
                      >
                        <MdCheckCircle size={14} aria-hidden />
                        {appointment.timing === "upcoming"
                          ? "Upcoming"
                          : "Completed"}
                      </span>
                    </td>
                    <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] text-right">
                      <Link
                        href={`/appointments/${appointment.id}`}
                        className="inline-flex items-center gap-1 font-dm-sans text-label-md text-[var(--color-primary)] hover:underline"
                      >
                        View Details
                        <MdChevronRight size={18} aria-hidden />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] p-[var(--spacing-hm-lg)]">
          <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
            Showing {rows.length} of{" "}
            {tab === "upcoming" ? upcomingCount : pastCount} results
          </p>
        </div>
      </div>
    </div>
  );
}
