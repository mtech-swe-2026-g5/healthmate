import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { cancelAppointment } from "@/features/appointments/services/appointment-transitions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_request: Request, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const appointment = await cancelAppointment(
      session.user.id,
      session.user.role,
      id,
    );

    return NextResponse.json({ appointment });
  } catch (error) {
    return handleApiError(error);
  }
}
