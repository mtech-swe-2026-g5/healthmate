import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getDoctorPatientDetail,
  listDoctorPatients,
} from "@/features/doctor/patients/services/patients";

const mockQueryRaw = vi.fn();
const mockGetDoctorIdForUser = vi.fn();
const mockDoctorFindUnique = vi.fn();
const mockPatientFindUnique = vi.fn();
const mockAppointmentFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
    doctor: {
      findUnique: (...args: unknown[]) => mockDoctorFindUnique(...args),
    },
    patient: {
      findUnique: (...args: unknown[]) => mockPatientFindUnique(...args),
    },
    appointment: {
      findMany: (...args: unknown[]) => mockAppointmentFindMany(...args),
    },
  },
}));

vi.mock("@/features/doctor/schedule/services/schedule", () => ({
  getDoctorIdForUser: (...args: unknown[]) => mockGetDoctorIdForUser(...args),
}));

describe("listDoctorPatients", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDoctorIdForUser.mockResolvedValue(
      "550e8400-e29b-41d4-a716-446655440000",
    );
  });

  it("returns paginated patients for the logged-in doctor", async () => {
    mockQueryRaw
      .mockResolvedValueOnce([
        {
          id: "660e8400-e29b-41d4-a716-446655440001",
          first_name: "Jane",
          last_name: "Doe",
          date_of_birth: new Date("1990-01-15"),
          gender: "female",
          phone_number: "+911234567890",
          visit_count: 2,
          last_visit_at: new Date("2026-08-10T04:30:00.000Z"),
          has_upcoming: true,
          last_visit_reason: "Follow-up",
          patient_status: "active",
        },
      ])
      .mockResolvedValueOnce([{ count: BigInt(1) }]);

    const result = await listDoctorPatients("user-1", "doctor", {
      q: "jane",
      page: 1,
      pageSize: 10,
      status: "all",
    });

    expect(mockGetDoctorIdForUser).toHaveBeenCalledWith("user-1");
    expect(result.patients).toHaveLength(1);
    expect(result.patients[0]?.fullName).toBe("Jane Doe");
    expect(result.patients[0]?.status).toBe("active");
    expect(result.pagination.total).toBe(1);
    expect(result.filters.q).toBe("jane");
  });

  it("rejects users without doctor access", async () => {
    await expect(
      listDoctorPatients("user-1", "patient", {
        q: "",
        page: 1,
        pageSize: 10,
        status: "all",
      }),
    ).rejects.toThrow("Forbidden");
  });
});

describe("getDoctorPatientDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetDoctorIdForUser.mockResolvedValue(
      "550e8400-e29b-41d4-a716-446655440000",
    );
    mockDoctorFindUnique.mockResolvedValue({
      firstName: "Sarah",
      lastName: "Jenkins",
    });
    mockPatientFindUnique.mockResolvedValue({
      id: "660e8400-e29b-41d4-a716-446655440001",
      firstName: "Mark",
      lastName: "Thompson",
      dateOfBirth: new Date("1982-11-12"),
      gender: "male",
      phoneNumber: "+15550198472",
      bloodGroup: "O+",
      profilePictureUrl: null,
      user: { email: "mark@example.com" },
    });
    mockAppointmentFindMany.mockResolvedValue([
      {
        id: "apt-1",
        bookingReference: "HM-ABC123",
        startsAt: new Date("2023-10-24T04:30:00.000Z"),
        reasonForVisit: "Annual Physical Exam",
        additionalNotes: "Routine checkup.",
        status: "CONFIRMED",
      },
    ]);
  });

  it("returns patient profile and visit history for the doctor", async () => {
    const detail = await getDoctorPatientDetail(
      "user-1",
      "doctor",
      "660e8400-e29b-41d4-a716-446655440001",
    );

    expect(detail.patient.fullName).toBe("Mark Thompson");
    expect(detail.patient.email).toBe("mark@example.com");
    expect(detail.doctorName).toBe("Dr. Sarah Jenkins");
    expect(detail.visits).toHaveLength(1);
    expect(detail.visits[0]?.reasonForVisit).toBe("Annual Physical Exam");
  });

  it("returns 404 when the patient has no appointments with the doctor", async () => {
    mockAppointmentFindMany.mockResolvedValue([]);

    await expect(
      getDoctorPatientDetail(
        "user-1",
        "doctor",
        "660e8400-e29b-41d4-a716-446655440001",
      ),
    ).rejects.toMatchObject({ status: 404 });
  });
});
