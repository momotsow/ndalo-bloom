import {
  catalogueRepository,
  type ProductRow,
} from "@/data/catalogue/catalogue-repository";
import { devStockAvailabilityProvider } from "@/data/catalogue/dev-stock-availability-provider";
import {
  deriveAvailability,
  DEFAULT_LOW_STOCK_THRESHOLD,
  AvailabilityStatus,
} from "@/domain/catalogue";
import type { ReadOnlyStockAvailabilityProvider } from "./stock-availability-port";
import {
  productReadModelSchema,
  productSummarySchema,
  pagedProductsSchema,
  type ProductReadModel,
  type ProductSummary,
  type PagedProducts,
  type CategoryNode,
} from "./read-models";

/**
 * CatalogueService — trusted application contract (Spec 2, FR-10/FR-11).
 *
 * Composes the (Prisma-only) repository with the read-only stock provider and the pure
 * domain availability derivation, then validates outputs with Zod before returning.
 * UI and future AI consume this service, never Prisma.
 */
export function createCatalogueService(deps?: {
  stock?: ReadOnlyStockAvailabilityProvider;
  lowStockThreshold?: number;
}) {
  const stock = deps?.stock ?? devStockAvailabilityProvider;
  const threshold = deps?.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;

  async function availabilityByStockKey(
    rows: ProductRow[],
  ): Promise<Map<string, AvailabilityStatus>> {
    const keys = rows
      .flatMap((p) => p.variants.map((v) => v.stockKey))
      .filter((k): k is string => Boolean(k));
    const quantities = await stock.getQuantities(keys);
    const byKey = new Map<string, AvailabilityStatus>();
    for (const key of keys) {
      byKey.set(key, deriveAvailability(quantities.get(key) ?? null, threshold));
    }
    return byKey;
  }

  function rollUp(statuses: AvailabilityStatus[]): AvailabilityStatus {
    if (statuses.some((s) => s === AvailabilityStatus.IN_STOCK))
      return AvailabilityStatus.IN_STOCK;
    if (statuses.some((s) => s === AvailabilityStatus.LOW_STOCK))
      return AvailabilityStatus.LOW_STOCK;
    return AvailabilityStatus.OUT_OF_STOCK;
  }

  function toDetail(
    p: ProductRow,
    byKey: Map<string, AvailabilityStatus>,
  ): ProductReadModel {
    const variants = p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      priceCents: v.priceCents,
      position: v.position,
      availability: v.stockKey
        ? (byKey.get(v.stockKey) ?? AvailabilityStatus.OUT_OF_STOCK)
        : AvailabilityStatus.OUT_OF_STOCK,
    }));
    const fromPriceCents = variants.length
      ? Math.min(...variants.map((v) => v.priceCents))
      : 0;
    return productReadModelSchema.parse({
      id: p.id,
      slug: p.slug,
      name: p.name,
      story: p.story,
      description: p.description,
      category: p.category,
      fromPriceCents,
      images: p.images,
      variants,
      ingredients: p.ingredients,
      benefits: p.benefits,
      scents: p.scents,
      moods: p.moods,
      occasions: p.occasions,
      availability: rollUp(variants.map((v) => v.availability)),
      seo: { title: p.seoTitle, description: p.seoDescription },
    });
  }

  function toSummary(
    p: ProductRow,
    byKey: Map<string, AvailabilityStatus>,
  ): ProductSummary {
    const prices = p.variants.map((v) => v.priceCents);
    const statuses = p.variants.map((v) =>
      v.stockKey
        ? (byKey.get(v.stockKey) ?? AvailabilityStatus.OUT_OF_STOCK)
        : AvailabilityStatus.OUT_OF_STOCK,
    );
    const hero = p.images.find((i) => i.role === "HERO") ?? p.images[0] ?? null;
    return productSummarySchema.parse({
      id: p.id,
      slug: p.slug,
      name: p.name,
      category: p.category,
      heroImage: hero,
      fromPriceCents: prices.length ? Math.min(...prices) : 0,
      availability: rollUp(statuses),
    });
  }

  return {
    async getProductBySlug(slug: string): Promise<ProductReadModel | null> {
      const row = await catalogueRepository.findProductBySlug(slug);
      if (!row) return null;
      const byKey = await availabilityByStockKey([row]);
      return toDetail(row, byKey);
    },

    async listProducts(params: {
      categorySlug?: string;
      collectionSlug?: string;
      page?: number;
      pageSize?: number;
    }): Promise<PagedProducts> {
      const page = Math.max(1, params.page ?? 1);
      const pageSize = Math.min(48, Math.max(1, params.pageSize ?? 12));
      const { rows, total } = await catalogueRepository.listActiveProducts({
        categorySlug: params.categorySlug,
        collectionSlug: params.collectionSlug,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });
      const byKey = await availabilityByStockKey(rows);
      return pagedProductsSchema.parse({
        items: rows.map((r) => toSummary(r, byKey)),
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
      });
    },

    async getCategoryTree(): Promise<CategoryNode[]> {
      const rows = await catalogueRepository.categoryTree();
      const byParent = new Map<string | null, typeof rows>();
      for (const row of rows) {
        const list = byParent.get(row.parentId) ?? [];
        list.push(row);
        byParent.set(row.parentId, list);
      }
      const build = (parentId: string | null): CategoryNode[] =>
        (byParent.get(parentId) ?? []).map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          children: build(c.id),
        }));
      return build(null);
    },

    // Exposed for RecommendationService reuse.
    _toSummary: toSummary,
    _availabilityByStockKey: availabilityByStockKey,
  };
}

export const catalogueService = createCatalogueService();
export type CatalogueService = ReturnType<typeof createCatalogueService>;
