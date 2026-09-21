import { PrismaClient } from "@prisma/client";

/**
 * Shared helpers for DB-backed integration tests. These require DATABASE_URL (Neon
 * development branch) and are only run in the CI db-verification job. The seed
 * (`npm run db:seed`) is expected to have run before these tests.
 */
export const prisma = new PrismaClient();

export function requireDatabaseUrl(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required for integration tests (Neon development branch).",
    );
  }
}
