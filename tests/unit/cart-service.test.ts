import { describe, it, expect } from "vitest";
import { createCartService } from "@/application/cart/cart-service";
import type { CartRow, CartItemRow } from "@/data/cart/cart-repository";
import type { CartVariantFactsRow } from "@/data/cart/cart-catalogue-repository";
import type { ReadOnlyStockAvailabilityProvider } from "@/application/catalogue/stock-availability-port";

/**
 * CartService application tests (Spec 3, T-2). DB-free via injected stub repositories and
 * a stub stock provider. Proves: current-price-at-read, priceUpdated per-line + cart-level,
 * keep-and-flag unavailable, server-authoritative subtotal math.
 */

function fixedTimeCart(): CartRow {
  return { id: "cart1", token: "tok", expiresAt: new Date(Date.now() + 60_000) };
}

function stubStock(
  map: Record<string, number | null>,
): ReadOnlyStockAvailabilityProvider {
  return {
    async getQuantities(keys) {
      return new Map(keys.map((k) => [k, map[k] ?? null]));
    },
  };
}

/** Build a stub cart repo backed by an in-memory item list. */
function stubCartRepo(items: CartItemRow[]) {
  const priceRefWrites: Array<{ variantId: string; priceCents: number }> = [];
  return {
    repo: {
      async findByToken() {
        return fixedTimeCart();
      },
      async create() {
        return fixedTimeCart();
      },
      async listItems() {
        return items;
      },
      async addItemAtomic() {
        return { quantity: 1 };
      },
      async setItemQuantity() {},
      async deleteItem() {},
      async deleteAllItems() {},
      async touch() {},
      async setLastPresentedPrices(
        updates: ReadonlyArray<{ variantId: string; priceCents: number }>,
      ) {
        for (const u of updates)
          priceRefWrites.push({ variantId: u.variantId, priceCents: u.priceCents });
      },
    },
    priceRefWrites,
  };
}

function stubCatalogueRepo(facts: CartVariantFactsRow[]) {
  return {
    async resolveVariantFacts(ids: readonly string[]) {
      return facts.filter((f) => ids.includes(f.variantId));
    },
  };
}

const baseFacts: CartVariantFactsRow = {
  variantId: "v1",
  variantName: "Standard",
  priceCents: 20000,
  stockKey: "s-v1",
  productName: "Unwind Ritual",
  productSlug: "unwind-ritual",
  heroMediaRef: "ndalo/dev/hero",
  heroAlt: "Unwind ritual",
};

describe("CartService.getCart", () => {
  it("computes subtotal from CURRENT catalogue price (server-authoritative)", async () => {
    const items: CartItemRow[] = [
      { id: "i1", variantId: "v1", quantity: 3, lastPresentedPriceCents: 20000 },
    ];
    const { repo } = stubCartRepo(items);
    const svc = createCartService({
      stock: stubStock({ "s-v1": 50 }),
      cartRepo: repo as never,
      catalogueRepo: stubCatalogueRepo([baseFacts]) as never,
    });
    const { cart } = await svc.getCart({ token: "tok" });
    expect(cart.lines[0]?.unitPriceCents).toBe(20000);
    expect(cart.lines[0]?.lineSubtotalCents).toBe(60000);
    expect(cart.subtotalCents).toBe(60000);
    expect(cart.itemCount).toBe(3);
    expect(cart.lines[0]?.priceUpdated).toBe(false);
  });

  it("flags priceUpdated when current price differs from last presented", async () => {
    const items: CartItemRow[] = [
      { id: "i1", variantId: "v1", quantity: 1, lastPresentedPriceCents: 18000 },
    ];
    const { repo } = stubCartRepo(items);
    const svc = createCartService({
      stock: stubStock({ "s-v1": 50 }),
      cartRepo: repo as never,
      catalogueRepo: stubCatalogueRepo([baseFacts]) as never, // current price 20000
    });
    const { cart } = await svc.getCart({ token: "tok" });
    expect(cart.lines[0]?.unitPriceCents).toBe(20000); // uses CURRENT price
    expect(cart.lines[0]?.priceUpdated).toBe(true);
    expect(cart.anyPriceUpdated).toBe(true);
    expect(cart.notices.some((n) => n.type === "PRICE_UPDATED")).toBe(true);
  });

  it("keeps and flags an unavailable (out-of-stock) line", async () => {
    const items: CartItemRow[] = [
      { id: "i1", variantId: "v1", quantity: 2, lastPresentedPriceCents: 20000 },
    ];
    const { repo } = stubCartRepo(items);
    const svc = createCartService({
      stock: stubStock({ "s-v1": 0 }), // out of stock
      cartRepo: repo as never,
      catalogueRepo: stubCatalogueRepo([baseFacts]) as never,
    });
    const { cart } = await svc.getCart({ token: "tok" });
    expect(cart.lines).toHaveLength(1); // kept, not dropped
    expect(cart.lines[0]?.availability).toBe("OUT_OF_STOCK");
    expect(cart.lines[0]?.unavailable).toBe(true);
  });

  it("keeps and flags a line whose variant no longer resolves", async () => {
    const items: CartItemRow[] = [
      { id: "i1", variantId: "gone", quantity: 1, lastPresentedPriceCents: 20000 },
    ];
    const { repo } = stubCartRepo(items);
    const svc = createCartService({
      stock: stubStock({}),
      cartRepo: repo as never,
      catalogueRepo: stubCatalogueRepo([]) as never, // resolves nothing
    });
    const { cart } = await svc.getCart({ token: "tok" });
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]?.unavailable).toBe(true);
    expect(cart.lines[0]?.productName).toBeNull();
  });
});
