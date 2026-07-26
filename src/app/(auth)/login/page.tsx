import { Suspense } from "react";
import type { Metadata } from "next";

import { PageLoading } from "@/components/ui/PageLoading";
import { LoginForm } from "@/features/auth";

export const metadata: Metadata = {
  title: "Log In — HealthMate",
  description: "Log in to your HealthMate account.",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={<PageLoading label="Loading sign-in…" variant="form" />}
    >
      <LoginForm />
    </Suspense>
  );
}
