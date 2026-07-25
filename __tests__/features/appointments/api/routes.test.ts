import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from '@/app/api/doctors/route';
import { GET as GET_SLOTS } from '@/app/api/doctors/[id]/slots/route';
import { GET as GET_APPOINTMENTS, POST } from '@/app/api/appointments/route';
import { GET as GET_APPOINTMENT } from '@/app/api/appointments/[id]/route';

const mockAuth = vi.fn();
const mockListActiveDoctors = vi.fn();
const mockGenerateSlots = vi.fn();
const mockCreateAppointment = vi.fn();
const mockListPatientAppointments = vi.fn();
const mockGetAppointmentForPatient = vi.fn();

vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

vi.mock('@/features/appointments/services/doctors', () => ({
  listActiveDoctors: (...args: unknown[]) => mockListActiveDoctors(...args),
}));

vi.mock('@/features/appointments/services/slots', () => ({
  generateSlots: (...args: unknown[]) => mockGenerateSlots(...args),
}));

vi.mock('@/features/appointments/services/appointments', () => ({
  createAppointment: (...args: unknown[]) => mockCreateAppointment(...args),
  listPatientAppointments: (...args: unknown[]) =>
    mockListPatientAppointments(...args),
  getAppointmentForPatient: (...args: unknown[]) =>
    mockGetAppointmentForPatient(...args),
}));

describe('GET /api/doctors', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'patient' },
    });
  });

  it('returns doctors list', async () => {
    mockListActiveDoctors.mockResolvedValue([
      {
        id: 'd1',
        firstName: 'Ananya',
        lastName: 'Patel',
        specialization: 'General Physician',
      },
    ]);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.doctors).toHaveLength(1);
    expect(json.doctors[0].specialization).toBe('General Physician');
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });
});

describe('GET /api/doctors/[id]/slots', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'patient' },
    });
  });

  it('returns slots for a valid date', async () => {
    mockGenerateSlots.mockResolvedValue([
      { startTime: '11:00', endTime: '12:00', status: 'available' },
      { startTime: '12:00', endTime: '13:00', status: 'booked' },
    ]);

    const request = new NextRequest(
      'http://localhost:3000/api/doctors/d1/slots?date=2026-07-27',
    );
    const response = await GET_SLOTS(request, {
      params: Promise.resolve({ id: 'd1' }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.slots[1].status).toBe('booked');
  });

  it('returns 400 for invalid date', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/doctors/d1/slots?date=bad',
    );
    const response = await GET_SLOTS(request, {
      params: Promise.resolve({ id: 'd1' }),
    });
    expect(response.status).toBe(400);
  });
});

describe('POST /api/appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'patient' },
    });
  });

  it('returns 201 on success', async () => {
    mockCreateAppointment.mockResolvedValue({
      id: 'a1',
      bookingReference: 'HM-ABC123',
      startsAt: '2026-07-27T08:30:00.000Z',
      endsAt: '2026-07-27T09:30:00.000Z',
      status: 'CONFIRMED',
      reasonForVisit: 'Checkup',
      additionalNotes: null,
      doctor: {
        id: 'd1',
        firstName: 'Ananya',
        lastName: 'Patel',
        specialization: 'General Physician',
      },
      timing: 'upcoming',
    });

    const request = new NextRequest('http://localhost:3000/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctorId: '11111111-1111-4111-8111-111111111111',
        date: '2026-07-27',
        startTime: '14:00',
        reasonForVisit: 'Checkup',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.appointment.bookingReference).toBe('HM-ABC123');
  });

  it('returns 409 when slot already booked', async () => {
    const { AppError } = await import('@/lib/errors');
    mockCreateAppointment.mockRejectedValue(
      new AppError('Slot already booked', 409),
    );

    const request = new NextRequest('http://localhost:3000/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctorId: '11111111-1111-4111-8111-111111111111',
        date: '2026-07-27',
        startTime: '14:00',
        reasonForVisit: 'Checkup',
      }),
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe('Slot already booked');
  });

  it('returns 400 on validation failure', async () => {
    const { ZodError } = await import('zod');
    mockCreateAppointment.mockRejectedValue(
      new ZodError([
        {
          code: 'too_small',
          minimum: 1,
          origin: 'string',
          inclusive: true,
          message: 'Reason for visit is required',
          path: ['reasonForVisit'],
        },
      ]),
    );

    const request = new NextRequest('http://localhost:3000/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        doctorId: '11111111-1111-4111-8111-111111111111',
        date: '2026-07-27',
        startTime: '14:00',
        reasonForVisit: '',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });
});

describe('GET /api/appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'patient' },
    });
  });

  it('returns upcoming and past lists', async () => {
    mockListPatientAppointments.mockResolvedValue({
      upcoming: [{ id: 'a1' }],
      past: [{ id: 'a2' }],
    });

    const response = await GET_APPOINTMENTS();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.upcoming).toHaveLength(1);
    expect(json.past).toHaveLength(1);
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);
    const response = await GET_APPOINTMENTS();
    expect(response.status).toBe(401);
  });
});

describe('GET /api/appointments/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', role: 'patient' },
    });
  });

  it('returns appointment details', async () => {
    mockGetAppointmentForPatient.mockResolvedValue({
      id: 'a1',
      bookingReference: 'HM-ABC123',
    });

    const response = await GET_APPOINTMENT(new Request('http://localhost'), {
      params: Promise.resolve({ id: 'a1' }),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.appointment.bookingReference).toBe('HM-ABC123');
  });
});
