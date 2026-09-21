import { cloudinaryProvider } from "@/integrations/media/cloudinary-provider";
import type { MediaProvider } from "@/integrations/media/media-provider";
import type { ProductReadModel, ProductSummary } from "./read-models";
import type { ProductCardData } from "@/ui/catalogue/product-card";
import type { GalleryImage } from "@/ui/catalogue/product-gallery";

/**
 * View mappers (application layer): resolve media URLs via the MediaProvider boundary
 * and shape read models into the plain props presentational components expect. This
 * keeps UI free of any provider SDK usage (INV-3/INV-5).
 */

export function toProductCard(
  summary: ProductSummary,
  media: MediaProvider = cloudinaryProvider,
): ProductCardData {
  return {
    slug: summary.slug,
    name: summary.name,
    heroImage: summary.heroImage
      ? { mediaRef: summary.heroImage.mediaRef, alt: summary.heroImage.alt }
      : null,
    fromPriceCents: summary.fromPriceCents,
    availability: summary.availability,
    imageUrl: summary.heroImage
      ? media.getDeliveryUrl(summary.heroImage.mediaRef, { width: 600 })
      : null,
  };
}

export function toGalleryImages(
  product: ProductReadModel,
  media: MediaProvider = cloudinaryProvider,
): GalleryImage[] {
  return product.images.map((img) => ({
    id: img.id,
    url: media.getDeliveryUrl(img.mediaRef, { width: 1000 }),
    alt: img.alt,
  }));
}
