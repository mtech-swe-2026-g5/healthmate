import type { Metadata } from "next";
import { redirect } from "next/navigation";

import DoctorPatientDetail from "@/features/doctor/patients/components/DoctorPatientDetail";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Patient Detail — HealthMate",
  description: "Doctor patient profile and visit history.",
};

type DoctorPatientDetailPageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function DoctorPatientDetailPage({
  params,
}: DoctorPatientDetailPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const doctorId = session.user.doctor?.id;
  if (!doctorId) redirect("/login");

  const { patientId } = await params;

  return <DoctorPatientDetail patientId={patientId} />;
}
