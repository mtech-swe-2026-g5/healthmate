import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import {getAppointmentsByDoctor} from '@/features/doctor/appointments/services/appointment';
import {GetWeeklyAppointmentsRequest} from '@/features/doctor/appointments/types/request';
import moment from 'moment';
import {
    mockPatient1,
    mockDoctor1,
    mockAppointment1,
    mockPatient2,
    mockDoctor2,
    mockAppointment2
} from "@test/features/doctor/appointments/services/appointment.mock";
import {Prisma} from "@prisma/client";
import {DefaultArgs} from "@prisma/client/runtime/client";

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

import {prisma} from "@/lib/prisma";
import {faker} from "@faker-js/faker/locale/en";


describe('getAppointmentsByDoctor', () => {
    const validRequest: GetWeeklyAppointmentsRequest = {
        doctorId: mockDoctor1.userId,
        year: 2026,
        week: 23,
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
                year: 2026,
                week: 23,
            };
            const result = await getAppointmentsByDoctor(nonExistingRequest);
            expect(result?.appointments).toHaveLength(0);
        });

        it('should filter appointments by request', async () => {
            await getAppointmentsByDoctor(validRequest);
            const startDate = moment().year(validRequest.year).week(validRequest.week).startOf('week').toDate();
            const endDate = moment().year(validRequest.year).week(validRequest.week).endOf('week').toDate();
            expect(prisma.appointment.findMany)
                .toHaveBeenCalledWith(
                    {
                        where: {
                            doctorId: validRequest.doctorId,
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
            expect(result?._metadata.links.self).toContain('week=23');
            expect(result?._metadata.links.self).toContain('year=2026');
        });

        it('should include previous week link in metadata', async () => {
            const result = await getAppointmentsByDoctor(validRequest);
            expect(result?._metadata.links.prevWeek).toBeDefined();
            expect(result?._metadata.links.prevWeek).toContain('/api/doctor/appointments');
            expect(result?._metadata.links.prevWeek).toContain('week=22');
            expect(result?._metadata.links.prevWeek).toContain('year=2026');
        });

        it('should include next week link in metadata', async () => {
            const result = await getAppointmentsByDoctor(validRequest);
            expect(result?._metadata.links.nextWeek).toBeDefined();
            expect(result?._metadata.links.nextWeek).toContain('/api/doctor/appointments');
            expect(result?._metadata.links.nextWeek).toContain('week=24');
            expect(result?._metadata.links.nextWeek).toContain('year=2026');
        });

        it('should handle year rollover for previous week when on week 1', async () => {

            const requestWeek1 = {
                doctorId: mockDoctor1.userId,
                year: 2026,
                week: 1,
            };

            await getAppointmentsByDoctor(requestWeek1);
            const result = await getAppointmentsByDoctor(requestWeek1);
            expect(result?._metadata.links.prevWeek).toContain('year=2025');
            expect(result?._metadata.links.prevWeek).toContain('week=52');
        });

        it('should handle year rollover for next week when on last week of year', async () => {

            const requestWeek53 = {
                doctorId: mockDoctor1.userId,
                year: 2025,
                week: 52,
            };

            const result = await getAppointmentsByDoctor(requestWeek53);

            expect(result?._metadata.links.nextWeek).toContain('year=2026');
        });
    });


    describe('Error handling', () => {
        it('should throw error when database query fails', async () => {
            const errorRequest = {
                doctorId: errorDoctor,
                year: 2025,
                week: 52,
            };
            await expect(getAppointmentsByDoctor(errorRequest)).rejects.toThrow(
                'Database connection failed'
            );
        });

        it('should throw ZodError on invalid request input', async () => {
            const {ZodError} = await import('zod');
            const invalidRequest = {
                doctorId: 'not-a-uuid',
                year: 2026,
                week: 23,
            };

            await expect(getAppointmentsByDoctor(invalidRequest)).rejects.toThrow(ZodError);
        });

        it('should throw ZodError when week is out of range', async () => {
            const {ZodError} = await import('zod');
            const invalidRequest = {
                doctorId: mockDoctor1.userId,
                year: 2026,
                week: 54,
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
                year: 2026,
                week: 23,
            };
            const result = await getAppointmentsByDoctor(request);
            expect(result?.appointments).toHaveLength(1);
            expect(result?.appointments.some(apt => apt.patient.id === mockPatient2.id)).toBe(true);
            expect(result?.appointments.some(apt => apt.patient.id === mockPatient1.id)).toBe(false);
        });
    });
});


