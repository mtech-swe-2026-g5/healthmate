import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/admin/analytics/appointments-summary/route";

const getAppointmentsSummaryMock = vi.hoisted(() => vi.fn());
const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/admin/analytics/services/appointments-summary", () => ({
  getAppointmentsSummary: getAppointmentsSummaryMock,
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/errors", () => ({
  AppError: class AppError extends Error {
    constructor(
      message: string,
      public status: number,
    ) {
      super(message);
    }
  },
  handleApiError: vi.fn((error) =>
    Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      {
        status:
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          typeof error.status === "number"
            ? error.status
            : 500,
      },
    ),
  ),
}));

describe("admin appointments summary route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: { id: "admin-1", role: "admin" },
    });
    getAppointmentsSummaryMock.mockResolvedValue({
      period: { granularity: "daily", from: "2026-08-18", to: "2026-08-25" },
      overview: {
        totalPatients: 10,
        totalDoctors: 4,
        totalRevenueInPaise: 500000,
      },
      summary: {
        total: 10,
        scheduled: 2,
        completed: 7,
        cancelled: 1,
        noShow: 0,
        completionRate: 70,
        cancellationRate: 10,
      },
      byStatus: [],
      series: [],
    });
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);

    const response = await GET(
      new NextRequest(
        "http://localhost/api/admin/analytics/appointments-summary",
      ),
    );

    expect(response.status).toBe(401);
    expect(getAppointmentsSummaryMock).not.toHaveBeenCalled();
  });

  it("returns 403 for non-admin roles", async () => {
    authMock.mockResolvedValue({
      user: { id: "doctor-1", role: "doctor" },
    });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/admin/analytics/appointments-summary",
      ),
    );

    expect(response.status).toBe(403);
    expect(getAppointmentsSummaryMock).not.toHaveBeenCalled();
  });

  it("returns summary for admin with default granularity", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/api/admin/analytics/appointments-summary",
      ),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(getAppointmentsSummaryMock).toHaveBeenCalledWith("daily");
    expect(payload.summary.total).toBe(10);
  });

  it("passes requested granularity to the service", async () => {
    await GET(
      new NextRequest(
        "http://localhost/api/admin/analytics/appointments-summary?granularity=monthly",
      ),
    );

    expect(getAppointmentsSummaryMock).toHaveBeenCalledWith("monthly");
  });
});
