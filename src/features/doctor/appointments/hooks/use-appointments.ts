import {useQuery} from "@tanstack/react-query";
import {Appointment} from "@/features/doctor/appointments/types/response";

export default function useAppointments(doctorId: string, startDate: Date, endDate: Date) {
    return useQuery({
        queryKey: ['doctorAppointment', doctorId, startDate, endDate],
        queryFn: () => queryAppointments(doctorId, startDate, endDate)

    });


    async function queryAppointments(doctorId: string, startDate: Date, endDate: Date): Promise<Appointment[]> {
        const res = await fetch(`/api/doctor/appointments?doctorId=${doctorId}&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`);
        const data = await res.json() as { appointments: Appointment[]; };
        return data.appointments;
    }
}