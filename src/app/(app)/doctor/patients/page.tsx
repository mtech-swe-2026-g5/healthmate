import type { Metadata } from "next";
import { redirect } from "next/navigation";

import DoctorPatients from "@/features/doctor/patients/components/DoctorPatients";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Patients — HealthMate",
  description: "Doctor patient directory.",
};

export default async function DoctorPatientsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const doctorId = session.user.doctor?.id;
  if (!doctorId) redirect("/login");

  return <DoctorPatients />;
}
