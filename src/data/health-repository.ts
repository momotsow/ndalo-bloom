import "server-only";
import { prisma } from "./prisma-client";

/**
 * Repository interface consumed by the Application layer. The Application layer
 * depends on this abstraction, not on Prisma directly.
 */
export interface HealthRepository {
  /** Returns true if the database answered a trivial query. */
  checkConnectivity(): Promise<boolean>;
}

/**
 * Prisma-backed implementation. Verifies connectivity with a trivial `SELECT 1`
 * (FR-2) — no domain schema required.
 */
export const healthRepository: HealthRepository = {
  async checkConnectivity(): Promise<boolean> {
    const rows = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 as ok`;
    return rows.length > 0 && rows[0]?.ok === 1;
  },
};
