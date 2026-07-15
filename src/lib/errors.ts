import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

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

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = (error.meta?.target as string[]) ?? [];
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
