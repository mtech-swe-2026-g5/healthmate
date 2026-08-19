import { NextRequest, NextResponse } from "next/server";

import { listDoctorPatients } from "@/features/doctor/patients/services/patients";
import { listDoctorPatientsQuerySchema } from "@/features/doctor/patients/types/schemas";
import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = Object.fromEntries(
      new URL(request.url).searchParams.entries(),
    );
    const parsed = listDoctorPatientsQuerySchema.safeParse(params);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request parameters" },
        { status: 400 },
      );
    }

    const result = await listDoctorPatients(
      session.user.id,
      session.user.role,
      parsed.data,
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
