import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { useBookingWizard } from "@/features/appointments/hooks/use-booking-wizard";

const mockCreatePaymentOrderRequest = vi.fn();
const mockVerifyPaymentRequest = vi.fn();
const mockOpenRazorpayCheckout = vi.fn();

vi.mock("@/features/payments/services/client", () => ({
  createPaymentOrderRequest: (...args: unknown[]) =>
    mockCreatePaymentOrderRequest(...args),
  verifyPaymentRequest: (...args: unknown[]) =>
    mockVerifyPaymentRequest(...args),
}));

vi.mock("@/features/payments/lib/checkout", () => ({
  openRazorpayCheckout: (...args: unknown[]) =>
    mockOpenRazorpayCheckout(...args),
}));

describe("useBookingWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("preserves selected slot when going back from details", () => {
    const { result } = renderHook(() => useBookingWizard());

    act(() => {
      result.current.selectDoctor({
        id: "d1",
        firstName: "Ananya",
        lastName: "Patel",
        specialization: "General Physician",
      });
    });

    act(() => {
      result.current.selectDate("2026-07-27");
      result.current.selectSlot("14:00", "15:00");
      result.current.goToDetails();
    });

    expect(result.current.state.step).toBe("details");
    expect(result.current.state.startTime).toBe("14:00");

    act(() => {
      result.current.goBackToSlot();
    });

    expect(result.current.state.step).toBe("slot");
    expect(result.current.state.startTime).toBe("14:00");
    expect(result.current.state.date).toBe("2026-07-27");
  });

  it("sets inline details error when reason is empty on goToPayment", () => {
    const { result } = renderHook(() => useBookingWizard());

    act(() => {
      result.current.selectDoctor({
        id: "d1",
        firstName: "Ananya",
        lastName: "Patel",
        specialization: "General Physician",
      });
      result.current.selectDate("2026-07-27");
      result.current.selectSlot("14:00", "15:00");
      result.current.goToDetails();
    });

    act(() => {
      result.current.goToPayment();
    });

    expect(result.current.detailsError).toMatch(/reason for visit/i);
    expect(result.current.state.step).toBe("details");
  });

  it("advances to payment without creating an appointment", () => {
    const { result } = renderHook(() => useBookingWizard());

    act(() => {
      result.current.selectDoctor({
        id: "d1",
        firstName: "Ananya",
        lastName: "Patel",
        specialization: "General Physician",
      });
      result.current.selectDate("2026-07-27");
      result.current.selectSlot("14:00", "15:00");
      result.current.goToDetails();
      result.current.setReason("Checkup");
      result.current.goToPayment();
    });

    expect(result.current.state.step).toBe("payment");
    expect(mockCreatePaymentOrderRequest).not.toHaveBeenCalled();
  });

  it("payAndConfirm verifies payment and moves to confirmed", async () => {
    mockCreatePaymentOrderRequest.mockResolvedValue({
      orderId: "order_1",
      amount: 50000,
      currency: "INR",
      keyId: "rzp_test",
      feeInr: 500,
    });
    mockVerifyPaymentRequest.mockResolvedValue({
      appointment: {
        id: "a1",
        bookingReference: "HM-ABC123",
        startsAt: "2026-07-27T08:30:00.000Z",
        endsAt: "2026-07-27T09:30:00.000Z",
        status: "CONFIRMED",
        reasonForVisit: "Checkup",
        additionalNotes: null,
        doctor: {
          id: "d1",
          firstName: "Ananya",
          lastName: "Patel",
          specialization: "General Physician",
        },
        timing: "upcoming",
      },
      alreadyCaptured: false,
    });
    mockOpenRazorpayCheckout.mockImplementation(
      async (options: {
        handler: (r: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => void;
      }) => {
        options.handler({
          razorpay_order_id: "order_1",
          razorpay_payment_id: "pay_1",
          razorpay_signature: "sig",
        });
      },
    );

    const { result } = renderHook(() => useBookingWizard());

    act(() => {
      result.current.selectDoctor({
        id: "d1",
        firstName: "Ananya",
        lastName: "Patel",
        specialization: "General Physician",
      });
      result.current.selectDate("2026-07-27");
      result.current.selectSlot("14:00", "15:00");
      result.current.goToDetails();
      result.current.setReason("Checkup");
      result.current.goToPayment();
    });

    await act(async () => {
      await result.current.payAndConfirm();
    });

    expect(mockCreatePaymentOrderRequest).toHaveBeenCalled();
    expect(mockVerifyPaymentRequest).toHaveBeenCalled();
    expect(result.current.state.step).toBe("confirmed");
    expect(result.current.state.confirmation?.bookingReference).toBe(
      "HM-ABC123",
    );
  });

  it("payAndConfirm surfaces order creation errors", async () => {
    mockCreatePaymentOrderRequest.mockRejectedValue(
      new Error("Slot already booked"),
    );

    const { result } = renderHook(() => useBookingWizard());

    act(() => {
      result.current.selectDoctor({
        id: "d1",
        firstName: "Ananya",
        lastName: "Patel",
        specialization: "General Physician",
      });
      result.current.selectDate("2026-07-27");
      result.current.selectSlot("14:00", "15:00");
      result.current.goToDetails();
      result.current.setReason("Checkup");
      result.current.goToPayment();
    });

    await act(async () => {
      await result.current.payAndConfirm();
    });

    expect(result.current.submitError).toBe("Slot already booked");
    expect(result.current.state.step).toBe("payment");
  });

  it("payAndConfirm handles checkout dismissal", async () => {
    mockCreatePaymentOrderRequest.mockResolvedValue({
      orderId: "order_1",
      amount: 50000,
      currency: "INR",
      keyId: "rzp_test",
      feeInr: 500,
    });
    mockOpenRazorpayCheckout.mockImplementation(
      async (options: { modal?: { ondismiss?: () => void } }) => {
        options.modal?.ondismiss?.();
      },
    );

    const { result } = renderHook(() => useBookingWizard());

    act(() => {
      result.current.selectDoctor({
        id: "d1",
        firstName: "Ananya",
        lastName: "Patel",
        specialization: "General Physician",
      });
      result.current.selectDate("2026-07-27");
      result.current.selectSlot("14:00", "15:00");
      result.current.goToDetails();
      result.current.setReason("Checkup");
      result.current.goToPayment();
    });

    await act(async () => {
      await result.current.payAndConfirm();
    });

    expect(result.current.submitError).toMatch(/cancelled/i);
  });

  it("can go back from payment to details", () => {
    const { result } = renderHook(() => useBookingWizard());

    act(() => {
      result.current.selectDoctor({
        id: "d1",
        firstName: "Ananya",
        lastName: "Patel",
        specialization: "General Physician",
      });
      result.current.selectDate("2026-07-27");
      result.current.selectSlot("14:00", "15:00");
      result.current.goToDetails();
      result.current.setReason("Checkup");
      result.current.goToPayment();
      result.current.goBackToDetails();
    });

    expect(result.current.state.step).toBe("details");
  });
});
