"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DoctorPatientsView } from "@/features/doctor/patients/components/DoctorPatientsView";

const queryClient = new QueryClient();

export default function DoctorPatients() {
  return (
    <QueryClientProvider client={queryClient}>
      <DoctorPatientsView />
    </QueryClientProvider>
  );
}
