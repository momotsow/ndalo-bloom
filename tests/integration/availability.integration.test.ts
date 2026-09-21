import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { prisma, requireDatabaseUrl } from "./helpers";
import { createCatalogueService } from "@/application/catalogue/catalogue-service";
import type { ReadOnlyStockAvailabilityProvider } from "@/application/catalogue/stock-availability-port";

/**
 * Real PostgreSQL availability aggregation tests (Spec 2 review item 7).
 *
 * Seeds a product with three variants (distinct stockKeys) and injects a deterministic
 * stub stock provider to drive each scenario. Proves AvailabilityStatus is DERIVED at
 * read time from the read-only provider (no inventory table involved) and that
 * product-level roll-up + configurable threshold behave correctly.
 */

const TOKEN = "zzavail";
const CAT_SLUG = `it-avail-cat-${TOKEN}`;
const PRODUCT_SLUG = `it-avail-${TOKEN}`;
const KEYS = [`k-${TOKEN}-1`, `k-${TOKEN}-2`, `k-${TOKEN}-3`];
let categoryId = "";
let productId = "";

function stubProvider(
  map: Record<string, number | null>,
): ReadOnlyStockAvailabilityProvider {
  return {
    async getQuantities(keys) {
      return new Map(keys.map((k) => [k, map[k] ?? null]));
    },
  };
}

beforeAll(async () => {
  requireDatabaseUrl();
  const category = await prisma.category.upsert({
    where: { slug: CAT_SLUG },
    update: {},
    create: { slug: CAT_SLUG, name: `IT Avail ${TOKEN}` },
  });
  categoryId = category.id;

  const product = await prisma.product.create({
    data: {
      slug: PRODUCT_SLUG,
      name: `Avail ${TOKEN}`,
      status: "ACTIVE",
      categoryId,
      images: { create: [{ mediaRef: "it/av", alt: "av", role: "HERO", position: 0 }] },
      variants: {
        create: [
          {
            name: "V1",
            sku: `IT-AV1-${TOKEN}`,
            priceCents: 10000,
            position: 0,
            stockKey: KEYS[0],
          },
          {
            name: "V2",
            sku: `IT-AV2-${TOKEN}`,
            priceCents: 12000,
            position: 1,
            stockKey: KEYS[1],
          },
          {
            name: "V3",
            sku: `IT-AV3-${TOKEN}`,
            priceCents: 14000,
            position: 2,
            stockKey: KEYS[2],
          },
        ],
      },
    },
  });
  productId = product.id;
});

afterAll(async () => {
  await prisma.product.deleteMany({ where: { id: productId } });
  await prisma.category.deleteMany({ where: { id: categoryId } });
  await prisma.$disconnect();
});

async function productAvailability(
  map: Record<string, number | null>,
  threshold?: number,
) {
  const svc = createCatalogueService({
    stock: stubProvider(map),
    lowStockThreshold: threshold,
  });
  const p = await svc.getProductBySlug(PRODUCT_SLUG);
  return p!;
}

describe("availability aggregation (derived, read-only)", () => {
  it("all variants out of stock → OUT_OF_STOCK", async () => {
    const p = await productAvailability({ [KEYS[0]!]: 0, [KEYS[1]!]: 0, [KEYS[2]!]: 0 });
    expect(p.availability).toBe("OUT_OF_STOCK");
    expect(p.variants.every((v) => v.availability === "OUT_OF_STOCK")).toBe(true);
  });

  it("one variant in stock (rest out) → IN_STOCK", async () => {
    const p = await productAvailability({ [KEYS[0]!]: 50, [KEYS[1]!]: 0, [KEYS[2]!]: 0 });
    expect(p.availability).toBe("IN_STOCK");
  });

  it("one variant low, rest out → LOW_STOCK", async () => {
    const p = await productAvailability({ [KEYS[0]!]: 3, [KEYS[1]!]: 0, [KEYS[2]!]: 0 });
    expect(p.availability).toBe("LOW_STOCK");
  });

  it("mixed availability rolls up to IN_STOCK when any is in stock", async () => {
    const p = await productAvailability({
      [KEYS[0]!]: 0,
      [KEYS[1]!]: 3,
      [KEYS[2]!]: 100,
    });
    expect(p.availability).toBe("IN_STOCK");
  });

  it("zero quantity → OUT_OF_STOCK at variant level", async () => {
    const p = await productAvailability({ [KEYS[0]!]: 0, [KEYS[1]!]: 0, [KEYS[2]!]: 0 });
    const v1 = p.variants.find((v) => v.sku === `IT-AV1-${TOKEN}`);
    expect(v1?.availability).toBe("OUT_OF_STOCK");
  });

  it("quantity exactly at the default threshold (5) → LOW_STOCK", async () => {
    const p = await productAvailability({ [KEYS[0]!]: 5, [KEYS[1]!]: 0, [KEYS[2]!]: 0 });
    const v1 = p.variants.find((v) => v.sku === `IT-AV1-${TOKEN}`);
    expect(v1?.availability).toBe("LOW_STOCK");
  });

  it("quantity above the threshold → IN_STOCK", async () => {
    const p = await productAvailability({ [KEYS[0]!]: 6, [KEYS[1]!]: 0, [KEYS[2]!]: 0 });
    const v1 = p.variants.find((v) => v.sku === `IT-AV1-${TOKEN}`);
    expect(v1?.availability).toBe("IN_STOCK");
  });

  it("configurable threshold changes the boundary", async () => {
    const p = await productAvailability(
      { [KEYS[0]!]: 8, [KEYS[1]!]: 0, [KEYS[2]!]: 0 },
      10,
    );
    const v1 = p.variants.find((v) => v.sku === `IT-AV1-${TOKEN}`);
    expect(v1?.availability).toBe("LOW_STOCK"); // 8 <= 10
  });
});
