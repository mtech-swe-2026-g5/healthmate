import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {getAppointmentsByDoctor} from '@/features/doctor/appointments/services/appointment';
import {GetWeeklyAppointmentsRequest} from '@/features/doctor/appointments/types/request';
import {
    mockAppointment1,
    mockAppointment2,
    mockDoctor1,
    mockDoctor2,
    mockPatient1,
    mockPatient2
} from "@test/features/doctor/appointments/services/appointment.mock";
import {Prisma} from "@prisma/client";
import {DefaultArgs} from "@prisma/client/runtime/client";
import {prisma} from "@/lib/prisma";
import {faker} from "@faker-js/faker/locale/en";
import moment from "moment";

const errorDoctor = faker.string.uuid();

vi.mock('@/lib/prisma', () => {
    const appointment = {
        findMany: vi.fn((query: Prisma.AppointmentFindManyArgs<DefaultArgs>) => {
            if (query.where?.doctorId === mockDoctor1.userId) {
                return Promise.resolve([
                    {...mockAppointment1, patient: mockPatient1, doctor: mockDoctor1},
                ]);
            } else if (query.where?.doctorId === mockDoctor2.userId) {
                return Promise.resolve([{...mockAppointment2, patient: mockPatient2, doctor: mockDoctor2}]);
            } else if (query.where?.doctorId === errorDoctor) {
                return Promise.reject(new Error('Database connection failed'));
            } else {
                return Promise.resolve([]);
            }
        })
    };

    return {
        prisma: {
            appointment
        },
    };
});


describe('getAppointmentsByDoctor', () => {
    const validRequest: GetWeeklyAppointmentsRequest = {
        doctorId: mockDoctor1.userId,
        startDate: new Date('2026-06-01T00:00:00.000Z'),
        endDate: new Date('2026-06-30T23:59:59.999Z'),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Data retrieval', () => {

        it('should return empty appointments array when there are no appointments', async () => {
            const nonExistingRequest: GetWeeklyAppointmentsRequest = {
                doctorId: faker.string.uuid(),
                startDate: new Date('2026-06-01T00:00:00.000Z'),
                endDate: new Date('2026-06-30T23:59:59.999Z'),
            };
            const result = await getAppointmentsByDoctor(nonExistingRequest);
            expect(result?.appointments).toHaveLength(0);
        });

        it('should filter appointments by request', async () => {
            await getAppointmentsByDoctor(validRequest);
            expect(prisma.appointment.findMany)
                .toHaveBeenCalledWith(
                    {
                        where: {
                            doctorId: validRequest.doctorId,
                            startTime: {
                                gte: validRequest.startDate,
                                lt: validRequest.endDate,
                            },
                        },
                        include: {
                            patient: true,
                        },
                        orderBy: {
                            startTime: 'asc',
                        }
                    }
                );
        });


    });

    describe('Appointment response formatting', () => {
        it('should map appointment IDs correctly', async () => {

            const result = await getAppointmentsByDoctor(validRequest);
            expect(result?.appointments[0].id).toBe(mockAppointment1.id);
        });

        it('should map patient information correctly', async () => {
            const result = await getAppointmentsByDoctor(validRequest);
            const appointment = result?.appointments[0];
            expect(appointment?.patient.id).toBe(mockPatient1.id);
            expect(appointment?.patient.firstName).toBe('Jane');
            expect(appointment?.patient.lastName).toBe('Smith');
            expect(appointment?.patient.gender).toBe('female');
            expect(appointment?.patient.phoneNumber).toBe('+919876543210');
            expect(appointment?.patient.bloodGroup).toBe('O+');
        });

        it('should calculate patient age correctly from date of birth', async () => {
            const result = await getAppointmentsByDoctor(validRequest);
            const appointment = result?.appointments[0];
            const expectedAge = moment('2026-06-08').diff(moment(mockPatient1.dateOfBirth), 'years');
            expect(appointment?.patient.age).toBe(expectedAge);
        });

        it('should map start and end times to appointment response', async () => {

            const result = await getAppointmentsByDoctor(validRequest);
            const appointment = result?.appointments[0];
            expect(appointment?.start).toStrictEqual(mockAppointment1.startTime);
            expect(appointment?.end).toStrictEqual(mockAppointment1.endTime);
        });


    });

    describe('Metadata links', () => {
        it('should include self link in metadata', async () => {

            const result = await getAppointmentsByDoctor(validRequest);
            expect(result?._metadata.links.self).toBeDefined();
            expect(result?._metadata.links.self).toContain('/api/doctor/appointments');
            expect(result?._metadata.links.self).toContain(`startDate=${validRequest.startDate.toISOString()}`);
            expect(result?._metadata.links.self).toContain(`endDate=${validRequest.endDate.toISOString()}`);
        });

        it('should include previous week link in metadata', async () => {
            const result = await getAppointmentsByDoctor(validRequest);
            expect(result?._metadata.links.prevWeek).toBeDefined();
            expect(result?._metadata.links.prevWeek).toContain('/api/doctor/appointments');
            expect(result?._metadata.links.prevWeek).toContain('startDate=');
            expect(result?._metadata.links.prevWeek).toContain('endDate=');
        });

        it('should include next week link in metadata', async () => {
            const result = await getAppointmentsByDoctor(validRequest);
            expect(result?._metadata.links.nextWeek).toBeDefined();
            expect(result?._metadata.links.nextWeek).toContain('/api/doctor/appointments');
            expect(result?._metadata.links.nextWeek).toContain('startDate=');
            expect(result?._metadata.links.nextWeek).toContain('endDate=');
        });

        it('should handle previous week rollover in metadata', async () => {

            const requestWeek1 = {
                doctorId: mockDoctor1.userId,
                startDate: new Date('2026-01-01T00:00:00.000Z'),
                endDate: new Date('2026-01-07T23:59:59.999Z'),
            };

            await getAppointmentsByDoctor(requestWeek1);
            const result = await getAppointmentsByDoctor(requestWeek1);
            expect(result?._metadata.links.prevWeek).toContain('/api/doctor/appointments');
            expect(result?._metadata.links.prevWeek).toContain('startDate=');
            expect(result?._metadata.links.prevWeek).toContain('endDate=');
        });

        it('should handle next week rollover in metadata', async () => {

            const requestWeek53 = {
                doctorId: mockDoctor1.userId,
                startDate: new Date('2025-12-24T00:00:00.000Z'),
                endDate: new Date('2025-12-31T23:59:59.999Z'),
            };

            const result = await getAppointmentsByDoctor(requestWeek53);

            expect(result?._metadata.links.nextWeek).toContain('/api/doctor/appointments');
            expect(result?._metadata.links.nextWeek).toContain('startDate=');
            expect(result?._metadata.links.nextWeek).toContain('endDate=');
        });
    });


    describe('Error handling', () => {
        it('should throw error when database query fails', async () => {
            const errorRequest = {
                doctorId: errorDoctor,
                startDate: new Date('2026-06-01T00:00:00.000Z'),
                endDate: new Date('2026-06-30T23:59:59.999Z'),
            };
            await expect(getAppointmentsByDoctor(errorRequest)).rejects.toThrow(
                'Database connection failed'
            );
        });

        it('should throw ZodError on invalid request input', async () => {
            const {ZodError} = await import('zod');
            const invalidRequest = {
                doctorId: 'not-a-uuid',
                startDate: new Date('2026-06-01T00:00:00.000Z'),
                endDate: new Date('2026-06-30T23:59:59.999Z'),
            };

            await expect(getAppointmentsByDoctor(invalidRequest)).rejects.toThrow(ZodError);
        });

        it('should throw ZodError when endDate is invalid', async () => {
            const {ZodError} = await import('zod');
            const invalidRequest = {
                doctorId: mockDoctor1.userId,
                startDate: new Date('2026-06-30T23:59:59.999Z'),
                endDate: new Date('2026-06-01T00:00:00.000Z'),
            };

            await expect(getAppointmentsByDoctor(invalidRequest)).rejects.toThrow(ZodError);
        });
    });

    describe('Doctor appointment isolation', () => {
        it('should return only the specified doctor\'s appointments and exclude other doctors\' appointments', async () => {
            const result = await getAppointmentsByDoctor(validRequest);
            expect(result?.appointments).toHaveLength(1);
            expect(result?.appointments.some(apt => apt.patient.id === mockPatient1.id)).toBe(true);
            expect(result?.appointments.some(apt => apt.patient.id === mockPatient2.id)).toBe(false);
        });

        it('should not return any appointments for a different doctor', async () => {

            const request = {
                doctorId: mockDoctor2.userId,
                startDate: new Date('2026-06-01T00:00:00.000Z'),
                endDate: new Date('2026-06-30T23:59:59.999Z'),
            };
            const result = await getAppointmentsByDoctor(request);
            expect(result?.appointments).toHaveLength(1);
            expect(result?.appointments.some(apt => apt.patient.id === mockPatient2.id)).toBe(true);
            expect(result?.appointments.some(apt => apt.patient.id === mockPatient1.id)).toBe(false);
        });
    });
});


