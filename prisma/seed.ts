import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://postgres@localhost:5432/healthmate?sslmode=disable';

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

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

async function createDefaultDoctor() {
  await prisma.$transaction(async (tx) => {
    // Get the doctor role ID
    const doctorRole = await tx.role.findUnique({
      where: { name: 'doctor' },
    });

    if (!doctorRole) {
      console.warn('Doctor role not found, skipping default doctor creation');
      return;
    }

    // Create or update user with doctor role
    const user = await tx.user.upsert({
      where: { email: 'johndoe@healthmate.com' },
      update: {
        emailVerified: true,
        isActive: true,
        roleId: doctorRole.id,
      },
      create: {
        email: 'johndoe@healthmate.com',
        passwordHash: '$2b$10$J3xMuGhrvRNDNg8HU8X6MuZuQ.vOBkb9Ys81d7CGdp/3jrxIen6nS',
        emailVerified: true,
        isActive: true,
        roleId: doctorRole.id,
      },
    });

    // Create doctor profile
    await tx.doctor.upsert({
      where: { userId: user.id },
      update: {
        firstName: 'John',
        lastName: 'Doe',
        gender: 'Male',
        phoneNumber: '+1-555-0123',
      },
      create: {
        userId: user.id,
        firstName: 'John',
        lastName: 'Doe',
        gender: 'Male',
        phoneNumber: '+1-555-0123',
      },
    });

    console.log('Default doctor created or updated: Dr. John Doe');
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
