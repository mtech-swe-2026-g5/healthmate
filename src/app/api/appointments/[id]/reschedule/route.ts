import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { rescheduleAppointment } from "@/features/appointments/services/appointment-transitions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const appointment = await rescheduleAppointment(
      session.user.id,
      session.user.role,
      id,
      body,
    );

    return NextResponse.json({ appointment });
  } catch (error) {
    return handleApiError(error);
  }
}
