import { useQuery } from "@tanstack/react-query";
import { Appointment } from "@/features/doctor/appointments/types/response";
import { asInstant } from "@/features/doctor/appointments/lib/dashboard-stats";

export default function useAppointments(
  doctorId: string,
  startDate: Date,
  endDate: Date,
) {
  return useQuery({
    queryKey: ["doctorAppointment", doctorId, startDate.toISOString(), endDate.toISOString()],
    queryFn: () => queryAppointments(doctorId, startDate, endDate),
  });
}

async function queryAppointments(
  doctorId: string,
  startDate: Date,
  endDate: Date,
): Promise<Appointment[]> {
  const res = await fetch(
    `/api/doctor/appointments?doctorId=${doctorId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`,
  );
  const data = (await res.json()) as { appointments?: Appointment[] };
  return (data.appointments ?? []).map((appointment) => ({
    ...appointment,
    start: asInstant(appointment.start),
    end: asInstant(appointment.end),
  }));
}
