import { NextRequest, NextResponse } from 'next/server';

import { handleApiError } from '@/lib/errors';
import { registerPatient } from '@/features/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await registerPatient(body);
    return NextResponse.json(
      { message: 'Registration successful', userId: result.userId },
      { status: 201 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
