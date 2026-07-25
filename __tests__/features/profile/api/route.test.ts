import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, PATCH } from "@/app/api/profile/route";

const mockAuth = vi.fn();
const mockGetPatientProfile = vi.fn();
const mockUpdatePatientProfile = vi.fn();

vi.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/features/profile/services", () => ({
  getPatientProfile: (...args: unknown[]) => mockGetPatientProfile(...args),
  updatePatientProfile: (...args: unknown[]) =>
    mockUpdatePatientProfile(...args),
}));

describe("/api/profile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET returns 401 when unauthenticated", async () => {
    mockAuth.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("GET returns the profile for a patient", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "patient" } });
    mockGetPatientProfile.mockResolvedValue({
      email: "a@example.com",
      fullName: "A B",
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.profile.email).toBe("a@example.com");
    expect(mockGetPatientProfile).toHaveBeenCalledWith("u1", "patient");
  });

  it("PATCH updates the profile", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "patient" } });
    mockUpdatePatientProfile.mockResolvedValue({
      email: "a@example.com",
      firstName: "Ann",
    });

    const req = new Request("http://localhost/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Ann",
        lastName: "Bee",
        dateOfBirth: "1990-01-01",
        gender: "female",
        phoneNumber: "15550123",
        bloodGroup: "O+",
      }),
    });

    const res = await PATCH(req as never);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.profile.firstName).toBe("Ann");
  });
});
