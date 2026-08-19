"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { DoctorPatientsListResponse } from "@/features/doctor/patients/types/response";
import type { PatientRosterStatusFilter } from "@/features/doctor/patients/types/schemas";

type DoctorPatientsQueryParams = {
  q: string;
  page: number;
  pageSize: number;
  status: PatientRosterStatusFilter;
};

async function fetchDoctorPatients(
  params: DoctorPatientsQueryParams,
): Promise<DoctorPatientsListResponse> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
    status: params.status,
  });

  const trimmed = params.q.trim();
  if (trimmed) {
    searchParams.set("q", trimmed);
  }

  const response = await fetch(`/api/doctor/patients?${searchParams.toString()}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Failed to load patients");
  }

  return response.json() as Promise<DoctorPatientsListResponse>;
}

export function useDoctorPatients(params: DoctorPatientsQueryParams) {
  return useQuery({
    queryKey: [
      "doctorPatients",
      params.q,
      params.page,
      params.pageSize,
      params.status,
    ],
    queryFn: () => fetchDoctorPatients(params),
    placeholderData: keepPreviousData,
  });
}
