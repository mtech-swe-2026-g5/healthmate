import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "crypto";

import { POST as createOrder } from "@/app/api/payments/create-order/route";
import { POST as verifyPayment } from "@/app/api/payments/verify/route";

const mockAuth = vi.fn();
const mockCreatePaymentOrder = vi.fn();
const mockVerifyAndCompletePayment = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/features/payments/services", () => ({
  createPaymentOrder: (...args: unknown[]) => mockCreatePaymentOrder(...args),
  verifyAndCompletePayment: (...args: unknown[]) =>
    mockVerifyAndCompletePayment(...args),
}));

describe("/api/payments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("create-order returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new Request("http://localhost/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await createOrder(req as never);
    expect(res.status).toBe(401);
  });

  it("create-order returns order payload for a patient", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "patient" } });
    mockCreatePaymentOrder.mockResolvedValue({
      orderId: "order_1",
      amount: 50000,
      currency: "INR",
      keyId: "rzp_test",
      feeInr: 500,
    });

    const req = new Request("http://localhost/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        doctorId: "11111111-1111-1111-1111-111111111111",
        date: "2026-07-27",
        startTime: "14:00",
        reasonForVisit: "Checkup",
      }),
    });

    const res = await createOrder(req as never);
    const body = await res.json();
    expect(res.status).toBe(201);
    expect(body.orderId).toBe("order_1");
    expect(mockCreatePaymentOrder).toHaveBeenCalledWith(
      "u1",
      "patient",
      expect.any(Object),
    );
  });

  it("verify rejects unauthenticated callers", async () => {
    mockAuth.mockResolvedValue(null);
    const req = new Request("http://localhost/api/payments/verify", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await verifyPayment(req as never);
    expect(res.status).toBe(401);
  });

  it("verify returns appointment on success", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "patient" } });
    mockVerifyAndCompletePayment.mockResolvedValue({
      appointment: { id: "a1", bookingReference: "HM-1" },
      alreadyCaptured: false,
    });

    const signature = createHmac("sha256", "secret")
      .update("order_1|pay_1")
      .digest("hex");

    const req = new Request("http://localhost/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: "order_1",
        razorpay_payment_id: "pay_1",
        razorpay_signature: signature,
      }),
    });

    const res = await verifyPayment(req as never);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.appointment.bookingReference).toBe("HM-1");
  });
});
