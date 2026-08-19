"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type {
  DoctorScheduleResponse,
  UpdateScheduleSettingsInput,
} from "@/features/doctor/schedule/types/schemas";

async function fetchSchedule(): Promise<DoctorScheduleResponse> {
  const res = await fetch("/api/doctor/schedule");
  if (!res.ok) throw new Error("Failed to load schedule");
  return res.json() as Promise<DoctorScheduleResponse>;
}

export function useDoctorSchedule() {
  return useQuery({
    queryKey: ["doctorSchedule"],
    queryFn: fetchSchedule,
  });
}

export function useUpdateDoctorSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateScheduleSettingsInput) => {
      const res = await fetch("/api/doctor/schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Failed to save schedule");
      }
      return res.json() as Promise<DoctorScheduleResponse>;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["doctorSchedule"], data);
      queryClient.invalidateQueries({ queryKey: ["doctorSlotConfigurations"] });
    },
  });
}

export function useCreateScheduleBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      dateFrom: string;
      dateTo: string;
      reason: string;
    }) => {
      const res = await fetch("/api/doctor/schedule/blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Failed to create closed dates");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorSchedule"] });
      queryClient.invalidateQueries({ queryKey: ["doctorSlotConfigurations"] });
      queryClient.invalidateQueries({ queryKey: ["doctorAppointments"] });
    },
  });
}

export function useDeleteScheduleBlock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (blockId: string) => {
      const res = await fetch(`/api/doctor/schedule/blocks/${blockId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete block");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorSchedule"] });
      queryClient.invalidateQueries({ queryKey: ["doctorSlotConfigurations"] });
    },
  });
}
