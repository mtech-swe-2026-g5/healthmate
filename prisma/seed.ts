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
    email: "dr.patel@healthmate.local",
    firstName: "Ananya",
    lastName: "Patel",
    specialization: "General Physician",
  },
  {
    email: "dr.singh@healthmate.local",
    firstName: "Rohan",
    lastName: "Singh",
    specialization: "Cardiology",
  },
  {
    email: "dr.mehta@healthmate.local",
    firstName: "Priya",
    lastName: "Mehta",
    specialization: "Dermatology",
  },
  {
    email: "dr.khan@healthmate.local",
    firstName: "Imran",
    lastName: "Khan",
    specialization: "Orthopedics",
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
};
const demoDoctor = {
  id: "23b391b6-eb6e-4f54-bf1a-aa0549f6fbc8",
  userId: "847ce578-d21b-4b4a-80e9-d58893a47c3a",
};
const demoPatient = {
  id: "7c7bf910-2fd8-44af-965b-e5e6a6a6b040",
  userId: "e50f9967-9762-4deb-8cea-96fdf1591b36",
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
        gender: "male",
        phoneNumber: "+1-555-0123",
      },
    });
  });
}

async function createDefaultSlotConfiguration() {
  await Promise.all(
    defaultSlotConfiguration.dayOfWeeks.map(async (dayOfWeek) => {
      const id = `${defaultSlotConfiguration.id.slice(0, -1)}${dayOfWeek}`;
      return prisma.slotConfiguration.upsert({
        where: { id },
        update: {
          validFrom: defaultSlotConfiguration.validFrom,
          dayOfWeek,
          startTime: defaultSlotConfiguration.startTime,
          endTime: defaultSlotConfiguration.endTime,
          timezone: defaultSlotConfiguration.timezone,
          active: true,
          doctorId: demoDoctor.id,
        },
        create: {
          id,
          doctorId: demoDoctor.id,
          validFrom: defaultSlotConfiguration.validFrom,
          dayOfWeek,
          startTime: defaultSlotConfiguration.startTime,
          endTime: defaultSlotConfiguration.endTime,
          timezone: defaultSlotConfiguration.timezone,
          active: true,
        },
      });
    }),
  );
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
    const existing = await prisma.user.findUnique({ where: { email } });

    if (existing) {
      await prisma.doctor.upsert({
        where: { userId: existing.id },
        update: {
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          specialization: doctor.specialization,
          isActive: true,
        },
        create: {
          userId: existing.id,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          specialization: doctor.specialization,
          isActive: true,
        },
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
        data: {
          userId: user.id,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          specialization: doctor.specialization,
          isActive: true,
        },
      });
    });
  }
  console.log(
    `Seeded ${DOCTORS.length} doctors (password: ${MVP_DOCTOR_PASSWORD}).`,
  );

  await createDefaultDoctor();
  console.log("Seeded sample doctor (johndoe-doctor@healthmate.com).");
  await createDefaultSlotConfiguration();
  console.log("Created default slot configuration.");
  await createDefaultPatient();
  console.log("Seeded sample patient (johndoe-patient@healthmate.com).");
  await seedTestAppointments();
  console.log("Seeded sample appointments.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
