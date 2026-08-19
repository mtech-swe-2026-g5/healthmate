import { NextRequest, NextResponse } from "next/server";

import { deleteDoctorScheduleBlock } from "@/features/doctor/schedule/services/schedule";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    await deleteDoctorScheduleBlock(
      session.user.id,
      session.user.role,
      id,
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
