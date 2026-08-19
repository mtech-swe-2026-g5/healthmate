import type { AppointmentGranularity } from "./schemas";

export type AppointmentMetricKey =
  "scheduled" | "completed" | "cancelled" | "noShow";

export type AppointmentsSummaryTotals = {
  total: number;
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  completionRate: number;
  cancellationRate: number;
};

export type AppointmentsStatusSlice = {
  status: AppointmentMetricKey;
  label: string;
  count: number;
  percentage: number;
};

export type AppointmentsSeriesPoint = {
  label: string;
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  total: number;
};

export type AppointmentsSummaryResponse = {
  period: {
    granularity: AppointmentGranularity;
    from: string;
    to: string;
  };
  overview: {
    totalPatients: number;
    totalDoctors: number;
    totalRevenueInPaise: number;
  };
  summary: AppointmentsSummaryTotals;
  byStatus: AppointmentsStatusSlice[];
  series: AppointmentsSeriesPoint[];
};
