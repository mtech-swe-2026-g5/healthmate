import type { AppointmentConfirmation } from '@/features/appointments/services/client';

async function readJson<T>(response: Response): Promise<T> {
  const json = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    const message =
      typeof json === 'object' && json && 'error' in json && json.error
        ? String(json.error)
        : 'Request failed';
    throw new Error(message);
  }
  return json;
}

export type CreateOrderResponse = {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  feeInr: number;
};

export async function createPaymentOrderRequest(body: {
  doctorId: string;
  date: string;
  startTime: string;
  reasonForVisit: string;
  additionalNotes?: string;
}): Promise<CreateOrderResponse> {
  const response = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return readJson<CreateOrderResponse>(response);
}

export async function verifyPaymentRequest(body: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ appointment: AppointmentConfirmation; alreadyCaptured: boolean }> {
  const response = await fetch('/api/payments/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return readJson(response);
}
