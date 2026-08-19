import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import { AdminPortalShell } from "./AdminPortalShell";

type AdminAppLayoutProps = {
  children: React.ReactNode;
};

/**
 * Server wrapper that loads the session and wraps admin portal pages.
 */
export async function AdminAppLayout({ children }: AdminAppLayoutProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/login");

  const userName =
    session.user.email?.split("@")[0]?.replace(/\./g, " ") ?? "Admin";

  return (
    <AdminPortalShell userEmail={session.user.email} userName={userName}>
      {children}
    </AdminPortalShell>
  );
}
