"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MdArrowForward,
  MdCall,
  MdChevronRight,
  MdEmail,
  MdEmergency,
} from "react-icons/md";

import Model from "@/components/ui/Model";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDoctorPatientDetail } from "@/features/doctor/patients/hooks/use-doctor-patient-detail";
import type {
  DoctorPatientVisit,
  PatientVisitStatus,
} from "@/features/doctor/patients/types/response";

const CARD =
  "rounded-xl border border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-container-lowest)] shadow-[0px_4px_20px_rgba(26,107,114,0.08)]";

function formatGender(gender: string | null): string {
  if (!gender) return "Not specified";
  return gender.charAt(0).toUpperCase() + gender.slice(1);
}

function VisitStatusBadge({ status }: { status: PatientVisitStatus }) {
  if (status === "upcoming") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 font-dm-sans text-label-sm font-medium text-[var(--color-primary)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
        Upcoming
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-error)]/10 px-2.5 py-0.5 font-dm-sans text-label-sm font-medium text-[var(--color-error)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-error)]" />
        Cancelled
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-secondary-container)] px-2.5 py-0.5 font-dm-sans text-label-sm text-[var(--color-on-secondary-container)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-secondary)]" />
      Completed
    </span>
  );
}

function VisitBookingModal({
  visit,
  doctorName,
  onClose,
}: {
  visit: DoctorPatientVisit | null;
  doctorName: string;
  onClose: () => void;
}) {
  if (!visit) return null;

  return (
    <Model
      title="Booking Details"
      isOpen={Boolean(visit)}
      onClose={onClose}
      content={
        <div className="space-y-4 font-literata text-body-md text-[var(--color-on-surface)]">
          <p>
            <span className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
              Reference
            </span>
            <br />
            {visit.bookingReference}
          </p>
          <p>
            <span className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
              Date &amp; time
            </span>
            <br />
            {visit.dateLabel} · {visit.timeLabel}
          </p>
          <p>
            <span className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
              Provider
            </span>
            <br />
            {doctorName}
          </p>
          <p>
            <span className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
              Reason
            </span>
            <br />
            {visit.reasonForVisit}
          </p>
          {visit.additionalNotes ? (
            <p>
              <span className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                Notes
              </span>
              <br />
              {visit.additionalNotes}
            </p>
          ) : null}
          <div>
            <VisitStatusBadge status={visit.status} />
          </div>
        </div>
      }
    />
  );
}

type DoctorPatientDetailViewProps = {
  patientId: string;
};

export function DoctorPatientDetailView({
  patientId,
}: DoctorPatientDetailViewProps) {
  const { data, isLoading, isError, error } = useDoctorPatientDetail(patientId);
  const [selectedVisit, setSelectedVisit] = useState<DoctorPatientVisit | null>(
    null,
  );

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 lg:space-y-8">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">
        <div className={`${CARD} p-8 text-center`}>
          <p
            className="font-literata text-body-md text-[var(--color-error)]"
            role="alert"
          >
            {error instanceof Error ? error.message : "Patient not found"}
          </p>
          <Link
            href="/doctor/patients"
            className="mt-4 inline-block font-dm-sans text-label-md text-[var(--color-primary)] hover:underline"
          >
            Back to Patient Directory
          </Link>
        </div>
      </div>
    );
  }

  const { patient, doctorName, visits } = data;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 lg:space-y-8">
      <nav
        className="flex flex-wrap items-center gap-1.5 font-dm-sans text-label-md text-[var(--color-on-surface-variant)]"
        aria-label="Breadcrumb"
      >
        <Link
          href="/doctor/patients"
          className="transition-colors hover:text-[var(--color-primary)]"
        >
          Patients
        </Link>
        <MdChevronRight size={16} aria-hidden />
        <span className="font-semibold text-[var(--color-on-surface)]">
          {patient.fullName}
        </span>
      </nav>

      {/* Patient profile header card */}
      <section
        className={`${CARD} flex flex-col gap-5 p-6 md:flex-row md:items-start md:p-8`}
      >
        {patient.profilePictureUrl ? (
          <img
            src={patient.profilePictureUrl}
            alt=""
            className="h-24 w-24 shrink-0 rounded-full border-2 border-[var(--color-outline-variant)] object-cover"
          />
        ) : (
          <div
            className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-outline-variant)] bg-[var(--color-surface-container-high)] font-dm-sans text-headline-md font-bold text-[var(--color-primary)]"
            aria-hidden
          >
            {patient.initials}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="font-dm-sans text-headline-lg font-semibold text-[var(--color-on-surface)]">
                {patient.fullName}
              </h1>
              <p className="mt-1.5 font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                DOB: {patient.dateOfBirthLabel} ({patient.age}y) ·{" "}
                {formatGender(patient.gender)}
              </p>
              <p className="mt-0.5 font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                ID: {patient.displayId}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 border-t border-[var(--color-outline-variant)]/30 pt-5 sm:grid-cols-2">
            <div className="flex min-w-0 items-center gap-2.5 text-[var(--color-on-surface-variant)]">
              <MdEmail size={20} aria-hidden />
              <span className="truncate font-literata text-body-md text-[var(--color-on-surface)]">
                {patient.email}
              </span>
            </div>
            <div className="flex items-center gap-2.5 text-[var(--color-on-surface-variant)]">
              <MdCall size={20} aria-hidden />
              <span className="font-literata text-body-md text-[var(--color-on-surface)]">
                {patient.phoneNumber ?? "Not provided"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Two-column grid: Clinical History + Sidebar */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {/* Clinical History - takes 2/3 width */}
        <section className={`${CARD} overflow-hidden lg:col-span-2`}>
          <div className="border-b border-[var(--color-outline-variant)]/30 bg-[var(--color-surface-bright)] px-6 py-4">
            <h2 className="font-dm-sans text-title-lg font-semibold text-[var(--color-on-surface)]">
              Clinical History
            </h2>
            <p className="mt-0.5 font-literata text-body-sm text-[var(--color-on-surface-variant)]">
              {visits.length} visit{visits.length !== 1 ? "s" : ""} recorded
              with you
            </p>
          </div>

          {visits.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
                No visits recorded with you yet.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-outline-variant)]/30">
              {visits.map((visit) => (
                <article
                  key={visit.id}
                  className="flex flex-col gap-3 px-6 py-5 transition-colors hover:bg-[var(--color-surface-container-low)]/50 sm:flex-row sm:items-start sm:gap-6"
                >
                  <div className="w-full shrink-0 sm:w-32">
                    <span className="block font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
                      {visit.dateLabel}
                    </span>
                    <span className="mt-0.5 block font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
                      {visit.timeLabel}
                    </span>
                    <span className="mt-2 block sm:hidden">
                      <VisitStatusBadge status={visit.status} />
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="mb-1.5 font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
                      {visit.reasonForVisit}
                    </h3>
                    {visit.additionalNotes ? (
                      <p className="mb-3 font-literata text-body-md leading-relaxed text-[var(--color-on-surface-variant)]">
                        {visit.additionalNotes}
                      </p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setSelectedVisit(visit)}
                      className="inline-flex items-center gap-1 font-dm-sans text-label-sm font-medium text-[var(--color-primary)] hover:underline"
                    >
                      View Booking Details
                      <MdArrowForward size={14} aria-hidden />
                    </button>
                  </div>

                  <div className="hidden shrink-0 sm:block">
                    <VisitStatusBadge status={visit.status} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Sidebar - takes 1/3 width */}
        <aside className="flex flex-col gap-6 lg:gap-8">
          <section className={`${CARD} p-6`}>
            <h3 className="mb-4 font-dm-sans text-title-lg font-semibold text-[var(--color-on-surface)]">
              Medical Overview
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-container-low)] px-4 py-3">
                <span className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                  Blood Type
                </span>
                <span className="font-dm-sans text-label-md font-bold text-[var(--color-primary)]">
                  {patient.bloodGroup ?? "Not recorded"}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-[var(--color-surface-container-low)] px-4 py-3">
                <span className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                  Total Visits
                </span>
                <span className="font-dm-sans text-label-md font-bold text-[var(--color-on-surface)]">
                  {patient.visitCount}
                </span>
              </div>

              <div className="border-t border-[var(--color-outline-variant)]/30 pt-4">
                <span className="mb-1.5 block font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                  Allergies
                </span>
                <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
                  Not on file
                </p>
              </div>

              <div>
                <span className="mb-1.5 block font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
                  Current Medications
                </span>
                <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
                  Not on file
                </p>
              </div>
            </div>
          </section>

          <section className={`${CARD} p-6`}>
            <div className="mb-4 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-error)]/10">
                <MdEmergency
                  className="text-[var(--color-error)]"
                  size={20}
                  aria-hidden
                />
              </div>
              <h3 className="font-dm-sans text-title-lg font-semibold text-[var(--color-on-surface)]">
                Emergency Contact
              </h3>
            </div>
            <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
              Not on file
            </p>
          </section>
        </aside>
      </div>

      <VisitBookingModal
        visit={selectedVisit}
        doctorName={doctorName}
        onClose={() => setSelectedVisit(null)}
      />
    </div>
  );
}
