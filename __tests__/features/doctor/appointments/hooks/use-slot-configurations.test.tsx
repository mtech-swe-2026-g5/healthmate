import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import useSlotConfigurations from "@/features/doctor/appointments/hooks/use-slot-configurations";
import type { SlotConfigurationModel } from "@/lib/prisma";

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

const doctorId = "doctor-123";
const dateFrom = new Date("2026-07-13T00:00:00.000Z");
const dateUntil = new Date("2026-07-19T23:59:59.999Z");

const mockSlotConfiguration: SlotConfigurationModel = {
  id: "slot-1",
  doctorId,
  dayOfWeek: 1,
  startTime: new Date("1970-01-01T09:00:00.000Z"),
  endTime: new Date("1970-01-01T17:00:00.000Z"),
  timezone: "Asia/Kolkata",
  validFrom: new Date("2026-01-01T00:00:00.000Z"),
  validUntil: null,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("useSlotConfigurations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call fetch with the correct query url", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ slots: [] }),
    });

    const { result } = renderHook(
      () => useSlotConfigurations(doctorId, dateFrom, dateUntil),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      `/api/doctor/appointments/slots?doctorId=${doctorId}&dateFrom=${dateFrom.toISOString()}&dateUntil=${dateUntil.toISOString()}`,
    );
  });

  it("should return the slot configurations from the response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ slots: [mockSlotConfiguration] }),
    });

    const { result } = renderHook(
      () => useSlotConfigurations(doctorId, dateFrom, dateUntil),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([mockSlotConfiguration]);
  });

  it("should return an empty array when there are no slot configurations", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ slots: [] }),
    });

    const { result } = renderHook(
      () => useSlotConfigurations(doctorId, dateFrom, dateUntil),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });

  it("should be in a loading state before the fetch resolves", () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}),
    );

    const { result } = renderHook(
      () => useSlotConfigurations(doctorId, dateFrom, dateUntil),
      { wrapper: createWrapper() },
    );

    expect(result.current.isLoading).toBe(true);
  });

  it("should surface an error state when the fetch rejects", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error"),
    );

    const { result } = renderHook(
      () => useSlotConfigurations(doctorId, dateFrom, dateUntil),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(new Error("Network error"));
  });

  it("should refetch when doctorId, dateFrom or dateUntil change", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      json: async () => ({ slots: [mockSlotConfiguration] }),
    });

    const { result, rerender } = renderHook(
      ({ id, from, until }) => useSlotConfigurations(id, from, until),
      {
        wrapper: createWrapper(),
        initialProps: { id: doctorId, from: dateFrom, until: dateUntil },
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(global.fetch).toHaveBeenCalledTimes(1);

    const nextDoctorId = "doctor-456";
    rerender({ id: nextDoctorId, from: dateFrom, until: dateUntil });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));

    expect(global.fetch).toHaveBeenLastCalledWith(
      `/api/doctor/appointments/slots?doctorId=${nextDoctorId}&dateFrom=${dateFrom.toISOString()}&dateUntil=${dateUntil.toISOString()}`,
    );
  });
});
