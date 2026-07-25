import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import DoctorDashboard from "@/features/doctor/appointments/components/DoctorDashboard";

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

  return <DoctorDashboard doctorId={doctorId} />;
}
