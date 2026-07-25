import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { createPaymentOrder } from '@/features/payments/services';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const order = await createPaymentOrder(
      session.user.id,
      session.user.role,
      body,
    );
    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
