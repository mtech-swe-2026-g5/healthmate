import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/doctor/patients/[patientId]/route";

const getDoctorPatientDetailMock = vi.hoisted(() => vi.fn());
const authMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/doctor/patients/services/patients", () => ({
  getDoctorPatientDetail: getDoctorPatientDetailMock,
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

describe("doctor patient detail route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: { id: "user-1", role: "doctor" },
    });
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost/api/doctor/patients/patient-1"),
      { params: Promise.resolve({ patientId: "patient-1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid patient id", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/doctor/patients/not-a-uuid"),
      { params: Promise.resolve({ patientId: "not-a-uuid" }) },
    );

    expect(response.status).toBe(400);
  });

  it("returns patient detail from the service", async () => {
    getDoctorPatientDetailMock.mockResolvedValue({
      patient: { fullName: "Mark Thompson" },
      doctorName: "Dr. Sarah Jenkins",
      visits: [],
    });

    const patientId = "660e8400-e29b-41d4-a716-446655440001";
    const response = await GET(
      new NextRequest(`http://localhost/api/doctor/patients/${patientId}`),
      { params: Promise.resolve({ patientId }) },
    );
    const payload = await response.json();

    expect(getDoctorPatientDetailMock).toHaveBeenCalledWith(
      "user-1",
      "doctor",
      patientId,
    );
    expect(response.status).toBe(200);
    expect(payload.patient.fullName).toBe("Mark Thompson");
  });
});
