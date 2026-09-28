import { cartRepository as defaultCartRepository } from "@/data/cart/cart-repository";
import { cartCatalogueRepository as defaultCartCatalogueRepository } from "@/data/cart/cart-catalogue-repository";
import type { CartVariantFactsRow } from "@/data/cart/cart-catalogue-repository";
import { devStockAvailabilityProvider } from "@/data/catalogue/dev-stock-availability-provider";
import type { ReadOnlyStockAvailabilityProvider } from "@/application/catalogue/stock-availability-port";
import {
  deriveAvailability,
  DEFAULT_LOW_STOCK_THRESHOLD,
  AvailabilityStatus,
} from "@/domain/catalogue";
import {
  computeLineSubtotalCents,
  computeSubtotalCents,
  MAX_QUANTITY,
} from "@/domain/cart";
import { cartErrors } from "./errors";
import { generateCartToken, nextExpiry } from "./cart-token";
import {
  cartReadModelSchema,
  type CartReadModel,
  type CartLineReadModel,
  type CartNotice,
} from "./read-models";

/**
 * CartService (Spec 3, §2). Orchestrates the guest cart use-cases. Composes the pure
 * domain, the (Prisma-only) repositories, the catalogue read-through, the read-only stock
 * provider, and the domain money math. Server-authoritative: price/availability/totals are
 * always computed here from CURRENT catalogue data — never from the client.
 *
 * Token/cookie I/O is performed by the app/route layer; this service receives the current
 * token (or undefined) and returns the token to persist alongside the read model.
 */

export interface CartContext {
  /** Current guest cart token from the request cookie (if any). */
  readonly token?: string;
}

export interface CartResult {
  /** The token that the caller MUST set/refresh in the cookie. */
  readonly token: string;
  /** Cookie/retention expiry to apply. */
  readonly expiresAt: Date;
  readonly cart: CartReadModel;
}

/** Repository shapes the service depends on (enables DB-free testing via injection). */
export type CartRepositoryLike = typeof defaultCartRepository;
export type CartCatalogueRepositoryLike = typeof defaultCartCatalogueRepository;

export function createCartService(deps?: {
  stock?: ReadOnlyStockAvailabilityProvider;
  lowStockThreshold?: number;
  cartRepo?: CartRepositoryLike;
  catalogueRepo?: CartCatalogueRepositoryLike;
}) {
  const stock = deps?.stock ?? devStockAvailabilityProvider;
  const threshold = deps?.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
  const cartRepository = deps?.cartRepo ?? defaultCartRepository;
  const cartCatalogueRepository = deps?.catalogueRepo ?? defaultCartCatalogueRepository;

  async function getOrCreateCart(token?: string) {
    if (token) {
      const existing = await cartRepository.findByToken(token);
      // Expired carts are treated as absent (§5).
      if (existing && existing.expiresAt.getTime() > Date.now()) {
        return existing;
      }
    }
    const newToken = generateCartToken();
    return cartRepository.create(newToken, nextExpiry());
  }

  async function buildReadModel(
    cartId: string,
    extraNotices: CartNotice[] = [],
  ): Promise<CartReadModel> {
    const items = await cartRepository.listItems(cartId);
    const variantIds = items.map((i) => i.variantId);
    const facts = await cartCatalogueRepository.resolveVariantFacts(variantIds);
    const factByVariant = new Map<string, CartVariantFactsRow>(
      facts.map((f) => [f.variantId, f]),
    );

    // Availability via the read-only provider (advisory; no stock mutation).
    const stockKeys = facts.map((f) => f.stockKey).filter((k): k is string => Boolean(k));
    const quantities = await stock.getQuantities(stockKeys);

    const lines: CartLineReadModel[] = [];
    const notices: CartNotice[] = [...extraNotices];
    const priceRefUpdates: Array<{
      cartId: string;
      variantId: string;
      priceCents: number;
    }> = [];
    let anyPriceUpdated = false;

    for (const item of items) {
      const f = factByVariant.get(item.variantId);

      if (!f) {
        // Unresolvable / inactive variant → keep line, flag unavailable (FR-7).
        lines.push({
          variantId: item.variantId,
          productSlug: null,
          productName: null,
          variantName: null,
          unitPriceCents: 0,
          quantity: item.quantity,
          lineSubtotalCents: 0,
          availability: AvailabilityStatus.OUT_OF_STOCK,
          unavailable: true,
          priceUpdated: false,
          heroImage: null,
        });
        continue;
      }

      const availability = f.stockKey
        ? deriveAvailability(quantities.get(f.stockKey) ?? null, threshold)
        : AvailabilityStatus.OUT_OF_STOCK;
      const unavailable = availability === AvailabilityStatus.OUT_OF_STOCK;

      // Price is ALWAYS the current authoritative catalogue price.
      const unitPriceCents = f.priceCents;
      const priceUpdated =
        item.lastPresentedPriceCents !== null &&
        item.lastPresentedPriceCents !== unitPriceCents;
      if (priceUpdated) {
        anyPriceUpdated = true;
        notices.push({ type: "PRICE_UPDATED", variantId: item.variantId });
      }
      // Record the current price as the new "last presented" reference (non-authoritative).
      priceRefUpdates.push({
        cartId,
        variantId: item.variantId,
        priceCents: unitPriceCents,
      });

      lines.push({
        variantId: item.variantId,
        productSlug: f.productSlug,
        productName: f.productName,
        variantName: f.variantName,
        unitPriceCents,
        quantity: item.quantity,
        lineSubtotalCents: computeLineSubtotalCents(unitPriceCents, item.quantity),
        availability,
        unavailable,
        priceUpdated,
        heroImage:
          f.heroMediaRef && f.heroAlt !== null
            ? { mediaRef: f.heroMediaRef, alt: f.heroAlt }
            : null,
      });
    }

    // Persist the non-authoritative price-change reference AFTER computing priceUpdated,
    // so the indicator shows once per change (§8).
    await cartRepository.setLastPresentedPrices(priceRefUpdates);

    const itemCount = lines.reduce((n, l) => n + l.quantity, 0);
    const subtotalCents = computeSubtotalCents(lines.map((l) => l.lineSubtotalCents));

    return cartReadModelSchema.parse({
      cartId,
      currency: "ZAR",
      lines,
      itemCount,
      subtotalCents,
      anyPriceUpdated,
      notices,
    });
  }

  /** Assert a variant exists and its product is ACTIVE (purchasable) at add-time (FR-6). */
  async function assertPurchasable(variantId: string): Promise<void> {
    const facts = await cartCatalogueRepository.resolveVariantFacts([variantId]);
    if (facts.length === 0) {
      throw cartErrors.variantNotPurchasable();
    }
  }

  return {
    async getCart(ctx: CartContext): Promise<CartResult> {
      const cart = await getOrCreateCart(ctx.token);
      const expiresAt = nextExpiry();
      await cartRepository.touch(cart.id, expiresAt);
      const model = await buildReadModel(cart.id);
      return { token: cart.token, expiresAt, cart: model };
    },

    async addItem(
      ctx: CartContext,
      input: { variantId: string; quantity: number },
    ): Promise<CartResult> {
      await assertPurchasable(input.variantId);
      const cart = await getOrCreateCart(ctx.token);
      const expiresAt = nextExpiry();
      const { quantity } = await cartRepository.addItemAtomic({
        cartId: cart.id,
        variantId: input.variantId,
        requested: input.quantity,
        expiresAt,
      });
      const clamped = quantity >= MAX_QUANTITY && input.quantity >= 1;
      const notices: CartNotice[] = clamped
        ? [{ type: "MAX_QUANTITY_REACHED", variantId: input.variantId }]
        : [];
      const model = await buildReadModel(cart.id, notices);
      return { token: cart.token, expiresAt, cart: model };
    },

    async updateItemQuantity(
      ctx: CartContext,
      input: { variantId: string; quantity: number },
    ): Promise<CartResult> {
      const cart = await getOrCreateCart(ctx.token);
      const expiresAt = nextExpiry();
      await cartRepository.setItemQuantity({
        cartId: cart.id,
        variantId: input.variantId,
        quantity: input.quantity,
        expiresAt,
      });
      const model = await buildReadModel(cart.id);
      return { token: cart.token, expiresAt, cart: model };
    },

    async removeItem(
      ctx: CartContext,
      input: { variantId: string },
    ): Promise<CartResult> {
      const cart = await getOrCreateCart(ctx.token);
      const expiresAt = nextExpiry();
      await cartRepository.deleteItem({
        cartId: cart.id,
        variantId: input.variantId,
        expiresAt,
      });
      const model = await buildReadModel(cart.id);
      return { token: cart.token, expiresAt, cart: model };
    },

    async clearCart(ctx: CartContext): Promise<CartResult> {
      const cart = await getOrCreateCart(ctx.token);
      const expiresAt = nextExpiry();
      await cartRepository.deleteAllItems({ cartId: cart.id, expiresAt });
      const model = await buildReadModel(cart.id);
      return { token: cart.token, expiresAt, cart: model };
    },
  };
}

export const cartService = createCartService();
export type CartService = ReturnType<typeof createCartService>;
