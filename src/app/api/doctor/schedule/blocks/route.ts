import { NextRequest, NextResponse } from "next/server";

import { createDoctorScheduleBlock } from "@/features/doctor/schedule/services/schedule";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const block = await createDoctorScheduleBlock(
      session.user.id,
      session.user.role,
      body,
    );
    return NextResponse.json({ block }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
