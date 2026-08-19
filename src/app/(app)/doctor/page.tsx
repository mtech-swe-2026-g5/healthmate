import type { Metadata } from "next";
import { redirect } from "next/navigation";

import DoctorDashboard from "@/features/doctor/appointments/components/DoctorDashboard";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Doctor dashboard — HealthMate",
  description: "Your HealthMate doctor portal.",
};

export default async function DoctorDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const doctorId = session.user.doctor?.id;
  if (!doctorId) {
    redirect("/login");
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { firstName: true, lastName: true, specialization: true },
  });

  const doctorName = doctor
    ? `Dr. ${doctor.lastName}`
    : (session.user.email ?? "Doctor");

  return (
    <DoctorDashboard
      doctorId={doctorId}
      doctorName={doctorName}
      specialization={doctor?.specialization ?? "General Physician"}
    />
  );
}
