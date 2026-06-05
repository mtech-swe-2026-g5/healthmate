import { describe, expect, it, vi, beforeEach } from 'vitest';
import { compare } from 'bcryptjs';

import { registerPatient } from '@/features/auth/services/registration';

const VALID_DATA = {
  firstName: 'Jane',
  lastName: 'Smith',
  email: 'jane@example.com',
  password: 'Secure1!pass',
  dateOfBirth: '1990-05-20',
  gender: 'female' as const,
  phoneNumber: '+919876543210',
};

const mockRole = { id: 1, name: 'patient', description: '', createdAt: new Date() };
const mockUser = {
  id: 'uuid-user-1',
  roleId: 1,
  email: 'jane@example.com',
  passwordHash: 'hashed',
  emailVerified: false,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const mockPatient = {
  id: 'uuid-patient-1',
  userId: 'uuid-user-1',
  firstName: 'Jane',
  lastName: 'Smith',
  dateOfBirth: new Date('1990-05-20'),
  gender: 'female',
  phoneNumber: '+919876543210',
  profilePictureUrl: null,
  bloodGroup: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

vi.mock('@/lib/prisma', () => {
  const role = { findUnique: vi.fn() };
  const user = { create: vi.fn() };
  const patient = { create: vi.fn() };

  return {
    prisma: {
      role,
      user,
      patient,
      $transaction: vi.fn(),
    },
  };
});

async function getMockPrisma() {
  const { prisma } = await import('@/lib/prisma');
  return prisma as unknown as {
    role: { findUnique: ReturnType<typeof vi.fn> };
    user: { create: ReturnType<typeof vi.fn> };
    patient: { create: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };
}

describe('registerPatient', () => {
  beforeEach(async () => {
    vi.clearAllMocks();

    const mockPrisma = await getMockPrisma();
    mockPrisma.role.findUnique.mockResolvedValue(mockRole);
    mockPrisma.$transaction.mockImplementation(
      async (fn: (tx: typeof mockPrisma) => Promise<unknown>) => {
        return fn(mockPrisma);
      },
    );
    mockPrisma.user.create.mockResolvedValue(mockUser);
    mockPrisma.patient.create.mockResolvedValue(mockPatient);
  });

  it('should return userId on successful registration', async () => {
    const result = await registerPatient(VALID_DATA);
    expect(result).toEqual({ userId: 'uuid-user-1' });
  });

  it('should hash the password before storing', async () => {
    const mockPrisma = await getMockPrisma();
    await registerPatient(VALID_DATA);

    const createCall = mockPrisma.user.create.mock.calls[0][0];
    const storedHash = createCall.data.passwordHash;

    expect(storedHash).not.toBe(VALID_DATA.password);
    const isMatch = await compare(VALID_DATA.password, storedHash);
    expect(isMatch).toBe(true);
  });

  it('should look up the patient role', async () => {
    const mockPrisma = await getMockPrisma();
    await registerPatient(VALID_DATA);
    expect(mockPrisma.role.findUnique).toHaveBeenCalledWith({
      where: { name: 'patient' },
    });
  });

  it('should use a Prisma transaction for atomic insert', async () => {
    const mockPrisma = await getMockPrisma();
    await registerPatient(VALID_DATA);
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it('should create user with correct fields', async () => {
    const mockPrisma = await getMockPrisma();
    await registerPatient(VALID_DATA);

    const createCall = mockPrisma.user.create.mock.calls[0][0];
    expect(createCall.data.roleId).toBe(mockRole.id);
    expect(createCall.data.email).toBe('jane@example.com');
    expect(createCall.data.emailVerified).toBe(false);
    expect(createCall.data.isActive).toBe(true);
  });

  it('should create patient with correct fields', async () => {
    const mockPrisma = await getMockPrisma();
    await registerPatient(VALID_DATA);

    const createCall = mockPrisma.patient.create.mock.calls[0][0];
    expect(createCall.data.userId).toBe('uuid-user-1');
    expect(createCall.data.firstName).toBe('Jane');
    expect(createCall.data.lastName).toBe('Smith');
    expect(createCall.data.gender).toBe('female');
    expect(createCall.data.phoneNumber).toBe('+919876543210');
    expect(createCall.data.bloodGroup).toBeNull();
  });

  it('should store blood group when provided', async () => {
    const mockPrisma = await getMockPrisma();
    await registerPatient({ ...VALID_DATA, bloodGroup: 'O+' as const });

    const createCall = mockPrisma.patient.create.mock.calls[0][0];
    expect(createCall.data.bloodGroup).toBe('O+');
  });

  it('should lowercase the email before storing', async () => {
    const mockPrisma = await getMockPrisma();
    await registerPatient({ ...VALID_DATA, email: 'JANE@Example.COM' });

    const createCall = mockPrisma.user.create.mock.calls[0][0];
    expect(createCall.data.email).toBe('jane@example.com');
  });

  it('should throw when patient role is not found', async () => {
    const mockPrisma = await getMockPrisma();
    mockPrisma.role.findUnique.mockResolvedValue(null);

    await expect(registerPatient(VALID_DATA)).rejects.toThrow(
      'Patient role not found',
    );
  });

  it('should throw ZodError on invalid input', async () => {
    const { ZodError } = await import('zod');

    await expect(
      registerPatient({ ...VALID_DATA, email: 'bad' }),
    ).rejects.toThrow(ZodError);
  });

  it('should propagate Prisma unique constraint errors', async () => {
    const mockPrisma = await getMockPrisma();
    const { Prisma } = await import('@prisma/client');
    const duplicateError = new Prisma.PrismaClientKnownRequestError(
      'Unique constraint failed',
      { code: 'P2002', clientVersion: '7.0.0', meta: { target: ['email'] } },
    );
    mockPrisma.$transaction.mockRejectedValue(duplicateError);

    await expect(registerPatient(VALID_DATA)).rejects.toThrow(
      Prisma.PrismaClientKnownRequestError,
    );
  });

  it('should roll back transaction on patient create failure', async () => {
    const mockPrisma = await getMockPrisma();
    mockPrisma.$transaction.mockRejectedValue(new Error('patient insert failed'));

    await expect(registerPatient(VALID_DATA)).rejects.toThrow(
      'patient insert failed',
    );
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
