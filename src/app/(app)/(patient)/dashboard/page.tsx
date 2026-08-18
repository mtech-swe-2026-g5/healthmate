import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { listPatientAppointments } from "@/features/appointments/services/appointments";
import { excludeCancelled } from "@/features/appointments/lib/appointment-status";
import { PatientDashboardView } from "@/features/dashboard";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Dashboard — HealthMate",
  description: "Your HealthMate patient dashboard.",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [patient, appointments] = await Promise.all([
    prisma.patient.findUnique({
      where: { userId: session.user.id },
      select: { firstName: true },
    }),
    listPatientAppointments(session.user.id, session.user.role),
  ]);

  const firstName =
    patient?.firstName || session.user.email?.split("@")[0] || "there";

  // The dashboard is a forward-looking view: a cancelled booking is neither an
  // upcoming visit nor a completed one, so it belongs in neither count. It
  // stays visible on the appointments page, which is the history surface.
  return (
    <PatientDashboardView
      firstName={firstName}
      upcoming={excludeCancelled(appointments.upcoming)}
      pastCount={excludeCancelled(appointments.past).length}
    />
  );
}
