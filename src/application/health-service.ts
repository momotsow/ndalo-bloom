import { healthRepository, type HealthRepository } from "@/data/health-repository";

export interface HealthStatus {
  readonly database: "up" | "down";
}

/**
 * Application service orchestrating a health check. Route handlers call this
 * service; they never touch Prisma directly (FR-8).
 */
export function createHealthService(repository: HealthRepository = healthRepository) {
  return {
    async getStatus(): Promise<HealthStatus> {
      try {
        const ok = await repository.checkConnectivity();
        return { database: ok ? "up" : "down" };
      } catch {
        return { database: "down" };
      }
    },
  };
}

export const healthService = createHealthService();
