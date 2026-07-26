import "dotenv/config";
import { defineConfig } from "prisma/config";

import { normalizeDatabaseUrl } from "./src/lib/database-url";

// Fallback for `prisma generate` in CI/local install before .env exists.
// Migrate/seed still require a real DATABASE_URL in .env.
const databaseUrl = normalizeDatabaseUrl(
  process.env.DATABASE_URL ??
    "postgresql://postgres@localhost:5432/healthmate?sslmode=disable",
);

export default defineConfig({
  schema: "prisma/",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
});
