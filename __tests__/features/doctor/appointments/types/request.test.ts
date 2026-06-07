import {describe, it, expect} from 'vitest';
import {getWeeklyAppointmentsSchema} from '@/features/doctor/appointments/types/request';

describe('getWeeklyAppointmentsSchema', () => {
    const validDoctorId = '550e8400-e29b-41d4-a716-446655440000';

    describe('Valid Inputs', () => {
        it('should validate correct weekly appointment request', () => {
            const data = {
                doctorId: validDoctorId,
                year: 2026,
                week: 23,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should validate week 1 of year', () => {
            const data = {
                doctorId: validDoctorId,
                year: 2026,
                week: 1,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should validate week 52 of year', () => {
            const data = {
                doctorId: validDoctorId,
                year: 2026,
                week: 52,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(true);
        });

        it('should validate year 2000', () => {
            const data = {
                doctorId: validDoctorId,
                year: 2000,
                week: 10,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(true);
        });
    });

    describe('Invalid Doctor ID', () => {
        it('should reject invalid UUID format', () => {
            const data = {
                doctorId: 'not-a-uuid',
                year: 2026,
                week: 23,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should reject missing doctorId', () => {
            const data = {
                year: 2026,
                week: 23,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    describe('Invalid Year', () => {
        it('should reject year before 2000', () => {
            const data = {
                doctorId: validDoctorId,
                year: 1999,
                week: 23,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should reject non-integer year', () => {
            const data = {
                doctorId: validDoctorId,
                year: 2026.5,
                week: 23,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should reject missing year', () => {
            const data = {
                doctorId: validDoctorId,
                week: 23,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    describe('Invalid Week', () => {
        it('should reject week 0', () => {
            const data = {
                doctorId: validDoctorId,
                year: 2026,
                week: 0,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should reject week 54', () => {
            const data = {
                doctorId: validDoctorId,
                year: 2026,
                week: 54,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should reject non-integer week', () => {
            const data = {
                doctorId: validDoctorId,
                year: 2026,
                week: 23.5,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should reject negative week', () => {
            const data = {
                doctorId: validDoctorId,
                year: 2026,
                week: -5,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });

        it('should reject missing week', () => {
            const data = {
                doctorId: validDoctorId,
                year: 2026,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(false);
        });
    });

    describe('Error Details', () => {
        it('should have correct error for invalid week', () => {
            const data = {
                doctorId: validDoctorId,
                year: 2026,
                week: 54,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues.some(issue => issue.path.includes('week'))).toBe(true);
            }
        });

        it('should have correct error for invalid year', () => {
            const data = {
                doctorId: validDoctorId,
                year: 1999,
                week: 23,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues.some(issue => issue.path.includes('year'))).toBe(true);
            }
        });

        it('should have correct error for invalid doctorId', () => {
            const data = {
                doctorId: 'invalid',
                year: 2026,
                week: 23,
            };

            const result = getWeeklyAppointmentsSchema.safeParse(data);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues.some(issue => issue.path.includes('doctorId'))).toBe(true);
            }
        });
    });
});

