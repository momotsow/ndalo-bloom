/**
 * MediaProvider abstraction (interface only in Foundation).
 *
 * Concrete adapter (Cloudinary) is implemented in a later Spec. UI never imports
 * a provider SDK directly; it consumes media through application services that use
 * this interface.
 */
export interface MediaTransformOptions {
  readonly width?: number;
  readonly height?: number;
  readonly format?: "auto" | "webp" | "avif";
}

export interface MediaProvider {
  /** Returns an optimized, transformed delivery URL for a stored asset. */
  getDeliveryUrl(publicId: string, options?: MediaTransformOptions): string;
}
