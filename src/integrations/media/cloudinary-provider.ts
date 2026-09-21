import { loadCloudinaryConfig } from "@/config/integration";
import type { MediaProvider, MediaTransformOptions } from "./media-provider";

/**
 * Cloudinary implementation of MediaProvider (Spec 2).
 *
 * Builds delivery URLs using Cloudinary's URL transformation scheme. This is the ONLY
 * place Cloudinary specifics live; UI and application code depend on the MediaProvider
 * interface. If no cloud name is configured (e.g. local dev without Cloudinary), a
 * deterministic placeholder image service is used so the UX can be validated with
 * temporary, non-production imagery.
 */
export function createCloudinaryProvider(): MediaProvider {
  return {
    getDeliveryUrl(publicId: string, options?: MediaTransformOptions): string {
      const cloudName = safeCloudName();
      if (!cloudName) {
        return placeholderUrl(publicId, options);
      }
      const parts: string[] = ["f_auto", "q_auto"];
      if (options?.width) parts.push(`w_${options.width}`);
      if (options?.height) parts.push(`h_${options.height}`);
      if (options?.format && options.format !== "auto") {
        parts.push(`f_${options.format}`);
      }
      const transform = parts.join(",");
      return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${publicId}`;
    },
  };
}

function safeCloudName(): string | null {
  try {
    return loadCloudinaryConfig().CLOUDINARY_CLOUD_NAME;
  } catch {
    return null;
  }
}

/** TEMPORARY non-production placeholder (deterministic by publicId). */
function placeholderUrl(publicId: string, options?: MediaTransformOptions): string {
  const w = options?.width ?? 800;
  const h = options?.height ?? Math.round((w * 5) / 4);
  let seed = 0;
  for (let i = 0; i < publicId.length; i += 1) {
    seed = (seed * 31 + publicId.charCodeAt(i)) % 1000;
  }
  return `https://picsum.photos/seed/ndalo-${seed}/${w}/${h}`;
}

export const cloudinaryProvider: MediaProvider = createCloudinaryProvider();
