import { useCallback, useState } from "react";
import moment from "moment/moment";
import useAppointments from "@/features/doctor/appointments/hooks/use-appointments";
import {
  Appointment,
  Patient,
} from "@/features/doctor/appointments/types/response";
import AppCalendar, { AppCalendarEvent } from "@/components/ui/AppCalendar";
import AppointmentModel from "@/features/doctor/appointments/components/AppointmentModel";

export interface PatientAppointmentsProps {
  doctorId: string;
}

export default function PatientAppointments({
  doctorId,
}: PatientAppointmentsProps) {
  const [isModelOpen, setModelOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(
    moment().startOf("week").toDate(),
  );
  const [endDate, setEndDate] = useState<Date>(moment().endOf("week").toDate());
  const query = useAppointments(doctorId, startDate, endDate);
  const [patientDetails, setPatientDetails] = useState<Patient | null>(null);

  const onRangeChange = useCallback((startDate: Date, endDate: Date) => {
    setStartDate(startDate);
    setEndDate(endDate);
  }, []);

  const toAppointmentEvents = useCallback(
    (appointments: Appointment[] | undefined) =>
      appointments?.map((appointment: Appointment): AppCalendarEvent => ({
        id: appointment.id,
        title: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
        start: new Date(appointment.start),
        end: new Date(appointment.end),
      })),
    [],
  );

  const onAppointmentClick = useCallback(
    (event: AppCalendarEvent) => {
      const appointment = query.data?.find(
        (a: Appointment) => a.id === event.id,
      );
      if (appointment) {
        setPatientDetails(appointment.patient);
        setModelOpen(true);
      }
    },
    [query.data],
  );

  const onClose = useCallback(() => {
    setModelOpen(false);
    setPatientDetails(null);
  }, []);

  return (
    <>
      <AppCalendar
        className="h-[600]"
        isLoading={!query.isFetched}
        events={toAppointmentEvents(query.data)}
        onRangeChange={onRangeChange}
        onEventSelect={onAppointmentClick}
      />
      <AppointmentModel
        patient={patientDetails}
        isModelOpen={isModelOpen}
        onClose={onClose}
      />
    </>
  );
}
