import { hash } from 'bcryptjs';

import { prisma } from '@/lib/prisma';

import { registrationApiSchema } from '../types';
import type { RegistrationApiInput } from '../types';

export const BCRYPT_SALT_ROUNDS = 10;

export async function registerPatient(data: RegistrationApiInput) {
  const validated = registrationApiSchema.parse(data);

  const passwordHash = await hash(validated.password, BCRYPT_SALT_ROUNDS);

  const patientRole = await prisma.role.findUnique({
    where: { name: 'patient' },
  });

  if (!patientRole) {
    throw new Error('Patient role not found. Run database seed first.');
  }

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        roleId: patientRole.id,
        email: validated.email.toLowerCase(),
        passwordHash,
        emailVerified: false,
        isActive: true,
      },
    });

    await tx.patient.create({
      data: {
        userId: user.id,
        firstName: validated.firstName,
        lastName: validated.lastName,
        dateOfBirth: new Date(validated.dateOfBirth),
        gender: validated.gender,
        phoneNumber: validated.phoneNumber,
        bloodGroup: validated.bloodGroup ?? null,
      },
    });

    return { userId: user.id };
  });

  return result;
}
