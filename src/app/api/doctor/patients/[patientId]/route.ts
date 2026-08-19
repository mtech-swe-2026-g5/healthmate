import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getDoctorPatientDetail } from "@/features/doctor/patients/services/patients";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

const paramsSchema = z.object({
  patientId: z.string().uuid("Invalid patient ID"),
});

type RouteContext = { params: Promise<{ patientId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rawParams = await context.params;
    const parsed = paramsSchema.safeParse(rawParams);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 },
      );
    }

    const detail = await getDoctorPatientDetail(
      session.user.id,
      session.user.role,
      parsed.data.patientId,
    );

    return NextResponse.json(detail);
  } catch (error) {
    return handleApiError(error);
  }
}
