import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import {
  createAppointment,
  listPatientAppointments,
} from '@/features/appointments/services/appointments';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await listPatientAppointments(
      session.user.id,
      session.user.role,
    );
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const appointment = await createAppointment(
      session.user.id,
      session.user.role,
      body,
    );

    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
