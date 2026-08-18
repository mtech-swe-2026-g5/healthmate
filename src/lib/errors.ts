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
      const rawTarget = error.meta?.target;
      // Postgres reports either the column list or the index name, depending on
      // the driver — the slot constraint is a partial index, so match both.
      const target = Array.isArray(rawTarget)
        ? (rawTarget as string[])
        : typeof rawTarget === "string"
          ? [rawTarget]
          : [];
      if (target.some((t) => /doctor_?id|starts_?at/i.test(t))) {
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

  // Razorpay Node SDK throws plain `{ statusCode, error }` objects.
  if (error && typeof error === "object" && "statusCode" in error) {
    const razorpayError = error as {
      statusCode?: number;
      error?: { description?: string; code?: string; reason?: string };
    };
    const description =
      razorpayError.error?.description ??
      razorpayError.error?.reason ??
      razorpayError.error?.code ??
      "Payment provider rejected the request";
    const statusCode = razorpayError.statusCode;
    const status =
      typeof statusCode === "number" && statusCode >= 400 && statusCode < 500
        ? statusCode
        : 502;
    return NextResponse.json({ error: description }, { status });
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  console.error("Unhandled error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
