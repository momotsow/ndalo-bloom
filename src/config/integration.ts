import "server-only";
import { z } from "zod";
import { createConfig } from "./env";

/**
 * INTEGRATION configuration (per-provider secrets).
 *
 * Validated LAZILY, per provider, on first use of that provider's adapter
 * (feature-scoped). A feature that never touches a provider never requires that
 * provider's configuration (FR-7).
 *
 * Foundation defines the shapes; concrete adapters are implemented in later Specs.
 */

const cloudinarySchema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
});

const resendSchema = z.object({
  RESEND_API_KEY: z.string().min(1),
});

const openAiSchema = z.object({
  OPENAI_API_KEY: z.string().min(1),
});

const postHogSchema = z.object({
  POSTHOG_API_KEY: z.string().min(1),
  POSTHOG_HOST: z.string().url().optional(),
});

export const loadCloudinaryConfig = createConfig("cloudinary", cloudinarySchema);
export const loadResendConfig = createConfig("resend", resendSchema);
export const loadOpenAiConfig = createConfig("openai", openAiSchema);
export const loadPostHogConfig = createConfig("posthog", postHogSchema);
