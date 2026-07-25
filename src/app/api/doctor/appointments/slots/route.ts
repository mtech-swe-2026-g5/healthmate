import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/errors";
import { getSlotConfigurationByDoctor } from "@/features/doctor/appointments/services/slot";

export async function GET(request: NextRequest) {
  try {
    const urlSearchParams = new URL(request.url).searchParams;
    const doctorId = urlSearchParams.get("doctorId");
    const dateFrom = new Date(urlSearchParams.get("dateFrom") || "");
    const dateUntil = new Date(urlSearchParams.get("dateUntil") || "");

    if (!doctorId || isNaN(dateFrom.getTime()) || isNaN(dateUntil.getTime())) {
      return NextResponse.json(
        { message: "Invalid request parameters" },
        { status: 400 },
      );
    }

    const result = await getSlotConfigurationByDoctor({
      doctorId,
      dateFrom,
      dateUntil,
    });
    return NextResponse.json(
      { message: "Slot configurations retrieved successfully", ...result },
      { status: 200 },
    );
  } catch (error) {
    return handleApiError(error);
  }
}
