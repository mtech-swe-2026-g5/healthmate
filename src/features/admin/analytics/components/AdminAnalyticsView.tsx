"use client";

import { useState } from "react";
import {
  MdCancel,
  MdEventAvailable,
  MdTaskAlt,
  MdTrendingUp,
} from "react-icons/md";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAppointmentsSummary } from "@/features/admin/analytics/hooks/use-appointments-summary";
import type { AppointmentGranularity } from "@/features/admin/analytics/types/schemas";
import { KpiCard } from "@/features/admin/components/KpiCard";

const GRANULARITY_OPTIONS: {
  value: AppointmentGranularity;
  label: string;
}[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

const STATUS_COLORS = {
  scheduled: "var(--color-primary)",
  completed: "var(--color-secondary-fixed-dim)",
  cancelled: "var(--color-error)",
  noShow: "var(--color-tertiary-fixed-dim)",
} as const;

type ChartTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
    payload?: { total?: number; percentage?: number };
  }>;
  label?: string;
};

function StatusTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, item) => sum + (item.value ?? 0), 0);

  return (
    <div className="rounded-lg border border-[var(--color-outline-variant)] bg-white px-3 py-2 shadow-md">
      <p className="mb-1 font-dm-sans text-label-sm font-semibold text-[var(--color-on-surface)]">
        {label}
      </p>
      {payload.map((item) => {
        const count = item.value ?? 0;
        const percentage =
          total > 0 ? Math.round((count / total) * 1000) / 10 : 0;
        return (
          <p
            key={item.name}
            className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]"
          >
            <span
              className="mr-2 inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            {item.name}: {count} ({percentage}%)
          </p>
        );
      })}
      <p className="mt-1 border-t border-[var(--color-outline-variant)]/40 pt-1 font-dm-sans text-label-sm font-semibold text-[var(--color-on-surface)]">
        Total: {total}
      </p>
    </div>
  );
}

function PieTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const count = item?.value ?? 0;
  const percentage = item?.payload?.percentage ?? 0;

  return (
    <div className="rounded-lg border border-[var(--color-outline-variant)] bg-white px-3 py-2 shadow-md">
      <p className="font-dm-sans text-label-sm font-semibold text-[var(--color-on-surface)]">
        {item?.name}
      </p>
      <p className="font-dm-sans text-label-sm text-[var(--color-on-surface-variant)]">
        {count} appointments ({percentage}%)
      </p>
    </div>
  );
}

export function AdminAnalyticsView() {
  const [granularity, setGranularity] =
    useState<AppointmentGranularity>("daily");
  const { data, isLoading, isError } = useAppointmentsSummary(granularity);

  const pieData =
    data?.byStatus
      .filter((slice) => slice.count > 0)
      .map((slice) => ({
        name: slice.label,
        value: slice.count,
        percentage: slice.percentage,
        fill:
          STATUS_COLORS[slice.status as keyof typeof STATUS_COLORS] ??
          STATUS_COLORS.scheduled,
      })) ?? [];

  return (
    <div className="mx-auto w-full px-4 md:px-8 lg:px-12 space-y-8 py-4 lg:space-y-10 lg:py-6">
      <header className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
        <div>
          <h1 className="font-dm-sans text-headline-lg font-semibold text-[var(--color-primary)]">
            Appointments Summary
          </h1>
          <p className="font-literata text-body-md text-[var(--color-on-surface-variant)]">
            Clinic workload and appointment volume insights
          </p>
        </div>

        <div
          className="flex w-full rounded-lg border border-[var(--color-outline-variant)] bg-white p-1.5 sm:inline-flex sm:w-auto"
          role="group"
          aria-label="Time period filter"
        >
          {GRANULARITY_OPTIONS.map((option) => {
            const active = granularity === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setGranularity(option.value)}
                className={`flex-1 rounded-md px-4 py-2 font-dm-sans text-label-md transition-colors sm:flex-none ${
                  active
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container-highest)]"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </header>

      {isLoading ? (
        <p className="font-dm-sans text-body-md text-[var(--color-on-surface-variant)]">
          Loading analytics…
        </p>
      ) : null}

      {isError ? (
        <p className="font-dm-sans text-body-md text-[var(--color-error)]">
          Unable to load appointment analytics. Please try again.
        </p>
      ) : null}

      {data ? (
        <div className="space-y-8 lg:space-y-10">
          <section className="grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6 xl:grid-cols-4">
            <KpiCard
              label="Total Appointments"
              value={String(data.summary.total)}
              hint="In selected period"
              icon={MdEventAvailable}
            />
            <KpiCard
              label="Completion Rate"
              value={`${data.summary.completionRate}%`}
              hint="Confirmed visits in the past"
              icon={MdTaskAlt}
            />
            <KpiCard
              label="Cancellation Rate"
              value={`${data.summary.cancellationRate}%`}
              hint="Cancelled bookings"
              icon={MdCancel}
              tone="error"
            />
            <KpiCard
              label="Scheduled"
              value={String(data.summary.scheduled)}
              hint="Upcoming confirmed visits"
              icon={MdTrendingUp}
            />
          </section>

          <section className="grid auto-rows-fr grid-cols-1 gap-5 lg:gap-6 xl:grid-cols-12">
            <div className="h-full rounded-xl border border-[var(--color-outline-variant)] bg-white p-5 shadow-sm lg:p-6 xl:col-span-8 2xl:col-span-9">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-dm-sans text-title-lg text-[var(--color-on-surface)]">
                  Appointments by Status
                </h2>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(STATUS_COLORS).map(([key, color]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <span className="font-dm-sans text-label-sm capitalize text-[var(--color-on-surface-variant)]">
                        {key === "noShow" ? "No-show" : key}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.series} barCategoryGap="20%">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-outline-variant)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "var(--color-on-surface-variant)", fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<StatusTooltip />} />
                    <Bar
                      dataKey="scheduled"
                      name="Scheduled"
                      stackId="status"
                      fill={STATUS_COLORS.scheduled}
                      radius={[0, 0, 0, 0]}
                    />
                    <Bar
                      dataKey="completed"
                      name="Completed"
                      stackId="status"
                      fill={STATUS_COLORS.completed}
                    />
                    <Bar
                      dataKey="cancelled"
                      name="Cancelled"
                      stackId="status"
                      fill={STATUS_COLORS.cancelled}
                    />
                    <Bar
                      dataKey="noShow"
                      name="No-show"
                      stackId="status"
                      fill={STATUS_COLORS.noShow}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="h-full rounded-xl border border-[var(--color-outline-variant)] bg-white p-5 shadow-sm lg:p-6 xl:col-span-4 2xl:col-span-3">
              <h2 className="mb-6 font-dm-sans text-title-lg text-[var(--color-on-surface)]">
                Status Breakdown
              </h2>
              <div className="mx-auto h-[220px] w-full max-w-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData.length ? pieData : [{ name: "No data", value: 1, fill: "var(--color-surface-container-highest)" }]}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {pieData.map((entry) => (
                        <Cell key={entry.name} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-3">
                {data.byStatus.map((slice) => (
                  <div
                    key={slice.status}
                    className="flex items-center justify-between font-dm-sans text-label-md"
                  >
                    <span className="text-[var(--color-on-surface-variant)]">
                      {slice.label}
                    </span>
                    <span className="font-semibold text-[var(--color-on-surface)]">
                      {slice.count} ({slice.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
