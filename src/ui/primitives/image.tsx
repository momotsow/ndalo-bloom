import NextImage, { type ImageProps as NextImageProps } from "next/image";

/**
 * Image primitive.
 *
 * Wraps next/image so alt text is REQUIRED (accessibility) and optimization
 * defaults are consistent. Media-provider (Cloudinary) integration is added in a
 * later Spec — this primitive stays provider-agnostic.
 */
export type ImageProps = Omit<NextImageProps, "alt"> & {
  /** Alt text is mandatory. Use alt="" only for decorative images. */
  readonly alt: string;
};

export function Image({ alt, ...props }: ImageProps) {
  return <NextImage alt={alt} {...props} />;
}
