"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  MdChevronLeft,
  MdChevronRight,
  MdGroups,
  MdSearch,
} from "react-icons/md";

import { Skeleton } from "@/components/ui/Skeleton";
import { useDoctorPatients } from "@/features/doctor/patients/hooks/use-doctor-patients";
import type { DoctorPatientListItem } from "@/features/doctor/patients/types/response";
import type { PatientRosterStatusFilter } from "@/features/doctor/patients/types/schemas";
import { useDebouncedValue } from "@/hooks/use-debounce";

const PAGE_SIZE = 10;

const CARD =
  "rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] shadow-[0px_4px_20px_rgba(26,107,114,0.08)]";

const STATUS_FILTERS: Array<{
  value: PatientRosterStatusFilter;
  label: string;
  dotClass?: string;
}> = [
  { value: "all", label: "All Patients" },
  { value: "active", label: "Active", dotClass: "bg-[var(--color-primary)]" },
  { value: "inactive", label: "Inactive", dotClass: "bg-[var(--color-error)]" },
  { value: "new", label: "New", dotClass: "bg-[var(--color-secondary)]" },
];

function formatGender(gender: string | null): string {
  if (!gender) return "Not specified";
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

function StatusBadge({ status }: { status: DoctorPatientListItem["status"] }) {
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-[12px] font-medium text-[var(--color-primary)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
        Active
      </span>
    );
  }

  if (status === "new") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-secondary)]/10 px-2.5 py-0.5 text-[12px] font-medium text-[var(--color-secondary)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-secondary)]" />
        New
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-error)]/10 px-2.5 py-0.5 text-[12px] font-medium text-[var(--color-error)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-error)]" />
      Inactive
    </span>
  );
}

function PatientAvatar({ patient }: { patient: DoctorPatientListItem }) {
  const inactive = patient.status === "inactive";

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-high)] font-dm-sans text-sm font-bold text-[var(--color-primary)] ${
        inactive ? "opacity-80 grayscale" : ""
      }`}
      aria-hidden
    >
      {patient.initials}
    </div>
  );
}

function TableSkeletonRow() {
  return (
    <tr>
      <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)]">
        <div className="flex items-center gap-[var(--spacing-hm-md)]">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </td>
      <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)]">
        <Skeleton className="h-4 w-28" />
      </td>
      <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)]">
        <Skeleton className="h-6 w-20 rounded-full" />
      </td>
      <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)]">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </td>
      <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] text-center">
        <Skeleton className="mx-auto h-4 w-6" />
      </td>
      <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] text-right">
        <Skeleton className="ml-auto h-8 w-24 rounded-lg" />
      </td>
    </tr>
  );
}

export function DoctorPatientsView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PatientRosterStatusFilter>("all");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1);
  }, [debouncedSearch, status]);

  const { data, isLoading, isFetching, isError, error } = useDoctorPatients({
    q: debouncedSearch,
    page,
    pageSize: PAGE_SIZE,
    status,
  });

  const patients = data?.patients ?? [];
  const pagination = data?.pagination;
  const showEmpty = !isLoading && patients.length === 0;
  const totalPatients = pagination?.total ?? 0;

  return (
    <div className="mx-auto flex w-full min-w-0 flex-col px-4 md:px-8 lg:px-12 space-y-8 py-4 lg:space-y-10 lg:py-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-dm-sans text-headline-lg text-[var(--color-primary)]">
              Patient Directory
            </h1>
            {!isLoading && totalPatients > 0 ? (
              <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[var(--color-primary-container)] px-2 font-dm-sans text-label-sm font-bold text-[var(--color-on-primary-container)]">
                {totalPatients}
              </span>
            ) : null}
          </div>
          <p className="mt-1 max-w-3xl font-literata text-body-md text-[var(--color-on-surface-variant)]">
            Patients who have booked with you — past, present, or upcoming.
          </p>
        </div>
      </header>

      <div className="space-y-3">
        <label htmlFor="patient-search" className="sr-only">
          Search patients
        </label>
        <div className="flex h-12 w-full max-w-xl items-center gap-3 rounded-lg border border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] px-4 focus-within:border-[var(--color-primary)] focus-within:ring-1 focus-within:ring-[var(--color-primary)]">
          <MdSearch
            className="shrink-0 text-[var(--color-on-surface-variant)]"
            size={20}
            aria-hidden
          />
          <input
            id="patient-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by name, phone, or ID…"
            className="min-w-0 flex-1 border-0 bg-transparent py-2 font-literata text-body-md text-[var(--color-on-surface)] placeholder:text-[var(--color-on-surface-variant)] focus:outline-none"
          />
        </div>

        <div
          className="flex flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter patients by status"
        >
          {STATUS_FILTERS.map((filter) => {
            const active = status === filter.value;
            return (
              <button
                key={filter.value}
                type="button"
                aria-pressed={active}
                onClick={() => setStatus(filter.value)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 font-dm-sans text-label-md transition-colors ${
                  active
                    ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 font-semibold text-[var(--color-primary)]"
                    : "border-[var(--color-outline-variant)] bg-[var(--color-surface-container-lowest)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]/30 hover:bg-[var(--color-surface-container-low)]"
                }`}
              >
                {filter.dotClass ? (
                  <span
                    className={`h-2 w-2 shrink-0 rounded-full ${filter.dotClass}`}
                    aria-hidden
                  />
                ) : null}
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      <section className={`${CARD} flex min-w-0 flex-col overflow-hidden`}>
        {/* Mobile card list */}
        <div className="divide-y divide-[var(--color-outline-variant)]/30 md:hidden">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-4">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))
          ) : isError ? (
            <div
              className="px-4 py-8 text-center font-literata text-body-md text-[var(--color-error)]"
              role="alert"
            >
              {error instanceof Error
                ? error.message
                : "Failed to load patients"}
            </div>
          ) : showEmpty ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-primary)]">
                <MdGroups size={24} aria-hidden />
              </div>
              <p className="font-dm-sans text-title-md text-[var(--color-on-surface)]">
                {debouncedSearch.trim() || status !== "all"
                  ? "No matching patients"
                  : "No patients yet"}
              </p>
            </div>
          ) : (
            patients.map((patient) => (
              <Link
                key={patient.id}
                href={`/doctor/patients/${patient.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-surface-container-low)]/60"
              >
                <PatientAvatar patient={patient} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-dm-sans text-label-md font-semibold text-[var(--color-on-surface)]">
                    {patient.fullName}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge status={patient.status} />
                    <span className="font-literata text-[11px] text-[var(--color-on-surface-variant)]">
                      {patient.visitCount} visit
                      {patient.visitCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <MdChevronRight
                  size={20}
                  className="shrink-0 text-[var(--color-outline)]"
                  aria-hidden
                />
              </Link>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-bright)]">
                <th
                  scope="col"
                  className="min-w-[220px] px-[var(--spacing-hm-lg)] py-3 text-left font-dm-sans text-[11px] font-semibold tracking-wide whitespace-nowrap text-[var(--color-on-surface-variant)] uppercase"
                >
                  Patient Name
                </th>
                <th
                  scope="col"
                  className="min-w-[120px] px-[var(--spacing-hm-lg)] py-3 text-left font-dm-sans text-[11px] font-semibold tracking-wide whitespace-nowrap text-[var(--color-on-surface-variant)] uppercase"
                >
                  Age / Gender
                </th>
                <th
                  scope="col"
                  className="min-w-[100px] px-[var(--spacing-hm-lg)] py-3 text-left font-dm-sans text-[11px] font-semibold tracking-wide whitespace-nowrap text-[var(--color-on-surface-variant)] uppercase"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="min-w-[180px] px-[var(--spacing-hm-lg)] py-3 text-left font-dm-sans text-[11px] font-semibold tracking-wide whitespace-nowrap text-[var(--color-on-surface-variant)] uppercase"
                >
                  Last Visit
                </th>
                <th
                  scope="col"
                  className="min-w-[72px] px-[var(--spacing-hm-lg)] py-3 text-center font-dm-sans text-[11px] font-semibold tracking-wide whitespace-nowrap text-[var(--color-on-surface-variant)] uppercase"
                >
                  Visits
                </th>
                <th
                  scope="col"
                  className="min-w-[130px] px-[var(--spacing-hm-lg)] py-3 text-right font-dm-sans text-[11px] font-semibold tracking-wide whitespace-nowrap text-[var(--color-on-surface-variant)] uppercase"
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-outline-variant)]/30">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableSkeletonRow key={index} />
                ))
              ) : isError ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-xl)] text-center font-literata text-body-md text-[var(--color-error)]"
                    role="alert"
                  >
                    {error instanceof Error
                      ? error.message
                      : "Failed to load patients"}
                  </td>
                </tr>
              ) : showEmpty ? (
                <tr>
                  <td colSpan={6} className="px-[var(--spacing-hm-lg)] py-16">
                    <div className="flex flex-col items-center justify-center text-center">
                      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-container-high)] text-[var(--color-primary)]">
                        <MdGroups size={28} aria-hidden />
                      </div>
                      <p className="font-dm-sans text-title-lg text-[var(--color-on-surface)]">
                        {debouncedSearch.trim() || status !== "all"
                          ? "No matching patients"
                          : "No patients yet"}
                      </p>
                      <p className="mt-2 max-w-md font-literata text-body-md text-[var(--color-on-surface-variant)]">
                        {debouncedSearch.trim() || status !== "all"
                          ? "Try a different search term or clear your filters."
                          : "Patients will appear here once they book an appointment with you."}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                patients.map((patient) => (
                  <tr
                    key={patient.id}
                    className={`group transition-colors hover:bg-[var(--color-surface-container-low)]/60 ${
                      patient.status === "inactive" ? "opacity-75" : ""
                    }`}
                  >
                    <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)]">
                      <div className="flex min-w-0 items-center gap-[var(--spacing-hm-md)]">
                        <PatientAvatar patient={patient} />
                        <div className="min-w-0">
                          <p className="truncate font-dm-sans text-label-md font-semibold text-[var(--color-on-surface)] transition-colors group-hover:text-[var(--color-primary)]">
                            {patient.fullName}
                          </p>
                          <p className="truncate font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                            ID: {patient.displayId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)]">
                      <p className="font-literata text-body-md text-[var(--color-on-surface)]">
                        {patient.age} yrs{" "}
                        <span className="text-[var(--color-on-surface-variant)]">
                          •
                        </span>{" "}
                        {formatGender(patient.gender)}
                      </p>
                    </td>
                    <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)]">
                      <StatusBadge status={patient.status} />
                    </td>
                    <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)]">
                      <p className="font-literata text-body-md text-[var(--color-on-surface)]">
                        {patient.lastVisitLabel ?? "—"}
                      </p>
                      {patient.lastVisitReason ? (
                        <p className="truncate font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                          {patient.lastVisitReason}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] text-center">
                      <p className="font-literata text-body-md text-[var(--color-on-surface)]">
                        {patient.visitCount}
                      </p>
                    </td>
                    <td className="px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)] text-right">
                      <Link
                        href={`/doctor/patients/${patient.id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-[var(--color-primary)] px-[var(--spacing-hm-sm)] py-1.5 font-dm-sans text-label-md text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary-container)] hover:text-[var(--color-on-primary-container)]"
                      >
                        View Profile
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-bright)] px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-md)]">
          <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
            {pagination && pagination.total > 0 ? (
              <>
                Showing{" "}
                <span className="font-semibold text-[var(--color-on-surface)]">
                  {pagination.from}–{pagination.to}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-[var(--color-on-surface)]">
                  {pagination.total}
                </span>{" "}
                patients
              </>
            ) : (
              "Showing 0 patients"
            )}
            {isFetching && !isLoading ? (
              <span className="ml-2 text-[var(--color-primary)]">
                Updating…
              </span>
            ) : null}
          </p>

          <div className="flex items-center gap-1">
            {pagination && pagination.totalPages > 1 ? (
              <span className="mr-2 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                Page {pagination.page} of {pagination.totalPages}
              </span>
            ) : null}
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={!pagination || pagination.page <= 1 || isFetching}
              className="rounded-lg p-1.5 text-[var(--color-on-surface-variant)] transition-colors hover:bg-[var(--color-surface-container-low)] disabled:opacity-40"
              aria-label="Previous page"
            >
              <MdChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((current) =>
                  pagination && current < pagination.totalPages
                    ? current + 1
                    : current,
                )
              }
              disabled={
                !pagination ||
                pagination.page >= pagination.totalPages ||
                isFetching
              }
              className="rounded-lg p-1.5 text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface-container-low)] disabled:opacity-40"
              aria-label="Next page"
            >
              <MdChevronRight size={22} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}
