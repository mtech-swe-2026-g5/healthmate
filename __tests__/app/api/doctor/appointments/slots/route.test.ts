import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/doctor/appointments/slots/route";

const getSlotConfigurationByDoctorMock = vi.hoisted(() => vi.fn());

vi.mock("@/features/doctor/appointments/services/slot", () => ({
  getSlotConfigurationByDoctor: getSlotConfigurationByDoctorMock,
}));

vi.mock("@/lib/errors", () => ({
  handleApiError: vi.fn((error) =>
    Response.json(
      { message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    ),
  ),
}));

describe("doctor appointment slots route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when the request params are invalid", async () => {
    const request = new NextRequest(
      "http://localhost/api/doctor/appointments/slots?doctorId=abc&dateFrom=invalid&dateUntil=invalid",
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ message: "Invalid request parameters" });
    expect(getSlotConfigurationByDoctorMock).not.toHaveBeenCalled();
  });

  it("returns 400 when doctorId is missing", async () => {
    const request = new NextRequest(
      "http://localhost/api/doctor/appointments/slots?dateFrom=2026-07-13T00:00:00.000Z&dateUntil=2026-07-19T23:59:59.999Z",
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ message: "Invalid request parameters" });
    expect(getSlotConfigurationByDoctorMock).not.toHaveBeenCalled();
  });

  it("returns 400 when dateFrom is missing", async () => {
    const request = new NextRequest(
      "http://localhost/api/doctor/appointments/slots?doctorId=550e8400-e29b-41d4-a716-446655440000&dateUntil=2026-07-19T23:59:59.999Z",
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ message: "Invalid request parameters" });
    expect(getSlotConfigurationByDoctorMock).not.toHaveBeenCalled();
  });

  it("returns 400 when dateUntil is missing", async () => {
    const request = new NextRequest(
      "http://localhost/api/doctor/appointments/slots?doctorId=550e8400-e29b-41d4-a716-446655440000&dateFrom=2026-07-13T00:00:00.000Z",
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload).toEqual({ message: "Invalid request parameters" });
    expect(getSlotConfigurationByDoctorMock).not.toHaveBeenCalled();
  });

  it("passes doctorId, dateFrom, and dateUntil to the slot service", async () => {
    const request = new NextRequest(
      "http://localhost/api/doctor/appointments/slots?doctorId=550e8400-e29b-41d4-a716-446655440000&dateFrom=2026-07-13T00:00:00.000Z&dateUntil=2026-07-19T23:59:59.999Z",
    );
    getSlotConfigurationByDoctorMock.mockResolvedValue({
      _metadata: {
        links: { self: "self", prevWeek: "prev", nextWeek: "next" },
      },
      slots: [],
    });

    const response = await GET(request);
    const payload = await response.json();

    expect(getSlotConfigurationByDoctorMock).toHaveBeenCalledWith({
      doctorId: "550e8400-e29b-41d4-a716-446655440000",
      dateFrom: new Date("2026-07-13T00:00:00.000Z"),
      dateUntil: new Date("2026-07-19T23:59:59.999Z"),
    });
    expect(response.status).toBe(200);
    expect(payload).toEqual({
      message: "Slot configurations retrieved successfully",
      _metadata: {
        links: { self: "self", prevWeek: "prev", nextWeek: "next" },
      },
      slots: [],
    });
  });

  it("returns a 500 response when the slot service throws", async () => {
    const request = new NextRequest(
      "http://localhost/api/doctor/appointments/slots?doctorId=550e8400-e29b-41d4-a716-446655440000&dateFrom=2026-07-13T00:00:00.000Z&dateUntil=2026-07-19T23:59:59.999Z",
    );
    getSlotConfigurationByDoctorMock.mockRejectedValue(
      new Error("Database connection failed"),
    );

    const response = await GET(request);
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ message: "Database connection failed" });
    expect(getSlotConfigurationByDoctorMock).toHaveBeenCalledTimes(1);
  });
});
