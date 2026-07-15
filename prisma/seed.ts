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
      where: { email: "johndoe-doctor@healthmate.com" },
      update: {
        emailVerified: true,
        isActive: true,
        roleId: doctorRole.id,
      },
      create: {
        email: "johndoe-doctor@healthmate.com",
        passwordHash: await hash("johndoe@123", BCRYPT_SALT_ROUNDS),
        emailVerified: true,
        isActive: true,
        roleId: doctorRole.id,
      },
    });

    // Create doctor profile
    return tx.doctor.upsert({
      where: { userId: user.id },
      update: {
        firstName: "John",
        lastName: "Doe",
        gender: "male",
        phoneNumber: "+1-555-0123",
      },
      create: {
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
      where: { email: "johndoe-patient@healthmate.com" },
      update: {
        emailVerified: true,
        isActive: true,
        roleId: patientRole.id,
      },
      create: {
        email: "johndoe-patient@healthmate.com",
        passwordHash: await hash("johndoe@123", BCRYPT_SALT_ROUNDS),
        emailVerified: true,
        isActive: true,
        roleId: patientRole.id,
      },
    });

    // Create patient profile
    return tx.patient.upsert({
      where: { userId: user.id },
      update: {
        firstName: "John",
        lastName: "Doe",
        gender: "male",
        phoneNumber: "+1-555-0123",
        bloodGroup: "B+",
        dateOfBirth: new Date("2000-01-01"),
      },
      create: {
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

async function seedTestAppointments(patientId: string, doctorId: string) {
  await prisma.$transaction(async (tx) => {
    await tx.appointment.deleteMany({
      where: { patientId: patientId, doctorId: doctorId },
    });

    const today = moment().add(1, "hour").startOf("hour");
    await tx.appointment.createMany({
      data: [
        {
          doctorId: doctorId,
          patientId: patientId,
          startTime: today.toDate(),
          endTime: today.add(1, "hour").toDate(),
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
  const doctor = await createDefaultDoctor();
  console.log(`Seeded sample doctor.`);
  const patient = await createDefaultPatient();
  console.log(`Seeded sample patient.`);
  await seedTestAppointments(patient?.id as string, doctor?.id as string);
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
