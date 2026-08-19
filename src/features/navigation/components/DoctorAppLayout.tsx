import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { DoctorPortalShell } from "./DoctorPortalShell";

type DoctorAppLayoutProps = {
  children: React.ReactNode;
};

/**
 * Server wrapper that loads the session and wraps doctor portal pages.
 */
export async function DoctorAppLayout({ children }: DoctorAppLayoutProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const roleLabel = "Doctor";

  const doctorProfile = session.user.doctor?.id
    ? await prisma.doctor.findUnique({
        where: { id: session.user.doctor.id },
        select: { firstName: true, lastName: true, specialization: true },
      })
    : null;

  const userName = doctorProfile
    ? `Dr. ${doctorProfile.lastName}`
    : session.user.email;

  return (
    <DoctorPortalShell
      userEmail={session.user.email}
      userName={userName}
      roleLabel={doctorProfile?.specialization ?? roleLabel}
    >
      {children}
    </DoctorPortalShell>
  );
}
