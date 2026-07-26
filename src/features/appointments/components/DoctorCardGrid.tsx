"use client";

import { useMemo, useState } from "react";
import {
  MdEventAvailable,
  MdPerson,
  MdPersonSearch,
  MdSearch,
} from "react-icons/md";

import { LoadingState } from "@/components/ui/PageLoading";
import { Skeleton } from "@/components/ui/Skeleton";

import type { DoctorListItem } from "../types/doctor";

type DoctorCardGridProps = {
  doctors: DoctorListItem[];
  selectedId: string | null;
  onSelect: (doctor: DoctorListItem) => void;
  loading?: boolean;
  error?: string | null;
};

function DoctorAvatar({ doctor }: { doctor: DoctorListItem }) {
  const initials =
    `${doctor.firstName[0] ?? ""}${doctor.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div
      className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-container)]/15 font-dm-sans text-title-lg font-bold text-[var(--color-primary)]"
      aria-hidden
    >
      {initials || <MdPerson size={32} />}
    </div>
  );
}

export function DoctorCardGrid({
  doctors,
  selectedId,
  onSelect,
  loading,
  error,
}: DoctorCardGridProps) {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("all");

  const specialties = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialization));
    return Array.from(set).sort();
  }, [doctors]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return doctors.filter((doctor) => {
      const matchesSpecialty =
        specialty === "all" || doctor.specialization === specialty;
      if (!matchesSpecialty) return false;
      if (!q) return true;
      const haystack =
        `${doctor.firstName} ${doctor.lastName} ${doctor.specialization}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [doctors, query, specialty]);

  if (loading) {
    return (
      <div className="space-y-[var(--spacing-hm-lg)]" aria-busy="true">
        <LoadingState label="Loading doctors…" compact />
        <ul className="grid grid-cols-1 gap-[var(--spacing-hm-xl)] md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <li key={index}>
              <Skeleton className="h-56 w-full" />
            </li>
          ))}
        </ul>
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

  return (
    <div>
      <section className="mb-[var(--spacing-hm-xxl)] rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] p-[var(--spacing-hm-lg)] shadow-sm">
        <div className="grid grid-cols-1 items-end gap-[var(--spacing-hm-lg)] md:grid-cols-12">
          <div className="relative md:col-span-7">
            <label
              htmlFor="search-doctor"
              className="mb-1 ml-1 block font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]"
            >
              Doctor name or specialty
            </label>
            <div className="relative">
              <input
                id="search-doctor"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search doctors…"
                className="h-14 w-full rounded-lg border border-[var(--color-outline-variant)] bg-transparent px-[var(--spacing-hm-md)] pr-12 font-literata text-body-md text-[var(--color-on-surface)] outline-none transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
              />
              <MdSearch
                size={22}
                className="pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 text-[var(--color-on-surface-variant)]"
                aria-hidden
              />
            </div>
          </div>

          <div className="relative md:col-span-5">
            <label
              htmlFor="specialty-filter"
              className="mb-1 ml-1 block font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]"
            >
              Specialty
            </label>
            <select
              id="specialty-filter"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="h-14 w-full appearance-none rounded-lg border border-[var(--color-outline-variant)] bg-transparent px-[var(--spacing-hm-md)] font-literata text-body-md text-[var(--color-on-surface)] outline-none transition-all focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
            >
              <option value="all">All Specialties</option>
              {specialties.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-[var(--spacing-hm-lg)] flex items-center justify-between gap-3">
          <h2 className="font-dm-sans text-headline-md font-bold text-[var(--color-primary)]">
            Recommended Doctors
          </h2>
          <span className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
            {filtered.length} result{filtered.length === 1 ? "" : "s"} found
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-[var(--color-outline-variant)]/50 px-6 py-12 text-center">
            <MdPersonSearch
              size={40}
              className="text-[var(--color-on-surface-variant)]"
              aria-hidden
            />
            <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
              No doctors match your search.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-[var(--spacing-hm-xl)] md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((doctor) => {
              const selected = selectedId === doctor.id;
              return (
                <li key={doctor.id}>
                  <article
                    className={`rounded-xl border bg-[var(--color-surface-container-lowest)] p-[var(--spacing-hm-lg)] transition-all duration-300 ${
                      selected
                        ? "border-[var(--color-primary)] shadow-xl ring-2 ring-[var(--color-primary)]/20"
                        : "border-[var(--color-outline-variant)]/30 hover:shadow-xl"
                    }`}
                  >
                    <div className="mb-[var(--spacing-hm-md)] flex items-start gap-[var(--spacing-hm-md)]">
                      <DoctorAvatar doctor={doctor} />
                      <div className="min-w-0 flex-1">
                        <h3 className="mb-1 font-dm-sans text-title-lg font-bold text-[var(--color-on-surface)]">
                          Dr. {doctor.firstName} {doctor.lastName}
                        </h3>
                        <p className="font-dm-sans text-label-md tracking-wider text-[var(--color-primary)] uppercase">
                          {doctor.specialization}
                        </p>
                      </div>
                    </div>

                    <div className="mb-[var(--spacing-hm-lg)] flex flex-wrap gap-2">
                      <span className="rounded-full bg-[var(--color-secondary-container)]/50 px-3 py-1 font-dm-sans text-label-sm text-[var(--color-on-secondary-container)]">
                        In-Person
                      </span>
                      <span className="rounded-full bg-[var(--color-secondary-container)]/50 px-3 py-1 font-dm-sans text-label-sm text-[var(--color-on-secondary-container)]">
                        Mon–Sat · 11AM–7PM
                      </span>
                    </div>

                    <button
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onSelect(doctor)}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-primary-container)] py-3 font-dm-sans font-bold text-[var(--color-on-primary-container)] transition-all duration-200 hover:bg-[var(--color-primary)] hover:text-white active:scale-[0.98]"
                    >
                      <MdEventAvailable size={20} aria-hidden />
                      Book Now
                    </button>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
