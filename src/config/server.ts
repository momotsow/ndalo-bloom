import "server-only";
import { z } from "zod";
import { createConfig } from "./env";

/**
 * SERVER-ONLY configuration (secrets).
 *
 * The `server-only` import guarantees a build-time error if this module is ever
 * imported into a client bundle, preventing secret leakage (FR-7).
 *
 * Validation is feature-scoped: `loadServerConfig()` is called by the server-side
 * feature that needs these values, not at application startup.
 */
const serverSchema = z.object({
  // Database connectivity (Neon PostgreSQL for Foundation development).
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Better Auth server secret (used only within the auth layer).
  BETTER_AUTH_SECRET: z.string().min(1, "BETTER_AUTH_SECRET is required"),
  BETTER_AUTH_URL: z.string().url().optional(),
});

export type ServerConfig = z.infer<typeof serverSchema>;

export const loadServerConfig = createConfig("server", serverSchema);
