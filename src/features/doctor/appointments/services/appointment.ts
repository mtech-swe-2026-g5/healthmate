import {
  Appointment,
  AppointmentsResponse,
} from "@/features/doctor/appointments/types/response";
import {
  GetWeeklyAppointmentsRequest,
  getWeeklyAppointmentsSchema,
} from "@/features/doctor/appointments/types/request";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { shiftCalendarWeek } from "@/lib/calendar-week";

type AppointmentEntity = Prisma.AppointmentGetPayload<{
  include: {
    patient: true;
  };
}>;

export async function getAppointmentsByDoctor(
  request: GetWeeklyAppointmentsRequest,
): Promise<AppointmentsResponse | null> {
  const validatedRequest = getWeeklyAppointmentsSchema.parse(request);
  const appointments = await getAppointmentsFor(validatedRequest);
  const mappedAppointments = mapToResponse(appointments);
  return toHateosResponse(validatedRequest, mappedAppointments);
}

async function getAppointmentsFor(
  validatedRequest: GetWeeklyAppointmentsRequest,
): Promise<AppointmentEntity[]> {
  return prisma.appointment.findMany({
    where: {
      doctorId: validatedRequest.doctorId,
      // Cancelled bookings are retained for audit but must not occupy the
      // doctor's calendar — the slot is free again the moment they cancel.
      status: "CONFIRMED",
      startsAt: {
        gte: validatedRequest.startDate,
        lte: validatedRequest.endDate,
      },
    },
    include: {
      patient: true,
    },
    orderBy: {
      startsAt: "asc",
    },
  });
}

function mapToResponse(appointments: AppointmentEntity[]) {
  return appointments.map((appointment: AppointmentEntity): Appointment => {
    const patientDob = DateTime.fromJSDate(appointment.patient.dateOfBirth);
    const appointmentStart = DateTime.fromJSDate(appointment.startsAt);
    const age = Math.trunc(appointmentStart.diff(patientDob, "years").years);

    return {
      id: appointment.id,
      patient: {
        id: appointment.patient.id,
        firstName: appointment.patient.firstName,
        lastName: appointment.patient.lastName,
        age,
        gender: appointment.patient.gender as never,
        phoneNumber: appointment.patient.phoneNumber as string,
        bloodGroup: appointment.patient.bloodGroup as never,
      },
      start: appointment.startsAt,
      end: appointment.endsAt,
    };
  });
}

function toHateosResponse(
  validatedRequest: GetWeeklyAppointmentsRequest,
  mappedAppointments: Appointment[],
): AppointmentsResponse {
  const currentWeek = DateTime.fromJSDate(validatedRequest.startDate);
  const prevWeek = shiftCalendarWeek(currentWeek, -1);
  const nextWeek = shiftCalendarWeek(currentWeek, 1);

  const baseUrl = `/api/doctor/appointments`;

  return {
    _metadata: {
      links: {
        self: `${baseUrl}?startDate=${validatedRequest.startDate.toISOString()}&endDate=${validatedRequest.endDate.toISOString()}`,
        prevWeek: `${baseUrl}?startDate=${prevWeek.start.toISOString()}&endDate=${prevWeek.end.toISOString()}`,
        nextWeek: `${baseUrl}?startDate=${nextWeek.start.toISOString()}&endDate=${nextWeek.end.toISOString()}`,
      },
    },
    appointments: mappedAppointments,
  };
}
