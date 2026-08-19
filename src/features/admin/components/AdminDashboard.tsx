"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AdminDashboardView } from "./AdminDashboardView";

const queryClient = new QueryClient();

export function AdminDashboard() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminDashboardView />
    </QueryClientProvider>
  );
}
