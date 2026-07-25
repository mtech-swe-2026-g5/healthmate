import { describe, expect, it, vi, beforeEach } from "vitest";
import { hash } from "bcryptjs";

import { verifyUserCredentials } from "@/features/auth/services/login";

const PASSWORD = "Secure1!pass";

function buildUser(overrides: Record<string, unknown> = {}) {
  return {
    id: "uuid-user-1",
    roleId: 1,
    email: "jane@example.com",
    passwordHash: "will-be-set",
    emailVerified: false,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    role: { id: 1, name: "patient", description: "", createdAt: new Date() },
    ...overrides,
  };
}

vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: vi.fn() } },
}));

async function getMockPrisma() {
  const { prisma } = await import("@/lib/prisma");
  return prisma as unknown as {
    user: { findUnique: ReturnType<typeof vi.fn> };
  };
}

describe("verifyUserCredentials", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the user when email, password, and role match", async () => {
    const mockPrisma = await getMockPrisma();
    const passwordHash = await hash(PASSWORD, 10);
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ passwordHash }));

    const result = await verifyUserCredentials(
      "jane@example.com",
      PASSWORD,
      "patient",
    );

    expect(result).toMatchObject({
      id: "uuid-user-1",
      email: "jane@example.com",
      role: "patient",
      roleId: 1,
    });
  });

  it("looks up the user by lowercased email", async () => {
    const mockPrisma = await getMockPrisma();
    const passwordHash = await hash(PASSWORD, 10);
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ passwordHash }));

    await verifyUserCredentials("JANE@Example.COM", PASSWORD);

    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: "jane@example.com" },
      include: {
        role: true,
        doctor: {
          select: {
            firstName: true,
            id: true,
            lastName: true,
          },
        },
        patient: {
          select: {
            firstName: true,
            id: true,
            lastName: true,
          },
        },
      },
    });
  });

  it("returns null when the user does not exist", async () => {
    const mockPrisma = await getMockPrisma();
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const result = await verifyUserCredentials("nobody@example.com", PASSWORD);
    expect(result).toBeNull();
  });

  it("returns null when the account is inactive", async () => {
    const mockPrisma = await getMockPrisma();
    const passwordHash = await hash(PASSWORD, 10);
    mockPrisma.user.findUnique.mockResolvedValue(
      buildUser({ passwordHash, isActive: false }),
    );

    const result = await verifyUserCredentials("jane@example.com", PASSWORD);
    expect(result).toBeNull();
  });

  it("returns null when the password is wrong", async () => {
    const mockPrisma = await getMockPrisma();
    const passwordHash = await hash(PASSWORD, 10);
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ passwordHash }));

    const result = await verifyUserCredentials(
      "jane@example.com",
      "WrongPass1!",
    );
    expect(result).toBeNull();
  });

  it("returns null when the selected role does not match", async () => {
    const mockPrisma = await getMockPrisma();
    const passwordHash = await hash(PASSWORD, 10);
    mockPrisma.user.findUnique.mockResolvedValue(buildUser({ passwordHash }));

    const result = await verifyUserCredentials(
      "jane@example.com",
      PASSWORD,
      "doctor",
    );
    expect(result).toBeNull();
  });
});
