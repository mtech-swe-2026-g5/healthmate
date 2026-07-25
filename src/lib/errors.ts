import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        issues: error.issues.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      },
      { status: 400 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  }

  if (error instanceof Error && error.message === "Forbidden") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (error instanceof Error && error.message === "Unauthorized") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[]) ?? [];
      if (
        target.includes("doctor_id") ||
        target.includes("starts_at") ||
        target.some((t) => t.includes("doctorId") || t.includes("startsAt"))
      ) {
        return NextResponse.json(
          { error: "Slot already booked" },
          { status: 409 },
        );
      }
      const field = target.includes("email") ? "email" : target.join(", ");
      return NextResponse.json(
        { error: `An account with this ${field} already exists` },
        { status: 409 },
      );
    }

    if (error.code === "P2025") {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }
  }

  console.error("Unhandled error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
