import { faker } from "@faker-js/faker/locale/en";

// Mock data
const mockDoctor1Id = faker.string.uuid();
const mockDoctor2Id = faker.string.uuid();

const mockDoctorSlotConfiguration1 = {
  id: faker.string.uuid(),
  doctorId: mockDoctor1Id,
  dayOfWeek: 1,
  startTime: new Date("1970-01-01T09:00:00Z"),
  endTime: new Date("1970-01-01T17:00:00Z"),
  timezone: "Asia/Kolkata",
  validFrom: new Date("2026-01-01T00:00:00.000Z"),
  validUntil: null,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockGlobalSlotConfiguration = {
  id: faker.string.uuid(),
  doctorId: null,
  dayOfWeek: 6,
  startTime: new Date("1970-01-01T10:00:00Z"),
  endTime: new Date("1970-01-01T13:00:00Z"),
  timezone: "Asia/Kolkata",
  validFrom: new Date("2026-01-01T00:00:00.000Z"),
  validUntil: new Date("2026-12-31T23:59:59.999Z"),
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export {
  mockDoctor1Id,
  mockDoctor2Id,
  mockDoctorSlotConfiguration1,
  mockGlobalSlotConfiguration,
};
