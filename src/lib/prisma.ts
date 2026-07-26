import { PrismaClient, Prisma } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { normalizeDatabaseUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};
export type DoctorModel = Prisma.DoctorGetPayload<true>;
export type PatientModel = Prisma.PatientGetPayload<true>;
export type SlotConfigurationModel = Prisma.SlotConfigurationGetPayload<true>;

function createPrismaClient() {
  const connectionString = normalizeDatabaseUrl(
    process.env.DATABASE_URL ??
      "postgresql://postgres@localhost:5432/healthmate?sslmode=disable",
  );

  const adapter = new PrismaPg({
    connectionString,
  });

  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
