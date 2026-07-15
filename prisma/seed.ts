import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { BCRYPT_SALT_ROUNDS } from "@/features/auth/services/registration";
import moment from "moment";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://postgres@localhost:5432/healthmate?sslmode=disable";

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

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

const today = moment().add(1, "hour").startOf("hour");
const doctor = {
  id: "23b391b6-eb6e-4f54-bf1a-aa0549f6fbc8",
  userId: "847ce578-d21b-4b4a-80e9-d58893a47c3a",
};
const patient = {
  id: "7c7bf910-2fd8-44af-965b-e5e6a6a6b040",
  userId: "e50f9967-9762-4deb-8cea-96fdf1591b36",
};
const appointment = {
  id: "e014086e-47b3-4c1f-8658-2aede4df8240",
  startDate: today.toDate(),
  endDate: today.clone().add(1, "hour").toDate(),
  doctorId: doctor.id,
  patientId: patient.id,
};
async function createDefaultDoctor() {
  return prisma.$transaction(async (tx) => {
    // Get the doctor role ID
    const doctorRole = await tx.role.findUnique({
      where: { name: "doctor" },
    });

    if (!doctorRole) {
      console.warn("Doctor role not found, skipping default doctor creation");
      return;
    }

    // Create or update user with doctor role
    const user = await tx.user.upsert({
      where: { id: doctor.userId },
      update: {
        email: "johndoe-doctor@healthmate.com",
        passwordHash: await hash("johndoe@123", BCRYPT_SALT_ROUNDS),
        emailVerified: true,
        isActive: true,
        roleId: doctorRole.id,
      },
      create: {
        id: doctor.userId,
        email: "johndoe-doctor@healthmate.com",
        passwordHash: await hash("johndoe@123", BCRYPT_SALT_ROUNDS),
        emailVerified: true,
        isActive: true,
        roleId: doctorRole.id,
      },
    });

    // Create doctor profile
    await tx.doctor.upsert({
      where: { id: doctor.id, userId: user.id },
      update: {
        firstName: "John",
        lastName: "Doe",
        gender: "male",
        phoneNumber: "+1-555-0123",
      },
      create: {
        id: doctor.id,
        userId: user.id,
        firstName: "John",
        lastName: "Doe",
        gender: "male",
        phoneNumber: "+1-555-0123",
      },
    });
  });
}

async function createDefaultPatient() {
  return prisma.$transaction(async (tx) => {
    // Get the patient role ID
    const patientRole = await tx.role.findUnique({
      where: { name: "patient" },
    });

    if (!patientRole) {
      console.warn("Patient role not found, skipping default patient creation");
      return;
    }

    // Create or update user with patient role
    const user = await tx.user.upsert({
      where: { id: patient.userId },
      update: {
        email: "johndoe-patient@healthmate.com",
        passwordHash: await hash("johndoe@123", BCRYPT_SALT_ROUNDS),
        emailVerified: true,
        isActive: true,
        roleId: patientRole.id,
      },
      create: {
        id: patient.userId,
        email: "johndoe-patient@healthmate.com",
        passwordHash: await hash("johndoe@123", BCRYPT_SALT_ROUNDS),
        emailVerified: true,
        isActive: true,
        roleId: patientRole.id,
      },
    });

    // Create patient profile
    await tx.patient.upsert({
      where: { id: patient.id, userId: user.id },
      update: {
        firstName: "John",
        lastName: "Doe",
        gender: "male",
        phoneNumber: "+1-555-0123",
        bloodGroup: "B+",
        dateOfBirth: new Date("2000-01-01"),
      },
      create: {
        id: patient.id,
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
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
      },
    });

    await tx.appointment.createMany({
      data: [
        {
          id: appointment.id,
          doctorId: appointment.doctorId,
          patientId: appointment.patientId,
          startTime: appointment.startDate,
          endTime: appointment.endDate,
        },
      ],
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
  await createDefaultDoctor();
  console.log(`Seeded sample doctor.`);
  await createDefaultPatient();
  console.log(`Seeded sample patient.`);
  await seedTestAppointments();
  console.log(`Seeded sample appointments.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
