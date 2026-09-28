import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/data/prisma-client";
import { MAX_QUANTITY } from "@/domain/cart";

/**
 * Cart repository — the ONLY place Prisma is used for the cart (INV-3). Returns plain row
 * shapes; never leaks Prisma model types upward. Persists PURCHASE INTENT ONLY.
 *
 * Concurrency (Spec 3, §6): add-to-cart is a SINGLE ATOMIC upsert applying
 * `LEAST(quantity + excluded.quantity, MAX)` on conflict `(cartId, variantId)`. No
 * application-level read-modify-write. Each mutation runs in one transaction scoped to a
 * cart.
 */

export interface CartRow {
  id: string;
  token: string;
  expiresAt: Date;
}

export interface CartItemRow {
  id: string;
  variantId: string;
  quantity: number;
  lastPresentedPriceCents: number | null;
}

function mapCart(
  row: { id: string; token: string; expiresAt: Date } | null,
): CartRow | null {
  return row ? { id: row.id, token: row.token, expiresAt: row.expiresAt } : null;
}

export const cartRepository = {
  async findByToken(token: string): Promise<CartRow | null> {
    const row = await prisma.cart.findUnique({
      where: { token },
      select: { id: true, token: true, expiresAt: true },
    });
    return mapCart(row);
  },

  async create(token: string, expiresAt: Date): Promise<CartRow> {
    const row = await prisma.cart.create({
      data: { token, expiresAt },
      select: { id: true, token: true, expiresAt: true },
    });
    return mapCart(row)!;
  },

  async listItems(cartId: string): Promise<CartItemRow[]> {
    const rows = await prisma.cartItem.findMany({
      where: { cartId },
      select: {
        id: true,
        variantId: true,
        quantity: true,
        lastPresentedPriceCents: true,
      },
      orderBy: { createdAt: "asc" },
    });
    return rows;
  },

  /**
   * Atomic add: insert the line at LEAST(requested, MAX); on conflict (cartId, variantId)
   * set quantity = LEAST(existing + requested, MAX). Concurrency-safe (no lost updates).
   * `expiresAt` is refreshed in the same transaction. Returns the resulting quantity so the
   * caller can detect clamping.
   */
  async addItemAtomic(params: {
    cartId: string;
    variantId: string;
    requested: number;
    expiresAt: Date;
  }): Promise<{ quantity: number }> {
    const { cartId, variantId, requested, expiresAt } = params;
    const capped = Math.min(requested, MAX_QUANTITY);

    return prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ quantity: number }>>(Prisma.sql`
        INSERT INTO "CartItem" ("id", "cartId", "variantId", "quantity", "createdAt", "updatedAt")
        VALUES (gen_random_uuid()::text, ${cartId}, ${variantId}, ${capped}, now(), now())
        ON CONFLICT ("cartId", "variantId")
        DO UPDATE SET
          "quantity" = LEAST("CartItem"."quantity" + ${requested}, ${MAX_QUANTITY}),
          "updatedAt" = now()
        RETURNING "quantity"
      `);
      await tx.cart.update({ where: { id: cartId }, data: { expiresAt } });
      return { quantity: rows[0]?.quantity ?? capped };
    });
  },

  async setItemQuantity(params: {
    cartId: string;
    variantId: string;
    quantity: number;
    expiresAt: Date;
  }): Promise<void> {
    const { cartId, variantId, quantity, expiresAt } = params;
    await prisma.$transaction(async (tx) => {
      await tx.cartItem.update({
        where: { cartId_variantId: { cartId, variantId } },
        data: { quantity },
      });
      await tx.cart.update({ where: { id: cartId }, data: { expiresAt } });
    });
  },

  async deleteItem(params: {
    cartId: string;
    variantId: string;
    expiresAt: Date;
  }): Promise<void> {
    const { cartId, variantId, expiresAt } = params;
    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { cartId, variantId } });
      await tx.cart.update({ where: { id: cartId }, data: { expiresAt } });
    });
  },

  async deleteAllItems(params: { cartId: string; expiresAt: Date }): Promise<void> {
    const { cartId, expiresAt } = params;
    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { cartId } });
      await tx.cart.update({ where: { id: cartId }, data: { expiresAt } });
    });
  },

  /** Refresh the sliding retention horizon. */
  async touch(cartId: string, expiresAt: Date): Promise<void> {
    await prisma.cart.update({ where: { id: cartId }, data: { expiresAt } });
  },

  /** Update the non-authoritative price-change-detection reference for lines. */
  async setLastPresentedPrices(
    updates: ReadonlyArray<{ cartId: string; variantId: string; priceCents: number }>,
  ): Promise<void> {
    if (updates.length === 0) return;
    await prisma.$transaction(
      updates.map((u) =>
        prisma.cartItem.updateMany({
          where: { cartId: u.cartId, variantId: u.variantId },
          data: { lastPresentedPriceCents: u.priceCents },
        }),
      ),
    );
  },
};
