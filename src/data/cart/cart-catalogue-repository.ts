import "server-only";
import { prisma } from "@/data/prisma-client";

/**
 * Cart catalogue read-through (Spec 3, §7). Resolves CURRENT catalogue facts for a set of
 * variant ids so the cart never becomes an independent source of truth. Prisma-only (data
 * layer). Returns plain rows; the application layer maps to read models and derives
 * availability + price-updated + subtotals.
 *
 * A variant that cannot be resolved (deleted or product not ACTIVE) is simply absent from
 * the result; the application keeps the cart line and flags it unavailable (FR-7).
 */

export interface CartVariantFactsRow {
  variantId: string;
  variantName: string;
  priceCents: number;
  stockKey: string | null;
  productName: string;
  productSlug: string;
  heroMediaRef: string | null;
  heroAlt: string | null;
}

export const cartCatalogueRepository = {
  async resolveVariantFacts(
    variantIds: readonly string[],
  ): Promise<CartVariantFactsRow[]> {
    if (variantIds.length === 0) return [];
    const rows = await prisma.productVariant.findMany({
      where: {
        id: { in: [...variantIds] },
        product: { status: "ACTIVE" },
      },
      select: {
        id: true,
        name: true,
        priceCents: true,
        stockKey: true,
        product: {
          select: {
            name: true,
            slug: true,
            images: {
              where: { role: "HERO" },
              orderBy: { position: "asc" },
              take: 1,
              select: { mediaRef: true, alt: true },
            },
          },
        },
      },
    });

    return rows.map((r) => {
      const hero = r.product.images[0] ?? null;
      return {
        variantId: r.id,
        variantName: r.name,
        priceCents: r.priceCents,
        stockKey: r.stockKey,
        productName: r.product.name,
        productSlug: r.product.slug,
        heroMediaRef: hero?.mediaRef ?? null,
        heroAlt: hero?.alt ?? null,
      };
    });
  },
};
