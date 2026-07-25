import { useCallback, useState } from "react";
import { DateTime } from "luxon";
import useAppointments from "@/features/doctor/appointments/hooks/use-appointments";
import useSlotConfigurations from "@/features/doctor/appointments/hooks/use-slot-configurations";
import {
  Appointment,
  Patient,
} from "@/features/doctor/appointments/types/response";
import AppCalendar, {
  AppCalendarEvent,
  AppCalendarSlotConfiguration,
} from "@/components/ui/AppCalendar";
import AppointmentModel from "@/features/doctor/appointments/components/AppointmentModel";
import { SlotConfigurationModel } from "@/lib/prisma";

export interface PatientAppointmentsProps {
  doctorId: string;
}

export default function PatientAppointments({
  doctorId,
}: PatientAppointmentsProps) {
  const [isModelOpen, setModelOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date>(
    DateTime.now().startOf("week").toJSDate(),
  );
  const [endDate, setEndDate] = useState<Date>(
    DateTime.now().endOf("week").toJSDate(),
  );
  const query = useAppointments(doctorId, startDate, endDate);
  const slotQuery = useSlotConfigurations(doctorId, startDate, endDate);
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

  const toSlotConfigurations = useCallback(
    (
      slots: Partial<SlotConfigurationModel>[] | undefined,
    ): AppCalendarSlotConfiguration[] | undefined =>
      slots?.map((slot): AppCalendarSlotConfiguration => ({
        dayOfWeek: slot.dayOfWeek as number,
        startTime: new Date(slot.startTime as Date),
        endTime: new Date(slot.endTime as Date),
        timezone: slot.timezone as string,
        validFrom: slot.validFrom ? new Date(slot.validFrom) : undefined,
        validUntil: slot.validUntil ? new Date(slot.validUntil) : null,
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
        isLoading={!query.isFetched || !slotQuery.isFetched}
        events={toAppointmentEvents(query.data)}
        slotConfigurations={toSlotConfigurations(slotQuery.data)}
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
