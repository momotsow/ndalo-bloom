import { z } from "zod";
import { createConfig } from "./env";

/**
 * PUBLIC / BROWSER configuration.
 *
 * Only `NEXT_PUBLIC_*` values, which are safe to include in the client bundle.
 * MUST NOT contain secrets. This module may be imported from client components.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export type PublicConfig = z.infer<typeof publicSchema>;

/**
 * Public config is safe to read eagerly because it contains no secrets and has
 * defaults suitable for local development.
 */
export const loadPublicConfig = createConfig("public", publicSchema);
