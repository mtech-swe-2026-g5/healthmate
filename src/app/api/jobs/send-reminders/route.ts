import { NextResponse } from "next/server";

import { sendDueAppointmentReminders } from "@/features/notifications";

function getJobSecret(): string | null {
  const value = process.env.REMINDER_JOB_SECRET?.trim();
  return value && value.length > 0 ? value : null;
}

export async function POST(request: Request) {
  const expectedSecret = getJobSecret();
  const receivedSecret = request.headers.get("x-job-secret")?.trim();

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await sendDueAppointmentReminders();
  return NextResponse.json(result);
}
