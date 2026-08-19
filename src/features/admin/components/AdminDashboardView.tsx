"use client";

import {
  MdAnalytics,
  MdArrowForward,
  MdCancel,
  MdCurrencyRupee,
  MdEventAvailable,
  MdGroups,
  MdLocalHospital,
  MdTaskAlt,
  MdTrendingUp,
} from "react-icons/md";

import { PendingLink } from "@/components/ui/PendingLink";
import { KpiCard } from "@/features/admin/components/KpiCard";
import { useAppointmentsSummary } from "@/features/admin/analytics/hooks/use-appointments-summary";

export function AdminDashboardView() {
  const { data, isLoading, isError } = useAppointmentsSummary("daily");

  return (
    <div className="mx-auto w-full px-4 md:px-8 lg:px-12 space-y-8 py-4 lg:space-y-10 lg:py-6">
      <header className="space-y-3">
        <h1 className="font-dm-sans text-headline-lg font-semibold text-[var(--color-primary)]">
          Clinic Dashboard
        </h1>
        <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
          Overview of clinic operations and appointment activity this week
        </p>
      </header>

      {isLoading ? (
        <p className="font-dm-sans text-body-md text-[var(--color-on-surface-variant)]">
          Loading dashboard…
        </p>
      ) : null}

      {isError ? (
        <p className="font-dm-sans text-body-md text-[var(--color-error)]">
          Unable to load dashboard metrics. Please try again.
        </p>
      ) : null}

      {data ? (
        <div className="space-y-8 lg:space-y-10">
          <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            <KpiCard
              label="Total Patients"
              value={String(data.overview.totalPatients)}
              hint="Registered patient profiles"
              icon={MdGroups}
            />
            <KpiCard
              label="Total Doctors"
              value={String(data.overview.totalDoctors)}
              hint="Active doctor profiles"
              icon={MdLocalHospital}
            />
            <KpiCard
              label="Total Revenue"
              value={`INR ${(data.overview.totalRevenueInPaise / 100).toLocaleString("en-IN")}`}
              hint="Captured payments"
              icon={MdCurrencyRupee}
            />
            <KpiCard
              label="Total Appointments"
              value={String(data.summary.total)}
              hint="Current week (IST)"
              icon={MdEventAvailable}
            />
            <KpiCard
              label="Completion Rate"
              value={`${data.summary.completionRate}%`}
              hint="Past confirmed visits"
              icon={MdTaskAlt}
            />
            <KpiCard
              label="Cancellation Rate"
              value={`${data.summary.cancellationRate}%`}
              hint="Cancelled this week"
              icon={MdCancel}
              tone="error"
            />
            <KpiCard
              label="Scheduled"
              value={String(data.summary.scheduled)}
              hint="Upcoming this week"
              icon={MdTrendingUp}
            />
          </section>

          <section className="grid auto-rows-fr grid-cols-1 gap-5 lg:gap-6 2xl:grid-cols-3">
            <div className="rounded-xl border border-[var(--color-outline-variant)] bg-white p-5 shadow-sm lg:p-6">
              <h2 className="mb-4 font-dm-sans text-title-lg text-[var(--color-on-surface)]">
                Status breakdown
              </h2>
              <ul className="space-y-3">
                {data.byStatus.map((slice) => (
                  <li
                    key={slice.status}
                    className="flex items-center justify-between font-dm-sans text-label-md"
                  >
                    <span className="text-[var(--color-on-surface-variant)]">
                      {slice.label}
                    </span>
                    <span className="font-semibold text-[var(--color-on-surface)]">
                      {slice.count} ({slice.percentage}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <PendingLink
              href="/admin/analytics"
              className="group flex h-full min-h-[220px] flex-col justify-between rounded-xl border border-[var(--color-outline-variant)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md lg:p-6 2xl:col-span-2"
            >
              <div>
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-secondary-container)] text-[var(--color-primary)]">
                  <MdAnalytics size={24} aria-hidden />
                </div>
                <h2 className="font-dm-sans text-title-lg text-[var(--color-on-surface)]">
                  Appointments Summary
                </h2>
                <p className="mt-2 font-literata text-body-md text-[var(--color-on-surface-variant)]">
                  Interactive charts with daily, weekly, and monthly filters.
                  Track workload, volume, and status trends.
                </p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 font-dm-sans text-label-md font-semibold text-[var(--color-primary)] group-hover:underline">
                Open analytics
                <MdArrowForward size={18} aria-hidden />
              </span>
            </PendingLink>
          </section>
        </div>
      ) : null}
    </div>
  );
}
