import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import {
  getPatientProfile,
  updatePatientProfile,
} from "@/features/profile/services";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await getPatientProfile(session.user.id, session.user.role);
    return NextResponse.json({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const profile = await updatePatientProfile(
      session.user.id,
      session.user.role,
      body,
    );
    return NextResponse.json({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}
