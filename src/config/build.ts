import { z } from "zod";
import { createConfig } from "./env";

/**
 * BUILD-TIME configuration.
 *
 * Only variables GENUINELY required during the build process (FR-7). Keep this
 * minimal. Runtime-only secrets do NOT belong here and MUST NOT be validated at
 * build time.
 *
 * Currently there are no mandatory build-time variables; NODE_ENV is optional and
 * defaults appropriately. This module exists so that any future genuinely
 * build-required variable has a single validated home.
 */
const buildSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type BuildConfig = z.infer<typeof buildSchema>;

export const loadBuildConfig = createConfig("build", buildSchema);
