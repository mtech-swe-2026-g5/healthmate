import { NextResponse } from 'next/server';

import { auth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { getAppointmentForPatient } from '@/features/appointments/services/appointments';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await context.params;
    const appointment = await getAppointmentForPatient(
      session.user.id,
      session.user.role,
      id,
    );

    return NextResponse.json({ appointment });
  } catch (error) {
    return handleApiError(error);
  }
}
