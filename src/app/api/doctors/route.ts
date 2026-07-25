import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { listActiveDoctors } from "@/features/appointments/services/doctors";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const doctors = await listActiveDoctors();
    return NextResponse.json({ doctors });
  } catch (error) {
    return handleApiError(error);
  }
}
