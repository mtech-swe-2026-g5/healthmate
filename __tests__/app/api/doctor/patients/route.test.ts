import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/doctor/patients/route";

const listDoctorPatientsMock = vi.hoisted(() => vi.fn());
const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/doctor/patients/services/patients", () => ({
  listDoctorPatients: listDoctorPatientsMock,
}));

vi.mock("@/lib/auth", () => ({
  auth: authMock,
}));

vi.mock("@/lib/errors", () => ({
  handleApiError: vi.fn((error) =>
    Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    ),
  ),
}));

describe("doctor patients route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: { id: "user-1", role: "doctor" },
    });
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost/api/doctor/patients"),
    );

    expect(response.status).toBe(401);
    expect(listDoctorPatientsMock).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid query params", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/doctor/patients?page=0"),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ error: "Invalid request parameters" });
  });

  it("passes parsed query params to the service", async () => {
    listDoctorPatientsMock.mockResolvedValue({
      patients: [],
      pagination: {
        page: 2,
        pageSize: 10,
        total: 0,
        totalPages: 0,
        from: 0,
        to: 0,
      },
      filters: { q: "jane", status: "active" },
    });

    const response = await GET(
      new NextRequest(
        "http://localhost/api/doctor/patients?q=jane&page=2&status=active",
      ),
    );
    const payload = await response.json();

    expect(listDoctorPatientsMock).toHaveBeenCalledWith("user-1", "doctor", {
      q: "jane",
      page: 2,
      pageSize: 10,
      status: "active",
    });
    expect(response.status).toBe(200);
    expect(payload.filters.q).toBe("jane");
  });
});
