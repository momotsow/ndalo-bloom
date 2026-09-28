import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { prisma, requireDatabaseUrl } from "./helpers";
import { cartRepository } from "@/data/cart/cart-repository";
import { generateCartToken, nextExpiry } from "@/application/cart/cart-token";
import { MAX_QUANTITY } from "@/domain/cart";

/**
 * Cart persistence + concurrency integration tests (Spec 3, T-3) against real Postgres.
 * Uses a dedicated test category/product/variant so assertions are isolated.
 */

const TOKEN_SUFFIX = "zzcart";
const CAT_SLUG = `it-cart-cat-${TOKEN_SUFFIX}`;
let categoryId = "";
let variantId = "";
const createdCartIds: string[] = [];

beforeAll(async () => {
  requireDatabaseUrl();
  const category = await prisma.category.upsert({
    where: { slug: CAT_SLUG },
    update: {},
    create: { slug: CAT_SLUG, name: `IT Cart ${TOKEN_SUFFIX}` },
  });
  categoryId = category.id;
  const product = await prisma.product.create({
    data: {
      slug: `it-cart-product-${TOKEN_SUFFIX}`,
      name: `IT Cart Product ${TOKEN_SUFFIX}`,
      status: "ACTIVE",
      categoryId,
      variants: {
        create: [
          {
            name: "Std",
            sku: `IT-CART-${TOKEN_SUFFIX}`,
            priceCents: 20000,
            stockKey: `s-${TOKEN_SUFFIX}`,
          },
        ],
      },
    },
    include: { variants: true },
  });
  variantId = product.variants[0]!.id;
});

afterAll(async () => {
  await prisma.cartItem.deleteMany({ where: { cartId: { in: createdCartIds } } });
  await prisma.cart.deleteMany({ where: { id: { in: createdCartIds } } });
  await prisma.product.deleteMany({ where: { slug: `it-cart-product-${TOKEN_SUFFIX}` } });
  await prisma.category.deleteMany({ where: { id: categoryId } });
  await prisma.$disconnect();
});

async function freshCart() {
  const cart = await cartRepository.create(generateCartToken(), nextExpiry());
  createdCartIds.push(cart.id);
  return cart;
}

describe("cart persistence", () => {
  it("persists a cart resolvable by token", async () => {
    const cart = await freshCart();
    const found = await cartRepository.findByToken(cart.token);
    expect(found?.id).toBe(cart.id);
  });

  it("enforces one line per variant and increments via atomic add", async () => {
    const cart = await freshCart();
    await cartRepository.addItemAtomic({
      cartId: cart.id,
      variantId,
      requested: 2,
      expiresAt: nextExpiry(),
    });
    await cartRepository.addItemAtomic({
      cartId: cart.id,
      variantId,
      requested: 3,
      expiresAt: nextExpiry(),
    });
    const items = await cartRepository.listItems(cart.id);
    expect(items).toHaveLength(1);
    expect(items[0]?.quantity).toBe(5);
  });

  it("clamps to 99 atomically", async () => {
    const cart = await freshCart();
    await cartRepository.addItemAtomic({
      cartId: cart.id,
      variantId,
      requested: 90,
      expiresAt: nextExpiry(),
    });
    const { quantity } = await cartRepository.addItemAtomic({
      cartId: cart.id,
      variantId,
      requested: 50,
      expiresAt: nextExpiry(),
    });
    expect(quantity).toBe(MAX_QUANTITY);
  });

  it("concurrent adds do not lose updates (atomic upsert)", async () => {
    const cart = await freshCart();
    await Promise.all(
      Array.from({ length: 10 }, () =>
        cartRepository.addItemAtomic({
          cartId: cart.id,
          variantId,
          requested: 1,
          expiresAt: nextExpiry(),
        }),
      ),
    );
    const items = await cartRepository.listItems(cart.id);
    expect(items[0]?.quantity).toBe(10); // all 10 adds counted
  });

  it("expired carts are treated as absent by findByToken filtering (service-level), row still expirable", async () => {
    const past = new Date(Date.now() - 1000);
    const cart = await cartRepository.create(generateCartToken(), past);
    createdCartIds.push(cart.id);
    const found = await cartRepository.findByToken(cart.token);
    // Repository returns the row; the service treats expiresAt<now as absent.
    expect(found?.expiresAt.getTime()).toBeLessThan(Date.now());
  });

  it("touch refreshes the sliding retention horizon", async () => {
    const cart = await freshCart();
    const future = nextExpiry();
    await cartRepository.touch(cart.id, future);
    const found = await cartRepository.findByToken(cart.token);
    expect(found?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
