import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { handleRazorpayWebhook } from '@/features/payments/services';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const result = await handleRazorpayWebhook(rawBody, signature);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return handleApiError(error);
  }
}
