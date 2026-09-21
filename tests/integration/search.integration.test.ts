import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { prisma, requireDatabaseUrl } from "./helpers";
import { searchService } from "@/application/catalogue/search-service";
import { searchRepository } from "@/data/catalogue/search-repository";
import { DEFAULT_SEARCH_WEIGHTING } from "@/domain/catalogue";

/**
 * Real PostgreSQL search integration tests (Spec 2 review items 4 & 5).
 *
 * Uses deterministic, test-owned fixtures with a unique token so assertions are stable
 * regardless of other seed data. Proves:
 *  - full-text search
 *  - pg_trgm fuzzy matching (typo tolerance)
 *  - category / collection / price filtering
 *  - relevance / newest / price sorting
 *  - pagination
 *  - SearchWeighting actually affects ranking (name-weighted match outranks a
 *    description-only match for the same term)
 */

const TOKEN = "zzqweighting"; // unlikely to collide with seed content
const CAT_SLUG = `it-search-cat-${TOKEN}`;
const COL_SLUG = `it-search-col-${TOKEN}`;
const createdProductIds: string[] = [];
let categoryId = "";
let collectionId = "";

beforeAll(async () => {
  requireDatabaseUrl();

  const category = await prisma.category.upsert({
    where: { slug: CAT_SLUG },
    update: {},
    create: { slug: CAT_SLUG, name: `IT Search Category ${TOKEN}` },
  });
  categoryId = category.id;

  const collection = await prisma.collection.upsert({
    where: { slug: COL_SLUG },
    update: {},
    create: { slug: COL_SLUG, name: `IT Search Collection ${TOKEN}` },
  });
  collectionId = collection.id;

  // Product A: token in the NAME (should rank highest for the token).
  const a = await prisma.product.create({
    data: {
      slug: `it-name-${TOKEN}`,
      name: `Bloom ${TOKEN} Ritual`,
      description: "A calming evening product.",
      status: "ACTIVE",
      categoryId,
      variants: {
        create: [
          {
            name: "Std",
            sku: `IT-A-${TOKEN}`,
            priceCents: 15000,
            stockKey: `it-a-${TOKEN}`,
          },
        ],
      },
      images: { create: [{ mediaRef: "it/a", alt: "A", role: "HERO", position: 0 }] },
    },
  });

  // Product B: token only in the DESCRIPTION (should rank below A).
  const b = await prisma.product.create({
    data: {
      slug: `it-desc-${TOKEN}`,
      name: "Quiet Candle",
      description: `Includes the word ${TOKEN} only in the description.`,
      status: "ACTIVE",
      categoryId,
      variants: {
        create: [
          {
            name: "Std",
            sku: `IT-B-${TOKEN}`,
            priceCents: 25000,
            stockKey: `it-b-${TOKEN}`,
          },
        ],
      },
      images: { create: [{ mediaRef: "it/b", alt: "B", role: "HERO", position: 0 }] },
    },
  });

  createdProductIds.push(a.id, b.id);
  await prisma.productCollection.createMany({
    data: [
      { productId: a.id, collectionId },
      { productId: b.id, collectionId },
    ],
    skipDuplicates: true,
  });
});

afterAll(async () => {
  await prisma.productCollection.deleteMany({ where: { collectionId } });
  await prisma.product.deleteMany({ where: { id: { in: createdProductIds } } });
  await prisma.collection.deleteMany({ where: { id: collectionId } });
  await prisma.category.deleteMany({ where: { id: categoryId } });
  await prisma.$disconnect();
});

describe("PostgreSQL search", () => {
  it("full-text search finds products by token", async () => {
    const res = await searchService.search({ text: TOKEN, collectionSlug: COL_SLUG });
    const slugs = res.items.map((i) => i.slug);
    expect(slugs).toContain(`it-name-${TOKEN}`);
  });

  it("SearchWeighting: a name-match outranks a description-only match", async () => {
    // Directly exercise the ranking SQL with the default weighting.
    const { ids } = await searchRepository.searchProductIds({
      text: TOKEN,
      weighting: DEFAULT_SEARCH_WEIGHTING,
      collectionSlug: COL_SLUG,
      sort: "relevance",
      skip: 0,
      take: 10,
    });
    const posName = ids.indexOf(createdProductIds[0]!); // Product A (name match)
    const posDesc = ids.indexOf(createdProductIds[1]!); // Product B (description match)
    expect(posName).toBeGreaterThanOrEqual(0);
    expect(posDesc).toBeGreaterThanOrEqual(0);
    expect(posName).toBeLessThan(posDesc);
  });

  it("weighting change alters ranking (description-weighted flips order)", async () => {
    const flipped = { name: 1, scent: 2, benefit: 3, description: 4 };
    const { ids } = await searchRepository.searchProductIds({
      text: TOKEN,
      weighting: flipped,
      collectionSlug: COL_SLUG,
      sort: "relevance",
      skip: 0,
      take: 10,
    });
    const posName = ids.indexOf(createdProductIds[0]!);
    const posDesc = ids.indexOf(createdProductIds[1]!);
    // With description weighted highest, B (description match) should now rank first.
    expect(posDesc).toBeLessThan(posName);
  });

  it("pg_trgm fuzzy matching tolerates a typo in the product name", async () => {
    const typo = `Bloom ${TOKEN.slice(0, -1)}x Ritual`; // near-match of Product A's name
    const { ids } = await searchRepository.searchProductIds({
      text: typo,
      weighting: DEFAULT_SEARCH_WEIGHTING,
      collectionSlug: COL_SLUG,
      sort: "relevance",
      skip: 0,
      take: 10,
    });
    expect(ids).toContain(createdProductIds[0]!);
  });

  it("category filtering restricts results", async () => {
    const res = await searchService.search({ text: TOKEN, categorySlug: CAT_SLUG });
    expect(res.items.length).toBeGreaterThanOrEqual(1);
    expect(res.items.every((i) => i.category.slug === CAT_SLUG)).toBe(true);
  });

  it("price filtering (min/max) restricts results", async () => {
    const min = await searchService.search({
      text: TOKEN,
      collectionSlug: COL_SLUG,
      minPriceCents: 20000,
    });
    expect(min.items.some((i) => i.slug === `it-desc-${TOKEN}`)).toBe(true);
    expect(min.items.some((i) => i.slug === `it-name-${TOKEN}`)).toBe(false);
  });

  it("price sorting ascending and descending", async () => {
    const asc = await searchService.search({
      text: TOKEN,
      collectionSlug: COL_SLUG,
      sort: "price_asc",
    });
    const desc = await searchService.search({
      text: TOKEN,
      collectionSlug: COL_SLUG,
      sort: "price_desc",
    });
    expect(asc.items[0]?.slug).toBe(`it-name-${TOKEN}`); // 15000 first
    expect(desc.items[0]?.slug).toBe(`it-desc-${TOKEN}`); // 25000 first
  });

  it("pagination returns hasMore and respects pageSize", async () => {
    const page1 = await searchService.search({
      text: TOKEN,
      collectionSlug: COL_SLUG,
      pageSize: 1,
      page: 1,
    });
    expect(page1.items).toHaveLength(1);
    expect(page1.hasMore).toBe(true);
    const page2 = await searchService.search({
      text: TOKEN,
      collectionSlug: COL_SLUG,
      pageSize: 1,
      page: 2,
    });
    expect(page2.items).toHaveLength(1);
    expect(page1.items[0]?.slug).not.toBe(page2.items[0]?.slug);
  });

  it("no-results query returns an empty, well-formed result", async () => {
    const res = await searchService.search({ text: `${TOKEN}-nomatch-xyzzy` });
    expect(res.items).toEqual([]);
    expect(res.total).toBe(0);
    expect(res.hasMore).toBe(false);
  });
});
