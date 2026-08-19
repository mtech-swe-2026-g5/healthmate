"use client";

import { useQuery } from "@tanstack/react-query";

import type { AppointmentGranularity } from "@/features/admin/analytics/types/schemas";
import type { AppointmentsSummaryResponse } from "@/features/admin/analytics/types/response";

async function fetchAppointmentsSummary(
  granularity: AppointmentGranularity,
): Promise<AppointmentsSummaryResponse> {
  const res = await fetch(
    `/api/admin/analytics/appointments-summary?granularity=${granularity}`,
  );
  if (!res.ok) {
    throw new Error("Failed to load appointment analytics");
  }
  return res.json() as Promise<AppointmentsSummaryResponse>;
}

export function useAppointmentsSummary(granularity: AppointmentGranularity) {
  return useQuery({
    queryKey: ["adminAppointmentsSummary", granularity],
    queryFn: () => fetchAppointmentsSummary(granularity),
  });
}
