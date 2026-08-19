"use client";

import { useQuery } from "@tanstack/react-query";

import type { DoctorPatientDetail } from "@/features/doctor/patients/types/response";

async function fetchDoctorPatientDetail(
  patientId: string,
): Promise<DoctorPatientDetail> {
  const response = await fetch(`/api/doctor/patients/${patientId}`);
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "Failed to load patient");
  }
  return response.json() as Promise<DoctorPatientDetail>;
}

export function useDoctorPatientDetail(patientId: string) {
  return useQuery({
    queryKey: ["doctorPatientDetail", patientId],
    queryFn: () => fetchDoctorPatientDetail(patientId),
  });
}
