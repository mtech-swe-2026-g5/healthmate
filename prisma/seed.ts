import { hash } from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { DateTime } from "luxon";

import { normalizeDatabaseUrl } from "../src/lib/database-url";

const connectionString = normalizeDatabaseUrl(
  process.env.DATABASE_URL ??
    "postgresql://postgres@localhost:5432/healthmate?sslmode=disable",
);

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BCRYPT_SALT_ROUNDS = 10;
const MVP_DOCTOR_PASSWORD = "Doctor@123";
const MVP_ADMIN_PASSWORD = "Admin@123";

const ROLES = [
  {
    name: "patient",
    description: "Patient: book appointments and manage health records",
  },
  {
    name: "doctor",
    description: "Doctor: manage schedules and view patient appointments",
  },
  {
    name: "admin",
    description: "Admin: full system access and user management",
  },
] as const;

/** Mon–Sat (1–6): 11:00–19:00, 60-minute slots. Sunday omitted / inactive. */
const WORKING_HOURS = [
  { dayOfWeek: 0, startTime: "11:00", endTime: "19:00", isActive: false },
  { dayOfWeek: 1, startTime: "11:00", endTime: "19:00", isActive: true },
  { dayOfWeek: 2, startTime: "11:00", endTime: "19:00", isActive: true },
  { dayOfWeek: 3, startTime: "11:00", endTime: "19:00", isActive: true },
  { dayOfWeek: 4, startTime: "11:00", endTime: "19:00", isActive: true },
  { dayOfWeek: 5, startTime: "11:00", endTime: "19:00", isActive: true },
  { dayOfWeek: 6, startTime: "11:00", endTime: "19:00", isActive: true },
] as const;

const DOCTORS = [
  {
    email: "dr.sharma@healthmate.in",
    firstName: "Vikram",
    lastName: "Sharma",
    specialization: "General Physician",
    gender: "male" as const,
    phoneNumber: "+91-98100-10001",
  },
  {
    email: "dr.patel@healthmate.in",
    firstName: "Ananya",
    lastName: "Patel",
    specialization: "General Physician",
    gender: "female" as const,
    phoneNumber: "+91-98100-10002",
  },
  {
    email: "dr.singh@healthmate.in",
    firstName: "Rohan",
    lastName: "Singh",
    specialization: "Cardiology",
    gender: "male" as const,
    phoneNumber: "+91-98100-10003",
  },
  {
    email: "dr.mehta@healthmate.in",
    firstName: "Priya",
    lastName: "Mehta",
    specialization: "Dermatology",
    gender: "female" as const,
    phoneNumber: "+91-98100-10004",
  },
  {
    email: "dr.khan@healthmate.in",
    firstName: "Imran",
    lastName: "Khan",
    specialization: "Orthopedics",
    gender: "male" as const,
    phoneNumber: "+91-98100-10005",
  },
] as const;

const today = DateTime.now().plus({ hours: 1 }).startOf("hour");
const defaultSlotConfiguration = {
  id: "f944755b-5443-4157-81c1-0e3bf62e0d78",
  validFrom: new Date("2026-01-01T00:00:00.000Z"),
  dayOfWeeks: [1, 2, 3, 4, 5],
  startTime: new Date("2026-01-01T11:00:00.000Z"),
  endTime: new Date("2026-01-01T19:00:00.000Z"),
  timezone: "Asia/Kolkata",
  slotDurationMinutes: 60,
  bufferMinutes: 15,
};
const demoDoctor = {
  id: "23b391b6-eb6e-4f54-bf1a-aa0549f6fbc8",
  userId: "847ce578-d21b-4b4a-80e9-d58893a47c3a",
};
const demoPatient = {
  id: "7c7bf910-2fd8-44af-965b-e5e6a6a6b040",
  userId: "e50f9967-9762-4deb-8cea-96fdf1591b36",
};
const demoAdmin = {
  userId: "a0000000-0000-4000-8000-000000000001",
};
const demoAppointment = {
  id: "e014086e-47b3-4c1f-8658-2aede4df8240",
  startsAt: today.toJSDate(),
  endsAt: today.plus({ hours: 1 }).toJSDate(),
  doctorId: demoDoctor.id,
  patientId: demoPatient.id,
};

async function createDefaultDoctor() {
  return prisma.$transaction(async (tx) => {
    const doctorRole = await tx.role.findUnique({ where: { name: "doctor" } });
    if (!doctorRole) return;

    const user = await tx.user.upsert({
      where: { id: demoDoctor.userId },
      update: {
        email: "johndoe-doctor@healthmate.com",
        passwordHash: await hash("johndoe@123", BCRYPT_SALT_ROUNDS),
        emailVerified: true,
        isActive: true,
        roleId: doctorRole.id,
      },
      create: {
        id: demoDoctor.userId,
        email: "johndoe-doctor@healthmate.com",
        passwordHash: await hash("johndoe@123", BCRYPT_SALT_ROUNDS),
        emailVerified: true,
        isActive: true,
        roleId: doctorRole.id,
      },
    });

    await tx.doctor.upsert({
      where: { id: demoDoctor.id },
      update: {
        firstName: "John",
        lastName: "Doe",
        specialization: "General Physician",
        isActive: true,
        acceptingNewPatients: true,
        bufferMinutes: defaultSlotConfiguration.bufferMinutes,
        slotDurationMinutes: defaultSlotConfiguration.slotDurationMinutes,
        gender: "male",
        phoneNumber: "+1-555-0123",
      },
      create: {
        id: demoDoctor.id,
        userId: user.id,
        firstName: "John",
        lastName: "Doe",
        specialization: "General Physician",
        isActive: true,
        acceptingNewPatients: true,
        bufferMinutes: defaultSlotConfiguration.bufferMinutes,
        slotDurationMinutes: defaultSlotConfiguration.slotDurationMinutes,
        gender: "male",
        phoneNumber: "+1-555-0123",
      },
    });
  });
}

async function upsertDoctorSchedule(
  doctorId: string,
  dayOfWeeks: number[],
  options?: {
    startTime?: Date;
    endTime?: Date;
    idPrefix?: string;
    slotDurationMinutes?: number;
    bufferMinutes?: number;
  },
) {
  const startTime = options?.startTime ?? defaultSlotConfiguration.startTime;
  const endTime = options?.endTime ?? defaultSlotConfiguration.endTime;
  const idPrefix =
    options?.idPrefix ?? defaultSlotConfiguration.id.slice(0, -1);
  const slotDurationMinutes =
    options?.slotDurationMinutes ??
    defaultSlotConfiguration.slotDurationMinutes;
  const bufferMinutes =
    options?.bufferMinutes ?? defaultSlotConfiguration.bufferMinutes;

  await prisma.doctor.update({
    where: { id: doctorId },
    data: {
      acceptingNewPatients: true,
      bufferMinutes,
      slotDurationMinutes,
    },
  });

  await Promise.all(
    dayOfWeeks.map((dayOfWeek) => {
      const id = `${idPrefix}${dayOfWeek}`;
      return prisma.slotConfiguration.upsert({
        where: { id },
        update: {
          validFrom: defaultSlotConfiguration.validFrom,
          dayOfWeek,
          startTime,
          endTime,
          timezone: defaultSlotConfiguration.timezone,
          active: true,
          doctorId,
        },
        create: {
          id,
          doctorId,
          validFrom: defaultSlotConfiguration.validFrom,
          dayOfWeek,
          startTime,
          endTime,
          timezone: defaultSlotConfiguration.timezone,
          active: true,
        },
      });
    }),
  );
}

async function createDefaultSlotConfiguration() {
  await upsertDoctorSchedule(
    demoDoctor.id,
    defaultSlotConfiguration.dayOfWeeks,
  );
}

async function seedAllDoctorSchedules() {
  const doctors = await prisma.doctor.findMany({
    where: { isActive: true },
    select: { id: true, lastName: true },
  });

  for (const doctor of doctors) {
    if (doctor.id === demoDoctor.id) continue;
    const prefix = doctor.id.slice(0, 35);
    await upsertDoctorSchedule(doctor.id, [1, 2, 3, 4, 5, 6], {
      idPrefix: prefix,
      startTime: new Date("2026-01-01T10:00:00.000Z"),
      endTime: new Date("2026-01-01T18:00:00.000Z"),
    });
  }
}

async function createDefaultAdmin() {
  return prisma.$transaction(async (tx) => {
    const adminRole = await tx.role.findUnique({ where: { name: "admin" } });
    if (!adminRole) return;

    await tx.user.upsert({
      where: { email: "admin@healthmate.com" },
      update: {
        passwordHash: await hash(MVP_ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS),
        emailVerified: true,
        isActive: true,
        roleId: adminRole.id,
      },
      create: {
        id: demoAdmin.userId,
        email: "admin@healthmate.com",
        passwordHash: await hash(MVP_ADMIN_PASSWORD, BCRYPT_SALT_ROUNDS),
        emailVerified: true,
        isActive: true,
        roleId: adminRole.id,
      },
    });
  });
}

async function seedHistoricalAppointments() {
  const clinicNow = DateTime.now().setZone("Asia/Kolkata");
  const rows: {
    id: string;
    bookingReference: string;
    startsAt: Date;
    endsAt: Date;
    status: "CONFIRMED" | "CANCELLED";
  }[] = [];

  for (let dayOffset = -28; dayOffset <= 7; dayOffset += 1) {
    const day = clinicNow.plus({ days: dayOffset }).startOf("day");
    const slots = [10, 12, 15, 17];
    for (let slotIndex = 0; slotIndex < slots.length; slotIndex += 1) {
      const hour = slots[slotIndex]!;
      const startsAt = day.set({ hour, minute: 0 }).toUTC().toJSDate();
      const endsAt = day
        .set({ hour: hour + 1, minute: 0 })
        .toUTC()
        .toJSDate();
      const sequence = dayOffset + 28 + slotIndex;
      const status: "CONFIRMED" | "CANCELLED" =
        sequence % 7 === 0 ? "CANCELLED" : "CONFIRMED";

      rows.push({
        id: `b0000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`,
        bookingReference: `HM-SEED-${String(sequence).padStart(4, "0")}`,
        startsAt,
        endsAt,
        status,
      });
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.appointment.deleteMany({
      where: { bookingReference: { startsWith: "HM-SEED-" } },
    });

    await tx.appointment.createMany({
      data: rows.map((row) => ({
        ...row,
        doctorId: demoDoctor.id,
        patientId: demoPatient.id,
        reasonForVisit: "Seed analytics appointment",
      })),
      skipDuplicates: true,
    });
  });
}

async function createDefaultPatient() {
  return prisma.$transaction(async (tx) => {
    const patientRole = await tx.role.findUnique({
      where: { name: "patient" },
    });
    if (!patientRole) return;

    const user = await tx.user.upsert({
      where: { id: demoPatient.userId },
      update: {
        email: "johndoe-patient@healthmate.com",
        passwordHash: await hash("johndoe@123", BCRYPT_SALT_ROUNDS),
        emailVerified: true,
        isActive: true,
        roleId: patientRole.id,
      },
      create: {
        id: demoPatient.userId,
        email: "johndoe-patient@healthmate.com",
        passwordHash: await hash("johndoe@123", BCRYPT_SALT_ROUNDS),
        emailVerified: true,
        isActive: true,
        roleId: patientRole.id,
      },
    });

    await tx.patient.upsert({
      where: { id: demoPatient.id },
      update: {
        firstName: "John",
        lastName: "Doe",
        gender: "male",
        phoneNumber: "+1-555-0123",
        bloodGroup: "B+",
        dateOfBirth: new Date("2000-01-01"),
      },
      create: {
        id: demoPatient.id,
        userId: user.id,
        firstName: "John",
        lastName: "Doe",
        gender: "male",
        phoneNumber: "+1-555-0123",
        bloodGroup: "B+",
        dateOfBirth: new Date("2000-01-01"),
      },
    });
  });
}

async function seedTestAppointments() {
  await prisma.$transaction(async (tx) => {
    await tx.appointment.deleteMany({
      where: {
        patientId: demoAppointment.patientId,
        doctorId: demoAppointment.doctorId,
      },
    });

    await tx.appointment.create({
      data: {
        id: demoAppointment.id,
        bookingReference: "HM-DEMO01",
        doctorId: demoAppointment.doctorId,
        patientId: demoAppointment.patientId,
        startsAt: demoAppointment.startsAt,
        endsAt: demoAppointment.endsAt,
        status: "CONFIRMED",
        reasonForVisit: "General consultation",
      },
    });
  });
}

async function main() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log(`Seeded ${ROLES.length} roles.`);

  for (const hours of WORKING_HOURS) {
    await prisma.workingHours.upsert({
      where: { dayOfWeek: hours.dayOfWeek },
      update: {
        startTime: hours.startTime,
        endTime: hours.endTime,
        slotDurationMinutes: 60,
        isActive: hours.isActive,
      },
      create: {
        dayOfWeek: hours.dayOfWeek,
        startTime: hours.startTime,
        endTime: hours.endTime,
        slotDurationMinutes: 60,
        isActive: hours.isActive,
      },
    });
  }
  console.log(`Seeded ${WORKING_HOURS.length} working-hour rows.`);

  const doctorRole = await prisma.role.findUniqueOrThrow({
    where: { name: "doctor" },
  });
  const passwordHash = await hash(MVP_DOCTOR_PASSWORD, BCRYPT_SALT_ROUNDS);

  for (const doctor of DOCTORS) {
    const email = doctor.email.toLowerCase();
    const doctorProfile = {
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      specialization: doctor.specialization,
      gender: doctor.gender,
      phoneNumber: doctor.phoneNumber,
      isActive: true,
      acceptingNewPatients: true,
      bufferMinutes: defaultSlotConfiguration.bufferMinutes,
      slotDurationMinutes: defaultSlotConfiguration.slotDurationMinutes,
    };

    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      await prisma.doctor.upsert({
        where: { userId: existing.id },
        update: doctorProfile,
        create: { userId: existing.id, ...doctorProfile },
      });
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          roleId: doctorRole.id,
          email,
          passwordHash,
          emailVerified: true,
          isActive: true,
        },
      });

      await tx.doctor.create({
        data: { userId: user.id, ...doctorProfile },
      });
    });
  }
  console.log(
    `Seeded ${DOCTORS.length} doctors (password: ${MVP_DOCTOR_PASSWORD}).`,
  );

  await createDefaultDoctor();
  console.log("Seeded sample doctor (johndoe-doctor@healthmate.com).");
  await createDefaultSlotConfiguration();
  await seedAllDoctorSchedules();
  console.log("Created doctor slot configurations for all active doctors.");
  await createDefaultPatient();
  console.log("Seeded sample patient (johndoe-patient@healthmate.com).");
  await createDefaultAdmin();
  console.log(
    `Seeded clinic admin (admin@healthmate.com, password: ${MVP_ADMIN_PASSWORD}).`,
  );
  await seedTestAppointments();
  console.log("Seeded sample appointments.");
  await seedHistoricalAppointments();
  console.log("Seeded historical appointments for admin analytics.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
