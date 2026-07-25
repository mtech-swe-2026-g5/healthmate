import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getPatientProfile,
  updatePatientProfile,
} from '@/features/profile/services/profile';

const mockUserFindUnique = vi.fn();
const mockPatientFindUnique = vi.fn();
const mockPatientUpdate = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    patient: {
      findUnique: (...args: unknown[]) => mockPatientFindUnique(...args),
      update: (...args: unknown[]) => mockPatientUpdate(...args),
    },
  },
}));

const PROFILE_ROW = {
  email: 'sarah@example.com',
  emailVerified: true,
  patient: {
    firstName: 'Sarah',
    lastName: 'Jenkins',
    dateOfBirth: new Date('1978-05-12T00:00:00.000Z'),
    gender: 'female',
    phoneNumber: '1555012312',
    bloodGroup: 'A+',
  },
};

describe('getPatientProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-patient roles', async () => {
    await expect(getPatientProfile('u1', 'doctor')).rejects.toThrow('Forbidden');
  });

  it('returns a serialized patient profile', async () => {
    mockUserFindUnique.mockResolvedValue(PROFILE_ROW);

    await expect(getPatientProfile('u1', 'patient')).resolves.toEqual({
      email: 'sarah@example.com',
      emailVerified: true,
      firstName: 'Sarah',
      lastName: 'Jenkins',
      fullName: 'Sarah Jenkins',
      dateOfBirth: '1978-05-12',
      gender: 'female',
      phoneNumber: '1555012312',
      bloodGroup: 'A+',
    });
  });

  it('throws when the patient row is missing', async () => {
    mockUserFindUnique.mockResolvedValue({
      email: 'x@example.com',
      emailVerified: false,
      patient: null,
    });

    await expect(getPatientProfile('u1', 'patient')).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe('updatePatientProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates and returns the refreshed profile', async () => {
    mockPatientFindUnique.mockResolvedValue({ id: 'p1' });
    mockPatientUpdate.mockResolvedValue({});
    mockUserFindUnique.mockResolvedValue({
      ...PROFILE_ROW,
      patient: {
        ...PROFILE_ROW.patient,
        phoneNumber: '1555012399',
      },
    });

    const result = await updatePatientProfile('u1', 'patient', {
      firstName: 'Sarah',
      lastName: 'Jenkins',
      dateOfBirth: '1978-05-12',
      gender: 'female',
      phoneNumber: '1555012399',
      bloodGroup: 'A+',
    });

    expect(mockPatientUpdate).toHaveBeenCalled();
    expect(result.phoneNumber).toBe('1555012399');
  });

  it('rejects invalid phone numbers', async () => {
    await expect(
      updatePatientProfile('u1', 'patient', {
        firstName: 'Sarah',
        lastName: 'Jenkins',
        dateOfBirth: '1978-05-12',
        gender: 'female',
        phoneNumber: 'bad',
        bloodGroup: 'A+',
      }),
    ).rejects.toThrow();
  });
});
