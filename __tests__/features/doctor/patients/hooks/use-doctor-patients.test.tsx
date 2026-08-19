import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { useDoctorPatients } from "@/features/doctor/patients/hooks/use-doctor-patients";

global.fetch = vi.fn();

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe("useDoctorPatients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches patients with query params", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        patients: [],
        pagination: {
          page: 1,
          pageSize: 10,
          total: 0,
          totalPages: 0,
          from: 0,
          to: 0,
        },
        filters: { q: "jane", status: "all" },
      }),
    });

    const { result } = renderHook(
      () =>
        useDoctorPatients({
          q: "jane",
          page: 1,
          pageSize: 10,
          status: "all",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/doctor/patients?page=1&pageSize=10&status=all&q=jane",
    );
  });

  it("surfaces API errors", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Forbidden" }),
    });

    const { result } = renderHook(
      () =>
        useDoctorPatients({
          q: "",
          page: 1,
          pageSize: 10,
          status: "all",
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toEqual(new Error("Forbidden"));
  });
});
