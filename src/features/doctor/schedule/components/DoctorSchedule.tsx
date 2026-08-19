"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { DoctorScheduleView } from "@/features/doctor/schedule/components/DoctorScheduleView";

const queryClient = new QueryClient();

type DoctorScheduleProps = {
  doctorId: string;
};

export default function DoctorSchedule({ doctorId }: DoctorScheduleProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <DoctorScheduleView doctorId={doctorId} />
    </QueryClientProvider>
  );
}
