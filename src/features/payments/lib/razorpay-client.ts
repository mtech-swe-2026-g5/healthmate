import Razorpay from "razorpay";

export function getRazorpayClient(): Razorpay {
  const key_id =
    process.env.RAZORPAY_KEY_ID ?? process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay keys are not configured");
  }

  return new Razorpay({ key_id, key_secret });
}

export function getRazorpayKeyId(): string {
  const keyId =
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID;
  if (!keyId) {
    throw new Error("Razorpay key id is not configured");
  }
  return keyId;
}

export function getRazorpayKeySecret(): string {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new Error("Razorpay key secret is not configured");
  }
  return secret;
}

export function getRazorpayWebhookSecret(): string {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("Razorpay webhook secret is not configured");
  }
  return secret;
}
