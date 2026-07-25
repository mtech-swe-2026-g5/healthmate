import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useRegistration } from "@/features/auth/hooks/use-registration";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

global.fetch = vi.fn();

const VALID_DATA = {
  firstName: "John",
  lastName: "Doe",
  email: "john@example.com",
  password: "Secure1!pass",
  confirmPassword: "Secure1!pass",
  dateOfBirth: "2000-01-15",
  gender: "male" as const,
  phoneNumber: "+919876543210",
};

describe("useRegistration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it("should show success toast on 201 response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 201,
      json: async () => ({ message: "ok", userId: "uuid-1" }),
    });

    const { result } = renderHook(() => useRegistration());
    const setFieldError = vi.fn();

    await act(async () => {
      await result.current.submitRegistration(VALID_DATA, setFieldError);
    });

    expect(result.current.toast).toEqual({
      message: "Account created successfully!",
      variant: "success",
    });
  });

  it("should call fetch with correct payload excluding confirmPassword", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 201,
      json: async () => ({ message: "ok", userId: "uuid-1" }),
    });

    const { result } = renderHook(() => useRegistration());
    const setFieldError = vi.fn();

    await act(async () => {
      await result.current.submitRegistration(VALID_DATA, setFieldError);
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: expect.any(String),
    });

    const body = JSON.parse(
      (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body,
    );
    expect(body).not.toHaveProperty("confirmPassword");
    expect(body.firstName).toBe("John");
  });

  it("should redirect to /login after successful registration", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 201,
      json: async () => ({ message: "ok", userId: "uuid-1" }),
    });

    const { result } = renderHook(() => useRegistration());
    const setFieldError = vi.fn();

    await act(async () => {
      await result.current.submitRegistration(VALID_DATA, setFieldError);
    });

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    expect(mockPush).toHaveBeenCalledWith("/login");
  });

  it("should set email error on 409 response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 409,
      json: async () => ({
        error: "An account with this email already exists",
      }),
    });

    const { result } = renderHook(() => useRegistration());
    const setFieldError = vi.fn();

    await act(async () => {
      await result.current.submitRegistration(VALID_DATA, setFieldError);
    });

    expect(setFieldError).toHaveBeenCalledWith("email", {
      message: "An account with this email already exists",
    });
  });

  it("should set field errors on 400 response with issues", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 400,
      json: async () => ({
        error: "Validation failed",
        issues: [
          { path: "email", message: "Invalid email address" },
          { path: "password", message: "Password too short" },
        ],
      }),
    });

    const { result } = renderHook(() => useRegistration());
    const setFieldError = vi.fn();

    await act(async () => {
      await result.current.submitRegistration(VALID_DATA, setFieldError);
    });

    expect(setFieldError).toHaveBeenCalledWith("email", {
      message: "Invalid email address",
    });
    expect(setFieldError).toHaveBeenCalledWith("password", {
      message: "Password too short",
    });
  });

  it("should show error toast on 500 response", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 500,
      json: async () => ({ error: "Internal server error" }),
    });

    const { result } = renderHook(() => useRegistration());
    const setFieldError = vi.fn();

    await act(async () => {
      await result.current.submitRegistration(VALID_DATA, setFieldError);
    });

    expect(result.current.toast).toEqual({
      message: "Internal server error",
      variant: "error",
    });
  });

  it("should show network error toast on fetch failure", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Network error"),
    );

    const { result } = renderHook(() => useRegistration());
    const setFieldError = vi.fn();

    await act(async () => {
      await result.current.submitRegistration(VALID_DATA, setFieldError);
    });

    expect(result.current.toast).toEqual({
      message: "Network error. Please check your connection and try again.",
      variant: "error",
    });
  });

  it("should allow dismissing toast", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      status: 201,
      json: async () => ({ message: "ok", userId: "uuid-1" }),
    });

    const { result } = renderHook(() => useRegistration());
    const setFieldError = vi.fn();

    await act(async () => {
      await result.current.submitRegistration(VALID_DATA, setFieldError);
    });

    expect(result.current.toast).not.toBeNull();

    act(() => {
      result.current.setToast(null);
    });

    expect(result.current.toast).toBeNull();
  });
});
