import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { PatientPortalShell } from "./PatientPortalShell";

type PatientAppLayoutProps = {
  children: React.ReactNode;
};

/**
 * Server wrapper that loads the session and wraps patient portal pages.
 */
export async function PatientAppLayout({ children }: PatientAppLayoutProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const patient = session.user.id
    ? await prisma.patient.findUnique({
        where: { userId: session.user.id },
        select: { firstName: true, lastName: true },
      })
    : null;

  const userName = patient
    ? `${patient.firstName} ${patient.lastName}`.trim()
    : null;

  return (
    <PatientPortalShell userEmail={session.user.email} userName={userName}>
      {children}
    </PatientPortalShell>
  );
}
