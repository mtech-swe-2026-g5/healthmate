import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { MarketingNav } from "@/features/marketing";
import ComingSoon from "@/features/auth/components/ComingSoon";
import DoctorDashboard from "@/features/doctor/appointments/components/DoctorDashboard";

export const metadata: Metadata = {
  title: "Dashboard — HealthMate",
  description: "Your HealthMate dashboard.",
};

export default async function DashboardPage() {
  const session = await auth();

  // Defence in depth: middleware already guards this route, but server
  // components must re-check the session before rendering protected UI.
  if (!session?.user) redirect("/login");

  const { email, role } = session.user;

  return (
    <div className="auth-body-bg min-h-screen">
      {/* Reuse the platform navbar for consistency (Dashboard + Log out). */}
      <MarketingNav isLoggedIn />

      <main className="mx-auto max-w-[800px] px-[var(--spacing-hm-lg)] py-[var(--spacing-hm-xxl)]">
        {role === "doctor" ? (
          <DoctorDashboard doctorId={session.user.doctor!.id as string} />
        ) : (
          <ComingSoon role={role} email={email} />
        )}
      </main>
    </div>
  );
}
