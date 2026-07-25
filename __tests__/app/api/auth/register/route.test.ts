import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

import { POST } from '@/app/api/auth/register/route';

const VALID_BODY = {
  firstName: 'Alice',
  lastName: 'Brown',
  email: 'alice@example.com',
  password: 'Secure1!pass',
  dateOfBirth: '1995-03-10',
  gender: 'female',
  phoneNumber: '+919876543210',
};

const mockRegisterPatient = vi.fn();

vi.mock('@/features/auth', () => ({
  registerPatient: (...args: unknown[]) => mockRegisterPatient(...args),
}));

function buildRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 201 on successful registration', async () => {
    mockRegisterPatient.mockResolvedValue({ userId: 'uuid-1' });

    const response = await POST(buildRequest(VALID_BODY));
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.message).toBe('Registration successful');
    expect(json.userId).toBe('uuid-1');
  });

  it('should return 400 on validation failure', async () => {
    const { ZodError } = await import('zod');
    mockRegisterPatient.mockRejectedValue(
      new ZodError([
        {
          code: 'too_small',
          minimum: 8,
          origin: 'string',
          inclusive: true,
          message: 'Password must be at least 8 characters',
          path: ['password'],
        },
      ]),
    );

    const response = await POST(buildRequest({ ...VALID_BODY, password: 'short' }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe('Validation failed');
    expect(json.issues).toBeDefined();
    expect(json.issues.length).toBeGreaterThan(0);
  });

  it('should return 409 on duplicate email', async () => {
    const { Prisma } = await import('@prisma/client');
    mockRegisterPatient.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '7.0.0',
        meta: { target: ['email'] },
      }),
    );

    const response = await POST(buildRequest(VALID_BODY));
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toContain('email');
  });

  it('should return 500 on unexpected error', async () => {
    mockRegisterPatient.mockRejectedValue(new Error('DB connection lost'));

    const response = await POST(buildRequest(VALID_BODY));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe('Internal server error');
  });

  it('should return response with correct content-type', async () => {
    mockRegisterPatient.mockResolvedValue({ userId: 'uuid-1' });

    const response = await POST(buildRequest(VALID_BODY));

    expect(response.headers.get('content-type')).toContain('application/json');
  });
});
