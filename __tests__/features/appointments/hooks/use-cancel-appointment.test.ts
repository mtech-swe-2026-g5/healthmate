import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCancelAppointment } from "@/features/appointments/hooks/use-cancel-appointment";

const mockCancelRequest = vi.fn();

vi.mock("@/features/appointments/services/client", () => ({
  cancelAppointmentRequest: (...args: unknown[]) => mockCancelRequest(...args),
}));

const APPOINTMENT_ID = "a1";

describe("useCancelAppointment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the cancelled appointment on success", async () => {
    mockCancelRequest.mockResolvedValue({
      id: APPOINTMENT_ID,
      status: "CANCELLED",
    });
    const { result } = renderHook(() => useCancelAppointment(APPOINTMENT_ID));

    let cancelled;
    await act(async () => {
      cancelled = await result.current.cancel();
    });

    expect(mockCancelRequest).toHaveBeenCalledWith(APPOINTMENT_ID);
    expect(cancelled).toEqual({ id: APPOINTMENT_ID, status: "CANCELLED" });
    expect(result.current.error).toBeNull();
    expect(result.current.submitting).toBe(false);
  });

  it("surfaces the API message on failure", async () => {
    mockCancelRequest.mockRejectedValue(new Error("Slot already booked"));
    const { result } = renderHook(() => useCancelAppointment(APPOINTMENT_ID));

    let cancelled;
    await act(async () => {
      cancelled = await result.current.cancel();
    });

    expect(cancelled).toBeNull();
    expect(result.current.error).toBe("Slot already booked");
  });

  it("falls back to a generic message for a non-Error rejection", async () => {
    mockCancelRequest.mockRejectedValue("boom");
    const { result } = renderHook(() => useCancelAppointment(APPOINTMENT_ID));

    await act(async () => {
      await result.current.cancel();
    });

    expect(result.current.error).toBe("Failed to cancel appointment");
  });

  it("clears a previous error", async () => {
    mockCancelRequest.mockRejectedValue(new Error("nope"));
    const { result } = renderHook(() => useCancelAppointment(APPOINTMENT_ID));

    await act(async () => {
      await result.current.cancel();
    });
    expect(result.current.error).toBe("nope");

    act(() => {
      result.current.clearError();
    });
    expect(result.current.error).toBeNull();
  });
});
