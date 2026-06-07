import {Appointment, AppointmentsResponse} from "@/features/doctor/appointments/types/response";
import {GetWeeklyAppointmentsRequest, getWeeklyAppointmentsSchema} from "@/features/doctor/appointments/types/request";
import {prisma} from "@/lib/prisma";
import {Prisma} from "@prisma/client"
import moment from "moment";

type AppointmentEntity = Prisma.AppointmentGetPayload<{
    include: {
        patient: true
    }
}>


export async function getAppointmentsByDoctor(request: GetWeeklyAppointmentsRequest): Promise<AppointmentsResponse | null> {
    const validatedRequest = getWeeklyAppointmentsSchema.parse(request);
    const appointments = await getAppointmentsFor(validatedRequest);
    const mappedAppointments = mapToResponse(appointments);
    return toHateosResponse(validatedRequest, mappedAppointments);
}

async function getAppointmentsFor(validatedRequest: GetWeeklyAppointmentsRequest): Promise<AppointmentEntity[]> {
    const startDate = moment().year(validatedRequest.year).week(validatedRequest.week).startOf('week').toDate();
    const endDate = moment().year(validatedRequest.year).week(validatedRequest.week).endOf('week').toDate();

    return prisma.appointment.findMany({
        where: {
            doctorId: validatedRequest.doctorId,
            startTime: {
                gte: startDate,
                lt: endDate,
            },
        },
        include: {
            patient: true,
        },
        orderBy: {
            startTime: 'asc',
        },
    });
}

function mapToResponse(appointments: AppointmentEntity[]) {

    return appointments.map((appointment: AppointmentEntity): Appointment => {
        const patientDob = moment(appointment.patient.dateOfBirth);
        const appointmentStart = moment(appointment.startTime);
        const age = appointmentStart.diff(patientDob, 'years');

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
            start: appointment.startTime,
            end: appointment.endTime,
        };
    });
}

function toHateosResponse(validatedRequest: GetWeeklyAppointmentsRequest, mappedAppointments: Appointment[]): AppointmentsResponse {
    const currentWeek = moment().year(validatedRequest.year).week(validatedRequest.week);
    const prevWeek = currentWeek.clone().subtract(1, 'week');
    const nextWeek = currentWeek.clone().add(1, 'week');

    const baseUrl = `/api/doctor/appointments`;

    return {
        _metadata: {
            links: {
                self: `${baseUrl}?year=${validatedRequest.year}&week=${validatedRequest.week}`,
                prevWeek: `${baseUrl}?year=${prevWeek.year()}&week=${prevWeek.week()}`,
                nextWeek: `${baseUrl}?year=${nextWeek.year()}&week=${nextWeek.week()}`,
            },
        },
        appointments: mappedAppointments,
    };
}