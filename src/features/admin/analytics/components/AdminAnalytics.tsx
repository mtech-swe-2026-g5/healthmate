"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { AdminAnalyticsView } from "./AdminAnalyticsView";

const queryClient = new QueryClient();

export function AdminAnalytics() {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAnalyticsView />
    </QueryClientProvider>
  );
}
