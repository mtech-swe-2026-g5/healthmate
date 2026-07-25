import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MdEvent } from "react-icons/md";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BookingWizard } from "@/features/appointments/components/BookingWizard";
import { getConsultationFeeInr } from "@/features/payments";

export const metadata: Metadata = {
  title: "Book appointment — HealthMate",
  description: "Select a doctor, choose a slot, and confirm your visit.",
};

export default async function BookAppointmentPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const patient = session.user.id
    ? await prisma.patient.findUnique({
        where: { userId: session.user.id },
        select: { firstName: true, lastName: true },
      })
    : null;

  const patientName = patient
    ? `${patient.firstName} ${patient.lastName}`.trim()
    : null;

  return (
    <>
      <div className="mb-[var(--spacing-hm-lg)] flex flex-wrap items-center justify-between gap-3">
        <p className="font-dm-sans text-label-md text-[var(--color-on-surface-variant)]">
          Book an appointment
        </p>
        <Link
          href="/appointments"
          className="inline-flex items-center gap-1.5 font-dm-sans text-label-md font-bold text-[var(--color-primary)] hover:underline"
        >
          <MdEvent size={18} aria-hidden />
          My appointments
        </Link>
      </div>
      <BookingWizard
        patientEmail={session.user.email}
        patientName={patientName}
        consultationFeeInr={getConsultationFeeInr()}
      />
    </>
  );
}
