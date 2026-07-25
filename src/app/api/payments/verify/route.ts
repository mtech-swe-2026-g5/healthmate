import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { verifyAndCompletePayment } from "@/features/payments/services";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = await verifyAndCompletePayment(
      session.user.id,
      session.user.role,
      body,
    );
    return NextResponse.json({
      appointment: result.appointment,
      alreadyCaptured: result.alreadyCaptured,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
