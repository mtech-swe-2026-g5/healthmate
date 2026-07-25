import { hash } from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://localhost:5432/healthmate?sslmode=disable';

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const BCRYPT_SALT_ROUNDS = 10;
const MVP_DOCTOR_PASSWORD = 'Doctor@123';

const ROLES = [
  {
    name: 'patient',
    description: 'Patient: book appointments and manage health records',
  },
  {
    name: 'doctor',
    description: 'Doctor: manage schedules and view patient appointments',
  },
  {
    name: 'admin',
    description: 'Admin: full system access and user management',
  },
] as const;

/** Mon–Sat (1–6): 11:00–19:00, 60-minute slots. Sunday omitted / inactive. */
const WORKING_HOURS = [
  { dayOfWeek: 0, startTime: '11:00', endTime: '19:00', isActive: false },
  { dayOfWeek: 1, startTime: '11:00', endTime: '19:00', isActive: true },
  { dayOfWeek: 2, startTime: '11:00', endTime: '19:00', isActive: true },
  { dayOfWeek: 3, startTime: '11:00', endTime: '19:00', isActive: true },
  { dayOfWeek: 4, startTime: '11:00', endTime: '19:00', isActive: true },
  { dayOfWeek: 5, startTime: '11:00', endTime: '19:00', isActive: true },
  { dayOfWeek: 6, startTime: '11:00', endTime: '19:00', isActive: true },
] as const;

const DOCTORS = [
  {
    email: 'dr.patel@healthmate.local',
    firstName: 'Ananya',
    lastName: 'Patel',
    specialization: 'General Physician',
  },
  {
    email: 'dr.singh@healthmate.local',
    firstName: 'Rohan',
    lastName: 'Singh',
    specialization: 'Cardiology',
  },
  {
    email: 'dr.mehta@healthmate.local',
    firstName: 'Priya',
    lastName: 'Mehta',
    specialization: 'Dermatology',
  },
  {
    email: 'dr.khan@healthmate.local',
    firstName: 'Imran',
    lastName: 'Khan',
    specialization: 'Orthopedics',
  },
] as const;

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
    where: { name: 'doctor' },
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
