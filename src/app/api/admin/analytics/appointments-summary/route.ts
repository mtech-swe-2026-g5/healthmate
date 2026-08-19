import { NextRequest, NextResponse } from "next/server";

import { getAppointmentsSummary } from "@/features/admin/analytics/services/appointments-summary";
import { appointmentsSummaryQuerySchema } from "@/features/admin/analytics/types/schemas";
import { assertAdminAccess } from "@/features/admin/lib/access";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    assertAdminAccess(session.user.role);

    const params = Object.fromEntries(request.nextUrl.searchParams.entries());
    const { granularity } = appointmentsSummaryQuerySchema.parse(params);
    const summary = await getAppointmentsSummary(granularity);

    return NextResponse.json(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
