"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DoctorPatientDetailView } from "@/features/doctor/patients/components/DoctorPatientDetailView";

const queryClient = new QueryClient();

type DoctorPatientDetailProps = {
  patientId: string;
};

export default function DoctorPatientDetail({
  patientId,
}: DoctorPatientDetailProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <DoctorPatientDetailView patientId={patientId} />
    </QueryClientProvider>
  );
}
