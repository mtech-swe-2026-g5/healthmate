import { prisma } from "@/lib/prisma";

import type { DoctorListItem } from "../types/doctor";

export type { DoctorListItem } from "../types/doctor";

export async function listActiveDoctors(): Promise<DoctorListItem[]> {
  const doctors = await prisma.doctor.findMany({
    where: { isActive: true, acceptingNewPatients: true },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      specialization: true,
    },
  });

  return doctors;
}

export async function getActiveDoctor(doctorId: string) {
  return prisma.doctor.findFirst({
    where: { id: doctorId, isActive: true },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      specialization: true,
    },
  });
}
