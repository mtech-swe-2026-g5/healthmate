"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PatientAppointments from "@/features/doctor/appointments/components/PatientAppointments";

const queryClient = new QueryClient();

interface DoctorDashboardProps {
  doctorId: string;
}

export default function DoctorDashboard({ doctorId }: DoctorDashboardProps) {
  console.log(doctorId);
  return (
    <QueryClientProvider client={queryClient}>
      <PatientAppointments doctorId={doctorId} />
    </QueryClientProvider>
  );
}
