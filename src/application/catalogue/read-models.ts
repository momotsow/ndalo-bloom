import { z } from "zod";

/**
 * Catalogue read models + Zod schemas (Spec 2, FR-10/FR-11).
 *
 * These are the TRUSTED application-level contracts consumed by UI and (in future) AI.
 * They are validated at the application boundary before leaving the application layer.
 * No Prisma types are referenced here.
 */

export const availabilityStatusSchema = z.enum(["IN_STOCK", "LOW_STOCK", "OUT_OF_STOCK"]);

export const imageRoleSchema = z.enum(["HERO", "DETAIL", "LIFESTYLE", "UNBOXING"]);

export const relationshipTypeSchema = z.enum([
  "COMPLEMENTARY",
  "FREQUENTLY_BOUGHT_TOGETHER",
  "RELATED",
]);

export const referenceSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
});
export type Reference = z.infer<typeof referenceSchema>;

export const productImageSchema = z.object({
  id: z.string(),
  mediaRef: z.string(),
  alt: z.string(),
  role: imageRoleSchema,
  position: z.number().int(),
});
export type ProductImageReadModel = z.infer<typeof productImageSchema>;

export const productVariantSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  priceCents: z.number().int().nonnegative(),
  position: z.number().int(),
  availability: availabilityStatusSchema,
});
export type ProductVariantReadModel = z.infer<typeof productVariantSchema>;

/** Full product detail read model. Exposes moods[] and occasions[] directly (FR-7c). */
export const productReadModelSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  story: z.string().nullable(),
  description: z.string().nullable(),
  category: referenceSchema,
  fromPriceCents: z.number().int().nonnegative(),
  images: z.array(productImageSchema),
  variants: z.array(productVariantSchema),
  ingredients: z.array(referenceSchema),
  benefits: z.array(referenceSchema),
  scents: z.array(referenceSchema),
  moods: z.array(referenceSchema),
  occasions: z.array(referenceSchema),
  availability: availabilityStatusSchema,
  seo: z.object({
    title: z.string().nullable(),
    description: z.string().nullable(),
  }),
});
export type ProductReadModel = z.infer<typeof productReadModelSchema>;

/** Compact product summary for listings/grids. */
export const productSummarySchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  category: referenceSchema,
  heroImage: productImageSchema.nullable(),
  fromPriceCents: z.number().int().nonnegative(),
  availability: availabilityStatusSchema,
});
export type ProductSummary = z.infer<typeof productSummarySchema>;

export const categoryNodeSchema: z.ZodType<CategoryNode> = z.lazy(() =>
  z.object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    children: z.array(categoryNodeSchema),
  }),
);
export interface CategoryNode {
  id: string;
  slug: string;
  name: string;
  children: CategoryNode[];
}

export const collectionDetailSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  products: z.array(productSummarySchema),
});
export type CollectionDetail = z.infer<typeof collectionDetailSchema>;

export const recommendedProductSchema = z.object({
  product: productSummarySchema,
  reason: z.string(),
});
export type RecommendedProduct = z.infer<typeof recommendedProductSchema>;

export const pagedProductsSchema = z.object({
  items: z.array(productSummarySchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  hasMore: z.boolean(),
});
export type PagedProducts = z.infer<typeof pagedProductsSchema>;
