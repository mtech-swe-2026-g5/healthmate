import type { Metadata } from "next";
import { redirect, notFound } from "next/navigation";

import { auth } from "@/lib/auth";
import { RescheduleView } from "@/features/appointments/components/RescheduleView";
import { getAppointmentForPatient } from "@/features/appointments/services/appointments";
import { AppError } from "@/lib/errors";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Reschedule appointment — HealthMate",
  description: "Move your appointment to a different date or time.",
};

export default async function RescheduleAppointmentPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  let appointment;
  try {
    appointment = await getAppointmentForPatient(
      session.user.id,
      session.user.role,
      id,
    );
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    if (error instanceof Error && error.message === "Forbidden")
      redirect("/dashboard");
    throw error;
  }

  // Cancelled or inside the cut-off window — the API would refuse the move, so
  // send the patient back to the detail page which explains why.
  if (!appointment.canBeChanged) redirect(`/appointments/${id}`);

  return <RescheduleView appointment={appointment} />;
}
