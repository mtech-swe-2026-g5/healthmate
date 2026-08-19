import { NextRequest, NextResponse } from "next/server";

import {
  getDoctorSchedule,
  updateDoctorSchedule,
} from "@/features/doctor/schedule/services/schedule";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const schedule = await getDoctorSchedule(
      session.user.id,
      session.user.role,
    );
    return NextResponse.json(schedule);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const schedule = await updateDoctorSchedule(
      session.user.id,
      session.user.role,
      body,
    );
    return NextResponse.json(schedule);
  } catch (error) {
    return handleApiError(error);
  }
}
