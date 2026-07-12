import {NextRequest} from 'next/server';
import {beforeEach, describe, expect, it, vi} from 'vitest';

import {GET} from '@/app/api/doctor/appointments/route';

const getAppointmentsByDoctorMock = vi.hoisted(() => vi.fn());

vi.mock('@/features/doctor/appointments/services/appointment', () => ({
    getAppointmentsByDoctor: getAppointmentsByDoctorMock,
}));

vi.mock('@/lib/errors', () => ({
    handleApiError: vi.fn((error) =>
        Response.json({message: error instanceof Error ? error.message : 'Unknown error'}, {status: 500}),
    ),
}));

describe('doctor appointments route', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns 400 when the request params are invalid', async () => {
        const request = new NextRequest(
            'http://localhost/api/doctor/appointments?doctorId=abc&startDate=invalid&endDate=invalid',
        );

        const response = await GET(request);
        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload).toEqual({message: 'Invalid request parameters'});
        expect(getAppointmentsByDoctorMock).not.toHaveBeenCalled();
    });

    it('returns 400 when startDate is missing', async () => {
        const request = new NextRequest(
            'http://localhost/api/doctor/appointments?doctorId=550e8400-e29b-41d4-a716-446655440000&endDate=2026-07-31T23:59:59.999Z',
        );

        const response = await GET(request);
        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload).toEqual({message: 'Invalid request parameters'});
        expect(getAppointmentsByDoctorMock).not.toHaveBeenCalled();
    });

    it('returns 400 when endDate is missing', async () => {
        const request = new NextRequest(
            'http://localhost/api/doctor/appointments?doctorId=550e8400-e29b-41d4-a716-446655440000&startDate=2026-07-01T00:00:00.000Z',
        );

        const response = await GET(request);
        const payload = await response.json();

        expect(response.status).toBe(400);
        expect(payload).toEqual({message: 'Invalid request parameters'});
        expect(getAppointmentsByDoctorMock).not.toHaveBeenCalled();
    });

    it('passes doctorId, startDate, and endDate to the appointment service', async () => {
        const request = new NextRequest(
            'http://localhost/api/doctor/appointments?doctorId=550e8400-e29b-41d4-a716-446655440000&startDate=2026-07-01T00:00:00.000Z&endDate=2026-07-31T23:59:59.999Z',
        );
        getAppointmentsByDoctorMock.mockResolvedValue({
            _metadata: {links: {self: 'self', prevWeek: 'prev', nextWeek: 'next'}},
            appointments: [],
        });

        const response = await GET(request);
        const payload = await response.json();

        expect(getAppointmentsByDoctorMock).toHaveBeenCalledWith({
            doctorId: '550e8400-e29b-41d4-a716-446655440000',
            startDate: new Date('2026-07-01T00:00:00.000Z'),
            endDate: new Date('2026-07-31T23:59:59.999Z'),
        });
        expect(response.status).toBe(200);
        expect(payload).toEqual({
            message: 'Appointments retrieved successfully',
            _metadata: {links: {self: 'self', prevWeek: 'prev', nextWeek: 'next'}},
            appointments: []
        });
    });

    it('returns a 500 response when the appointment service throws', async () => {
        const request = new NextRequest(
            'http://localhost/api/doctor/appointments?doctorId=550e8400-e29b-41d4-a716-446655440000&startDate=2026-07-01T00:00:00.000Z&endDate=2026-07-31T23:59:59.999Z',
        );
        getAppointmentsByDoctorMock.mockRejectedValue(new Error('Database connection failed'));

        const response = await GET(request);
        const payload = await response.json();

        expect(response.status).toBe(500);
        expect(payload).toEqual({message: 'Database connection failed'});
        expect(getAppointmentsByDoctorMock).toHaveBeenCalledTimes(1);
    });
});

