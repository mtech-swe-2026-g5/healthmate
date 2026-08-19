import { AppointmentStatus, PaymentStatus } from "@prisma/client";
import { DateTime } from "luxon";

import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";
import { prisma } from "@/lib/prisma";

import {
  findBucketForInstant,
  resolvePeriodRange,
} from "../lib/period-range";
import type { AppointmentGranularity } from "../types/schemas";
import type {
  AppointmentMetricKey,
  AppointmentsSeriesPoint,
  AppointmentsStatusSlice,
  AppointmentsSummaryResponse,
  AppointmentsSummaryTotals,
} from "../types/response";

const STATUS_LABELS: Record<AppointmentMetricKey, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  noShow: "No-show",
};

function emptySeriesPoint(label: string): AppointmentsSeriesPoint {
  return {
    label,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
    total: 0,
  };
}

function categorizeStatus(
  status: AppointmentStatus,
  startsAt: Date,
  now: DateTime,
): AppointmentMetricKey {
  if (status === AppointmentStatus.CANCELLED) return "cancelled";
  const start = DateTime.fromJSDate(startsAt, { zone: "utc" }).setZone(
    CLINIC_TIMEZONE,
  );
  if (start > now) return "scheduled";
  return "completed";
}

function withRates(
  totals: Omit<
    AppointmentsSummaryTotals,
    "completionRate" | "cancellationRate"
  >,
): AppointmentsSummaryTotals {
  const completionRate =
    totals.total > 0
      ? Math.round((totals.completed / totals.total) * 1000) / 10
      : 0;
  const cancellationRate =
    totals.total > 0
      ? Math.round((totals.cancelled / totals.total) * 1000) / 10
      : 0;
  return { ...totals, completionRate, cancellationRate };
}

function buildStatusSlices(
  totals: AppointmentsSummaryTotals,
): AppointmentsStatusSlice[] {
  const keys: AppointmentMetricKey[] = [
    "scheduled",
    "completed",
    "cancelled",
    "noShow",
  ];
  return keys.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    count: totals[status],
    percentage:
      totals.total > 0
        ? Math.round((totals[status] / totals.total) * 1000) / 10
        : 0,
  }));
}

/**
 * Aggregated clinic-wide appointment metrics for the admin analytics dashboard.
 * Summary totals and series buckets are derived from the same date-filtered
 * appointment set to keep behavior schema-safe across mapped table names.
 */
export async function getAppointmentsSummary(
  granularity: AppointmentGranularity,
): Promise<AppointmentsSummaryResponse> {
  const period = resolvePeriodRange(granularity);
  const now = DateTime.now().setZone(CLINIC_TIMEZONE);
  const fromUtc = period.from.toUTC().toJSDate();
  const toUtc = period.to.toUTC().toJSDate();

  const [appointments, totalPatients, totalDoctors, totalRevenue] =
    await Promise.all([
      prisma.appointment.findMany({
        where: {
          startsAt: { gte: fromUtc, lt: toUtc },
        },
        select: { status: true, startsAt: true },
        orderBy: { startsAt: "asc" },
      }),
      prisma.patient.count(),
      prisma.doctor.count({ where: { isActive: true } }),
      prisma.payment.aggregate({
        where: { status: PaymentStatus.CAPTURED },
        _sum: { amountInPaise: true },
      }),
    ]);

  const seriesMap = new Map<string, AppointmentsSeriesPoint>(
    period.buckets.map((bucket) => [bucket.key, emptySeriesPoint(bucket.label)]),
  );
  const summaryBase: Omit<
    AppointmentsSummaryTotals,
    "completionRate" | "cancellationRate"
  > = {
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
    noShow: 0,
  };

  for (const appointment of appointments) {
    const metric = categorizeStatus(
      appointment.status,
      appointment.startsAt,
      now,
    );
    summaryBase.total += 1;
    summaryBase[metric] += 1;

    const instant = DateTime.fromJSDate(appointment.startsAt, {
      zone: "utc",
    }).setZone(CLINIC_TIMEZONE);
    const bucket = findBucketForInstant(period.buckets, instant);
    if (!bucket) continue;

    const point = seriesMap.get(bucket.key);
    if (!point) continue;

    point[metric] += 1;
    point.total += 1;
  }
  const summary = withRates(summaryBase);

  return {
    period: {
      granularity,
      from: period.from.toISO()!,
      to: period.to.toISO()!,
    },
    overview: {
      totalPatients,
      totalDoctors,
      totalRevenueInPaise: totalRevenue._sum.amountInPaise ?? 0,
    },
    summary,
    byStatus: buildStatusSlices(summary),
    series: period.buckets.map(
      (bucket) => seriesMap.get(bucket.key) ?? emptySeriesPoint(bucket.label),
    ),
  };
}
