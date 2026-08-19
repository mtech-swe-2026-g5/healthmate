import type { Metadata } from "next";
import { redirect } from "next/navigation";

import DoctorSchedule from "@/features/doctor/schedule/components/DoctorSchedule";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Schedule — HealthMate",
  description: "Manage your clinic schedule and availability.",
};

export default async function DoctorSchedulePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const doctorId = session.user.doctor?.id;
  if (!doctorId) redirect("/login");

  return <DoctorSchedule doctorId={doctorId} />;
}
