import "server-only";
import { PrismaClient } from "@prisma/client";

/**
 * Singleton Prisma client. This is the ONLY module allowed to construct a Prisma
 * client. All persistence access flows through repositories in this layer.
 *
 * The client is memoized on globalThis in development to survive HMR reloads.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
