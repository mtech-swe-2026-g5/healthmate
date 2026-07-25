import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { AppointmentsList } from "@/features/appointments/components/AppointmentsList";

export const metadata: Metadata = {
  title: "My appointments — HealthMate",
  description: "View upcoming and past appointments.",
};

export default async function AppointmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return <AppointmentsList />;
}
