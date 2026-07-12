import {describe, expect, it} from 'vitest';

import {getWeeklyAppointmentsSchema} from '@/features/doctor/appointments/types/request';

describe('getWeeklyAppointmentsSchema', () => {
    const validDoctorId = '550e8400-e29b-41d4-a716-446655440000';
    const validStartDate = new Date('2026-07-01T00:00:00.000Z');
    const validEndDate = new Date('2026-07-31T23:59:59.999Z');

    it('validates a correct date range request', () => {
        const result = getWeeklyAppointmentsSchema.safeParse({
            doctorId: validDoctorId,
            startDate: validStartDate,
            endDate: validEndDate,
        });

        expect(result.success).toBe(true);
    });

    it('rejects an invalid doctor id', () => {
        const result = getWeeklyAppointmentsSchema.safeParse({
            doctorId: 'not-a-uuid',
            startDate: validStartDate,
            endDate: validEndDate,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.some((issue) => issue.path.includes('doctorId'))).toBe(true);
        }
    });

    it('rejects invalid date formats', () => {
        const result = getWeeklyAppointmentsSchema.safeParse({
            doctorId: validDoctorId,
            startDate: '2026-07-01',
            endDate: '2026-07-31',
        } as never);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.some((issue) => issue.path.includes('startDate'))).toBe(true);
            expect(result.error.issues.some((issue) => issue.path.includes('endDate'))).toBe(true);
        }
    });

    it('rejects a range where startDate is after endDate', () => {
        const result = getWeeklyAppointmentsSchema.safeParse({
            doctorId: validDoctorId,
            startDate: validEndDate,
            endDate: validStartDate,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.some((issue) => issue.path.includes('startDate'))).toBe(true);
            expect(result.error.issues.some((issue) => issue.message.includes('Start date must be before or equal to end date'))).toBe(true);
        }
    });

    it('rejects a missing endDate', () => {
        const result = getWeeklyAppointmentsSchema.safeParse({
            doctorId: validDoctorId,
            startDate: validStartDate,
        } as never);

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues.some((issue) => issue.path.includes('endDate'))).toBe(true);
        }
    });
});

