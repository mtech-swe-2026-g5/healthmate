import { compare } from "bcryptjs";

import { DoctorModel, PatientModel, prisma } from "@/lib/prisma";
import { DefaultSession } from "next-auth";

export type AuthenticatedUser = {
  id: string;
  email: string;
  role: string;
  roleId: number;
  doctor: Partial<DoctorModel>;
  patient: Partial<PatientModel>;
} & DefaultSession["user"];

/**
 * Validates email/password against the stored credentials.
 *
 * Returns `null` for every failure mode (unknown email, inactive account,
 * wrong password, role mismatch) so callers can surface a single generic
 * error and never leak which check failed.
 *
 * @param email - Submitted email (case-insensitive).
 * @param password - Plain-text password to verify against the stored hash.
 * @param role - Optional role selected on the login screen; when provided the
 *   user's actual role must match (prevents signing in via the wrong tab).
 */
export async function verifyUserCredentials(
  email: string,
  password: string,
  role?: string,
): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    include: {
      role: true,
      doctor: { select: { id: true, firstName: true, lastName: true } },
      patient: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!user || !user.isActive) return null;

  const isValid = await compare(password, user.passwordHash);
  if (!isValid) return null;

  if (role && user.role.name !== role) return null;
  console.log("user", user);
  return {
    id: user.id,
    email: user.email,
    role: user.role.name,
    roleId: user.roleId,
    doctor: {
      id: user.doctor?.id,
      firstName: user.doctor?.firstName,
      lastName: user.doctor?.lastName,
    },
    patient: {
      id: user.patient?.id,
      firstName: user.patient?.firstName,
      lastName: user.patient?.lastName,
    },
  };
}
