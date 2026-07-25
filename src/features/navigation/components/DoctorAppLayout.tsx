import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

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

  const roleLabel = session.user.role === "admin" ? "Admin" : "Doctor";

  return (
    <DoctorPortalShell userEmail={session.user.email} roleLabel={roleLabel}>
      {children}
    </DoctorPortalShell>
  );
}
