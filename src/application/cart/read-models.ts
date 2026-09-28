import { z } from "zod";
import { availabilityStatusSchema } from "@/application/catalogue/read-models";

/**
 * Cart read models + Zod schemas (Spec 3, FR-4/FR-10). Trusted application contracts
 * consumed by UI. Validated at the application boundary. Subtotal ONLY — no tax, shipping,
 * or discount computation (PM-4). Display facts are resolved from current catalogue.
 */

export const cartNoticeSchema = z.object({
  type: z.enum(["MAX_QUANTITY_REACHED", "PRICE_UPDATED"]),
  variantId: z.string().optional(),
});
export type CartNotice = z.infer<typeof cartNoticeSchema>;

export const cartLineReadModelSchema = z.object({
  variantId: z.string(),
  productSlug: z.string().nullable(),
  productName: z.string().nullable(),
  variantName: z.string().nullable(),
  unitPriceCents: z.number().int().nonnegative(),
  quantity: z.number().int(),
  lineSubtotalCents: z.number().int().nonnegative(),
  availability: availabilityStatusSchema,
  unavailable: z.boolean(),
  priceUpdated: z.boolean(),
  heroImage: z.object({ mediaRef: z.string(), alt: z.string() }).nullable(),
});
export type CartLineReadModel = z.infer<typeof cartLineReadModelSchema>;

export const cartReadModelSchema = z.object({
  cartId: z.string(),
  currency: z.literal("ZAR"),
  lines: z.array(cartLineReadModelSchema),
  itemCount: z.number().int().nonnegative(),
  subtotalCents: z.number().int().nonnegative(),
  anyPriceUpdated: z.boolean(),
  notices: z.array(cartNoticeSchema),
});
export type CartReadModel = z.infer<typeof cartReadModelSchema>;

/** Input schemas for cart mutations (validated at the boundary, V-1). */
export const addItemInputSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});
export const updateItemInputSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.number().int().min(1).max(99),
});
export const removeItemInputSchema = z.object({
  variantId: z.string().min(1),
});
export type AddItemInput = z.infer<typeof addItemInputSchema>;
export type UpdateItemInput = z.infer<typeof updateItemInputSchema>;
export type RemoveItemInput = z.infer<typeof removeItemInputSchema>;
