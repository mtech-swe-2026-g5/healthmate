import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/errors";
import { requireRole } from "@/features/auth/services/permissions";

import {
  updatePatientProfileSchema,
  type PatientProfile,
  type UpdatePatientProfileInput,
} from "../types";

export function assertPatientRole(role: string | undefined): void {
  if (!role) throw new Error("Unauthorized");
  requireRole(role, ["patient"]);
}

/** Serialize a DATE column without local-TZ day shifts. */
function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function serializeProfile(user: {
  email: string;
  emailVerified: boolean;
  patient: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string | null;
    phoneNumber: string | null;
    bloodGroup: string | null;
  } | null;
}): PatientProfile {
  if (!user.patient) {
    throw new AppError("Patient profile not found", 404);
  }

  const { patient } = user;
  return {
    email: user.email,
    emailVerified: user.emailVerified,
    firstName: patient.firstName,
    lastName: patient.lastName,
    fullName: `${patient.firstName} ${patient.lastName}`.trim(),
    dateOfBirth: formatDateOnly(patient.dateOfBirth),
    gender: patient.gender,
    phoneNumber: patient.phoneNumber,
    bloodGroup: patient.bloodGroup,
  };
}

export async function getPatientProfile(
  userId: string,
  role: string | undefined,
): Promise<PatientProfile> {
  assertPatientRole(role);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      emailVerified: true,
      patient: {
        select: {
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phoneNumber: true,
          bloodGroup: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError("Patient profile not found", 404);
  }

  return serializeProfile(user);
}

export async function updatePatientProfile(
  userId: string,
  role: string | undefined,
  input: unknown,
): Promise<PatientProfile> {
  assertPatientRole(role);
  const data: UpdatePatientProfileInput =
    updatePatientProfileSchema.parse(input);

  const patient = await prisma.patient.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!patient) {
    throw new AppError("Patient profile not found", 404);
  }

  await prisma.patient.update({
    where: { userId },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: new Date(data.dateOfBirth),
      gender: data.gender,
      phoneNumber: data.phoneNumber,
      bloodGroup: data.bloodGroup ?? null,
    },
  });

  return getPatientProfile(userId, role);
}
