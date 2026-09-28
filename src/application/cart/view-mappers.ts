import { cloudinaryProvider } from "@/integrations/media/cloudinary-provider";
import type { MediaProvider } from "@/integrations/media/media-provider";
import type { CartLineReadModel } from "./read-models";

/**
 * Cart view mapper (application layer): resolves the hero image URL for a cart line via
 * the MediaProvider boundary, so UI never imports a provider SDK (INV-3/INV-5).
 */
export interface CartLineView {
  readonly line: CartLineReadModel;
  readonly imageUrl: string | null;
  readonly alt: string;
}

export function toCartLineView(
  line: CartLineReadModel,
  media: MediaProvider = cloudinaryProvider,
): CartLineView {
  const imageUrl = line.heroImage
    ? media.getDeliveryUrl(line.heroImage.mediaRef, { width: 200 })
    : null;
  return {
    line,
    imageUrl,
    alt: line.heroImage?.alt ?? line.productName ?? "Product image",
  };
}
