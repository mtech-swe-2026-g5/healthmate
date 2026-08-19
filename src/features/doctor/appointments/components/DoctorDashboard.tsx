"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DoctorDashboardView } from "@/features/doctor/appointments/components/DoctorDashboardView";

const queryClient = new QueryClient();

export type DoctorDashboardProps = {
  doctorId: string;
  doctorName: string;
  specialization: string;
};

export default function DoctorDashboard({
  doctorId,
  doctorName,
  specialization,
}: DoctorDashboardProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <DoctorDashboardView
        doctorId={doctorId}
        doctorName={doctorName}
        specialization={specialization}
      />
    </QueryClientProvider>
  );
}
