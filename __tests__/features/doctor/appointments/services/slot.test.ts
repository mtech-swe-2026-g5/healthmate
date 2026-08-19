import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getSlotConfigurationByDoctor } from "@/features/doctor/appointments/services/slot";
import { GetAppointmentSlotRequest } from "@/features/doctor/appointments/types/request";
import {
  mockDoctor1Id,
  mockDoctor2Id,
  mockDoctorSlotConfiguration1,
  mockGlobalSlotConfiguration,
} from "@test/features/doctor/appointments/services/slot.mock";
import { Prisma } from "@prisma/client";
import { DefaultArgs } from "@prisma/client/runtime/client";
import { prisma } from "@/lib/prisma";
import { faker } from "@faker-js/faker/locale/en";
import { DateTime } from "luxon";
import { CLINIC_TIMEZONE } from "@/features/appointments/lib/timezone";

const errorDoctorId = faker.string.uuid();

vi.mock("@/lib/prisma", () => {
  const slotConfiguration = {
    findMany: vi.fn(
      (query: Prisma.SlotConfigurationFindManyArgs<DefaultArgs>) => {
        const doctorFilter = query.where?.AND;
        const doctorId = Array.isArray(doctorFilter)
          ? (
              doctorFilter.find(
                (clause) =>
                  "OR" in clause && "doctorId" in (clause.OR?.[0] ?? {}),
              ) as { OR?: { doctorId?: string | null }[] } | undefined
            )?.OR?.[0]?.doctorId
          : undefined;

        if (doctorId === mockDoctor1Id) {
          return Promise.resolve([
            mockDoctorSlotConfiguration1,
            mockGlobalSlotConfiguration,
          ]);
        } else if (doctorId === mockDoctor2Id) {
          return Promise.resolve([mockGlobalSlotConfiguration]);
        } else if (doctorId === errorDoctorId) {
          return Promise.reject(new Error("Database connection failed"));
        } else {
          return Promise.resolve([]);
        }
      },
    ),
  };

  return {
    prisma: {
      slotConfiguration,
    },
  };
});

describe("getSlotConfigurationByDoctor", () => {
  const validRequest: GetAppointmentSlotRequest = {
    doctorId: mockDoctor1Id,
    dateFrom: new Date("2026-07-13T00:00:00.000Z"),
    dateUntil: new Date("2026-07-19T23:59:59.999Z"),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Data retrieval", () => {
    it("should return empty slots array when there are no matching configurations", async () => {
      const nonExistingRequest: GetAppointmentSlotRequest = {
        doctorId: faker.string.uuid(),
        dateFrom: new Date("2026-07-13T00:00:00.000Z"),
        dateUntil: new Date("2026-07-19T23:59:59.999Z"),
      };
      const result = await getSlotConfigurationByDoctor(nonExistingRequest);
      expect(result?.slots).toHaveLength(0);
    });

    it("should return doctor-specific and global slot configurations", async () => {
      const result = await getSlotConfigurationByDoctor(validRequest);
      expect(result?.slots).toHaveLength(2);
    });

    it("should filter by request with active, doctor and validity constraints", async () => {
      await getSlotConfigurationByDoctor(validRequest);
      expect(prisma.slotConfiguration.findMany).toHaveBeenCalledWith({
        where: {
          AND: [
            {
              active: true,
            },
            {
              OR: [{ doctorId: validRequest.doctorId }, { doctorId: null }],
            },
            {
              validFrom: {
                lte: DateTime.fromJSDate(validRequest.dateFrom)
                  .setZone(CLINIC_TIMEZONE)
                  .startOf("day")
                  .toJSDate(),
              },
            },
            {
              OR: [
                {
                  validUntil: {
                    gte: DateTime.fromJSDate(validRequest.dateUntil)
                      .setZone(CLINIC_TIMEZONE)
                      .endOf("day")
                      .toJSDate(),
                  },
                },
                {
                  validUntil: null,
                },
              ],
            },
          ],
        },
        orderBy: [{ validFrom: "asc" }, { dayOfWeek: "asc" }],
      });
    });
  });

  describe("Response formatting", () => {
    it("should include the raw slot configurations in the response", async () => {
      const result = await getSlotConfigurationByDoctor(validRequest);
      expect(result?.slots).toEqual([
        mockDoctorSlotConfiguration1,
        mockGlobalSlotConfiguration,
      ]);
    });
  });

  describe("Metadata links", () => {
    it("should include self link in metadata", async () => {
      const result = await getSlotConfigurationByDoctor(validRequest);
      expect(result?._metadata.links.self).toContain(
        "/api/doctor/appointments/slots",
      );
      expect(result?._metadata.links.self).toContain(
        `doctorId=${validRequest.doctorId}`,
      );
    });

    it("should include previous week link in metadata", async () => {
      const result = await getSlotConfigurationByDoctor(validRequest);
      expect(result?._metadata.links.prevWeek).toContain(
        "/api/doctor/appointments/slots",
      );
      expect(result?._metadata.links.prevWeek).toContain("dateFrom=");
      expect(result?._metadata.links.prevWeek).toContain("dateUntil=");
    });

    it("should include next week link in metadata", async () => {
      const result = await getSlotConfigurationByDoctor(validRequest);
      expect(result?._metadata.links.nextWeek).toContain(
        "/api/doctor/appointments/slots",
      );
      expect(result?._metadata.links.nextWeek).toContain("dateFrom=");
      expect(result?._metadata.links.nextWeek).toContain("dateUntil=");
    });
  });

  describe("Error handling", () => {
    it("should throw error when database query fails", async () => {
      const errorRequest: GetAppointmentSlotRequest = {
        doctorId: errorDoctorId,
        dateFrom: new Date("2026-07-13T00:00:00.000Z"),
        dateUntil: new Date("2026-07-19T23:59:59.999Z"),
      };
      await expect(getSlotConfigurationByDoctor(errorRequest)).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should throw ZodError on invalid doctorId", async () => {
      const { ZodError } = await import("zod");
      const invalidRequest = {
        doctorId: "not-a-uuid",
        dateFrom: new Date("2026-07-13T00:00:00.000Z"),
        dateUntil: new Date("2026-07-19T23:59:59.999Z"),
      };

      await expect(
        getSlotConfigurationByDoctor(invalidRequest),
      ).rejects.toThrow(ZodError);
    });

    it("should throw ZodError when dateUntil is before dateFrom", async () => {
      const { ZodError } = await import("zod");
      const invalidRequest = {
        doctorId: mockDoctor1Id,
        dateFrom: new Date("2026-07-19T23:59:59.999Z"),
        dateUntil: new Date("2026-07-13T00:00:00.000Z"),
      };

      await expect(
        getSlotConfigurationByDoctor(invalidRequest),
      ).rejects.toThrow(ZodError);
    });
  });

  describe("Doctor slot isolation", () => {
    it("should not include the other doctor's exclusive configurations", async () => {
      const request: GetAppointmentSlotRequest = {
        doctorId: mockDoctor2Id,
        dateFrom: new Date("2026-07-13T00:00:00.000Z"),
        dateUntil: new Date("2026-07-19T23:59:59.999Z"),
      };
      const result = await getSlotConfigurationByDoctor(request);
      expect(result?.slots).toEqual([mockGlobalSlotConfiguration]);
    });
  });
});
