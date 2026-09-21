import "server-only";
import { prisma } from "@/data/prisma-client";
import type { ProductRelationshipType } from "@/domain/catalogue";

/**
 * Catalogue repository — the ONLY place Prisma is used for the catalogue (INV-3).
 *
 * Returns plain row shapes (not Prisma model *types* leaked upward): callers in the
 * application layer map these into validated read models. Availability is NOT read
 * here — it is derived in the application layer from the read-only stock provider.
 */

export interface VariantRow {
  id: string;
  name: string;
  sku: string;
  priceCents: number;
  position: number;
  stockKey: string | null;
}

export interface ImageRow {
  id: string;
  mediaRef: string;
  alt: string;
  role: "HERO" | "DETAIL" | "LIFESTYLE" | "UNBOXING";
  position: number;
}

export interface RefRow {
  id: string;
  slug: string;
  name: string;
}

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  story: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  category: RefRow;
  variants: VariantRow[];
  images: ImageRow[];
  ingredients: RefRow[];
  benefits: RefRow[];
  scents: RefRow[];
  moods: RefRow[];
  occasions: RefRow[];
}

const productDetailInclude = {
  category: { select: { id: true, slug: true, name: true } },
  variants: { orderBy: { position: "asc" } },
  images: { orderBy: { position: "asc" } },
  ingredients: {
    include: { ingredient: { select: { id: true, slug: true, name: true } } },
  },
  benefits: { include: { benefit: { select: { id: true, slug: true, name: true } } } },
  scents: { include: { scent: { select: { id: true, slug: true, name: true } } } },
  moods: { include: { mood: { select: { id: true, slug: true, name: true } } } },
  occasions: { include: { occasion: { select: { id: true, slug: true, name: true } } } },
} as const;

type RawProduct = Awaited<ReturnType<typeof prisma.product.findFirst>> &
  Record<string, unknown>;

function mapProduct(raw: RawProduct): ProductRow {
  const r = raw as unknown as {
    id: string;
    slug: string;
    name: string;
    story: string | null;
    description: string | null;
    seoTitle: string | null;
    seoDescription: string | null;
    category: RefRow;
    variants: VariantRow[];
    images: ImageRow[];
    ingredients: Array<{ ingredient: RefRow }>;
    benefits: Array<{ benefit: RefRow }>;
    scents: Array<{ scent: RefRow }>;
    moods: Array<{ mood: RefRow }>;
    occasions: Array<{ occasion: RefRow }>;
  };
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    story: r.story,
    description: r.description,
    seoTitle: r.seoTitle,
    seoDescription: r.seoDescription,
    category: r.category,
    variants: r.variants,
    images: r.images,
    ingredients: r.ingredients.map((x) => x.ingredient),
    benefits: r.benefits.map((x) => x.benefit),
    scents: r.scents.map((x) => x.scent),
    moods: r.moods.map((x) => x.mood),
    occasions: r.occasions.map((x) => x.occasion),
  };
}

export const catalogueRepository = {
  async findProductBySlug(slug: string): Promise<ProductRow | null> {
    const raw = await prisma.product.findFirst({
      where: { slug, status: "ACTIVE" },
      include: productDetailInclude,
    });
    return raw ? mapProduct(raw as RawProduct) : null;
  },

  async listActiveProducts(params: {
    categorySlug?: string;
    collectionSlug?: string;
    skip: number;
    take: number;
  }): Promise<{ rows: ProductRow[]; total: number }> {
    const where = {
      status: "ACTIVE" as const,
      ...(params.categorySlug ? { category: { slug: params.categorySlug } } : {}),
      ...(params.collectionSlug
        ? { collections: { some: { collection: { slug: params.collectionSlug } } } }
        : {}),
    };
    const [raws, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productDetailInclude,
        orderBy: { createdAt: "desc" },
        skip: params.skip,
        take: params.take,
      }),
      prisma.product.count({ where }),
    ]);
    return { rows: raws.map((r) => mapProduct(r as RawProduct)), total };
  },

  async categoryTree(): Promise<
    Array<{ id: string; slug: string; name: string; parentId: string | null }>
  > {
    return prisma.category.findMany({
      select: { id: true, slug: true, name: true, parentId: true },
      orderBy: { name: "asc" },
    });
  },

  async findCollectionBySlug(slug: string) {
    return prisma.collection.findUnique({ where: { slug } });
  },

  async relatedProductIds(
    productId: string,
    type?: ProductRelationshipType,
  ): Promise<Array<{ relatedProductId: string; type: string }>> {
    return prisma.productRelationship.findMany({
      where: { productId, ...(type ? { type } : {}) },
      select: { relatedProductId: true, type: true },
    });
  },

  async productsByIds(ids: readonly string[]): Promise<ProductRow[]> {
    if (ids.length === 0) return [];
    const raws = await prisma.product.findMany({
      where: { id: { in: [...ids] }, status: "ACTIVE" },
      include: productDetailInclude,
    });
    return raws.map((r) => mapProduct(r as RawProduct));
  },
};
