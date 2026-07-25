import { createHmac } from "crypto";
import { describe, expect, it } from "vitest";

import {
  getConsultationFeeInr,
  inrToPaise,
  paiseToInr,
} from "@/features/payments/lib/fee";
import {
  verifyPaymentSignature,
  verifyWebhookSignature,
} from "@/features/payments/lib/signature";

describe("fee helpers", () => {
  it("converts INR to paise and back", () => {
    expect(inrToPaise(500)).toBe(50000);
    expect(paiseToInr(50000)).toBe(500);
  });

  it("defaults consultation fee when env is missing or invalid", () => {
    const prev = process.env.CONSULTATION_FEE_INR;
    delete process.env.CONSULTATION_FEE_INR;
    expect(getConsultationFeeInr()).toBe(500);
    process.env.CONSULTATION_FEE_INR = "0";
    expect(getConsultationFeeInr()).toBe(500);
    process.env.CONSULTATION_FEE_INR = "750";
    expect(getConsultationFeeInr()).toBe(750);
    if (prev === undefined) delete process.env.CONSULTATION_FEE_INR;
    else process.env.CONSULTATION_FEE_INR = prev;
  });
});

describe("verifyPaymentSignature", () => {
  it("accepts a valid HMAC signature", () => {
    const secret = "test_secret";
    const orderId = "order_1";
    const paymentId = "pay_1";
    const signature = createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");

    expect(verifyPaymentSignature(orderId, paymentId, signature, secret)).toBe(
      true,
    );
  });

  it("rejects a tampered signature", () => {
    expect(
      verifyPaymentSignature("order_1", "pay_1", "deadbeef", "test_secret"),
    ).toBe(false);
  });
});

describe("verifyWebhookSignature", () => {
  it("accepts a valid webhook HMAC", () => {
    const secret = "whsec";
    const body = '{"event":"payment.captured"}';
    const signature = createHmac("sha256", secret).update(body).digest("hex");
    expect(verifyWebhookSignature(body, signature, secret)).toBe(true);
  });
});
