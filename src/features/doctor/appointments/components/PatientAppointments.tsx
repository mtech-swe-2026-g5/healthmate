"use client";

import { useCallback, useMemo, useState } from "react";
import useAppointments from "@/features/doctor/appointments/hooks/use-appointments";
import useSlotConfigurations from "@/features/doctor/appointments/hooks/use-slot-configurations";
import { initialDoctorWeekRange } from "@/features/doctor/appointments/lib/dashboard-stats";
import { DoctorWeekCalendar } from "@/features/doctor/calendar/components/DoctorWeekCalendar";
import {
  mapAppointmentsToCalendarEvents,
  mapSlotConfigurations,
} from "@/features/doctor/calendar/lib/map-calendar-data";
import type { DoctorCalendarEvent } from "@/features/doctor/calendar/types";
import AppointmentModel from "@/features/doctor/appointments/components/AppointmentModel";
import { Appointment, Patient } from "@/features/doctor/appointments/types/response";

export interface PatientAppointmentsProps {
  doctorId: string;
}

export default function PatientAppointments({
  doctorId,
}: PatientAppointmentsProps) {
  const initialWeek = useMemo(() => initialDoctorWeekRange(), []);
  const [startDate, setStartDate] = useState(initialWeek.start);
  const [endDate, setEndDate] = useState(initialWeek.end);
  const query = useAppointments(doctorId, startDate, endDate);
  const slotQuery = useSlotConfigurations(doctorId, startDate, endDate);
  const [patientDetails, setPatientDetails] = useState<Patient | null>(null);
  const [isModelOpen, setModelOpen] = useState(false);

  const onWeekChange = useCallback((nextStart: Date, nextEnd: Date) => {
    setStartDate(nextStart);
    setEndDate(nextEnd);
  }, []);

  const onEventSelect = useCallback(
    (event: DoctorCalendarEvent) => {
      const appointment = query.data?.find((a: Appointment) => a.id === event.id);
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
      <DoctorWeekCalendar
        weekStart={startDate}
        events={mapAppointmentsToCalendarEvents(query.data)}
        slotConfigurations={mapSlotConfigurations(slotQuery.data)}
        isLoading={!query.isFetched || !slotQuery.isFetched}
        onEventSelect={onEventSelect}
        onWeekChange={onWeekChange}
        showNavigation
      />
      <AppointmentModel
        patient={patientDetails}
        isModelOpen={isModelOpen}
        onClose={onClose}
      />
    </>
  );
}
