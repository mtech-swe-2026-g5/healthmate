import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://localhost:5432/healthmate?sslmode=disable';

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

async function main() {
  for (const role of ROLES) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  console.log(`Seeded ${ROLES.length} roles.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
