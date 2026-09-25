import { test, expect } from "@playwright/test";

/**
 * Spec 2 E2E journeys (real app → Application → Repository → PostgreSQL).
 *
 * Relies on the temporary development seed (npm run db:seed). The seed deterministically
 * creates products per category and links the first products with COMPLEMENTARY
 * relationships, so `bath-salts-ritual-1` ALWAYS has at least one related product. These
 * run only in CI where the app can reach the Neon development database.
 */

// Known seeded product with a deterministic related product (see prisma/seed.ts).
const SEEDED_PRODUCT_SLUG = "bath-salts-ritual-1";

/**
 * Assert the canonical <link> points at a /products/[slug] URL, polling to tolerate the
 * App Router updating <head> after a client-side (soft) navigation settles.
 */
async function expectCanonicalProduct(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle");
  await expect
    .poll(
      async () => page.locator('link[rel="canonical"]').first().getAttribute("href"),
      { timeout: 10_000 },
    )
    .toMatch(/\/products\/[^/?#]+$/);
}

test.describe("Catalogue & Product Experience", () => {
  // Journey A: shop → product → related product → canonical URL (deterministic).
  //
  // Navigation here is via link clicks, which Next resolves as CLIENT-SIDE (soft)
  // transitions. The canonical <link> lives in <head> and is updated by the App Router
  // after the transition settles, so we wait for the URL + network idle and poll the
  // canonical attribute rather than asserting immediately (avoids a head-update race).
  test("A: shop → product → related product → canonical URL", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.getByRole("heading", { level: 1, name: "Shop" })).toBeVisible();

    // Open the first product from the grid.
    await page.locator('a[href*="/products/"]').first().click();
    await page.waitForURL(/\/products\//);
    await expectCanonicalProduct(page);

    // The related module MUST be present and contain at least one product link.
    await expect(
      page.getByRole("heading", { name: "Complete your ritual" }),
    ).toBeVisible();
    const relatedLink = page
      .locator('[data-analytics="related-products"] a[href*="/products/"]')
      .first();
    await expect(relatedLink).toBeVisible();
    await relatedLink.click();

    await page.waitForURL(/\/products\//);
    await expectCanonicalProduct(page);
  });

  // Journey A (deterministic anchor): the known seeded product renders a related product.
  test("A2: seeded product renders a deterministic related product", async ({ page }) => {
    await page.goto(`/products/${SEEDED_PRODUCT_SLUG}`);
    await expect(
      page.getByRole("heading", { name: "Complete your ritual" }),
    ).toBeVisible();
    const related = page.locator(
      '[data-analytics="related-products"] a[href*="/products/"]',
    );
    await expect(related.first()).toBeVisible();
    expect(await related.count()).toBeGreaterThan(0);
  });

  // Journey B: search → results.
  test("B: search returns results for a seeded term", async ({ page }) => {
    await page.goto("/search");
    await page.getByLabel("Search products").fill("ritual");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/search\?/);
    await expect(page.locator('a[href*="/products/"]').first()).toBeVisible();
  });

  // Journey C: search → empty state.
  test("C: search with no results shows the empty state", async ({ page }) => {
    await page.goto("/search?q=zzzznomatchqywx");
    await expect(page.getByText(/No results for/i)).toBeVisible();
  });

  // Journey D: product page → canonical URL through /products/[slug].
  test("D: product page exposes a canonical /products/[slug] URL", async ({ page }) => {
    await page.goto(`/products/${SEEDED_PRODUCT_SLUG}`);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`/products/${SEEDED_PRODUCT_SLUG}$`),
    );
  });
});
