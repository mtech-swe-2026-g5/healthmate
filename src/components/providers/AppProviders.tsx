"use client";

import type { ReactNode } from "react";

import { NavigationBusyProvider } from "@/components/ui/PendingLink";

/** Root client providers that must survive soft navigations across route groups. */
export function AppProviders({ children }: { children: ReactNode }) {
  return <NavigationBusyProvider>{children}</NavigationBusyProvider>;
}
