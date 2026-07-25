import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { handleApiError } from "@/lib/errors";
import { generateSlots } from "@/features/appointments/services/slots";
import { slotsQuerySchema } from "@/features/appointments/types/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const date = request.nextUrl.searchParams.get("date") ?? "";
    const { date: validatedDate } = slotsQuerySchema.parse({ date });

    const slots = await generateSlots(id, validatedDate);
    return NextResponse.json({ date: validatedDate, slots });
  } catch (error) {
    return handleApiError(error);
  }
}
