import { test, expect } from "@playwright/test";

/**
 * Spec 2 SEO verification against the REAL rendered application + seeded data
 * (review item 4/8). These assert runtime output, not source strings.
 *
 * Depends on the deterministic development seed (bath-salts-ritual-1 is ACTIVE and in
 * the "the-exhale" collection).
 */

const PRODUCT_SLUG = "bath-salts-ritual-1";

function parseJsonLdBlocks(html: string): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = [];
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      blocks.push(JSON.parse(m[1]!));
    } catch {
      // ignore malformed block; the assertion below will catch a missing type
    }
  }
  return blocks;
}

test.describe("SEO (rendered output)", () => {
  test("product page: canonical /products/[slug] + Product & BreadcrumbList JSON-LD", async ({
    page,
  }) => {
    const res = await page.goto(`/products/${PRODUCT_SLUG}`);
    expect(res?.ok()).toBeTruthy();

    // Canonical must resolve to the canonical product URL.
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      new RegExp(`/products/${PRODUCT_SLUG}$`),
    );

    const html = await page.content();
    const blocks = parseJsonLdBlocks(html);
    const types = blocks.map((b) => b["@type"]);
    expect(types).toContain("Product");
    expect(types).toContain("BreadcrumbList");

    // Product JSON-LD carries an offer in ZAR.
    const product = blocks.find((b) => b["@type"] === "Product") as
      | { offers?: { priceCurrency?: string; url?: string } }
      | undefined;
    expect(product?.offers?.priceCurrency).toBe("ZAR");
    expect(product?.offers?.url).toMatch(new RegExp(`/products/${PRODUCT_SLUG}$`));

    // BreadcrumbList ends at the product.
    const crumbs = blocks.find((b) => b["@type"] === "BreadcrumbList") as
      | { itemListElement?: Array<{ item?: string }> }
      | undefined;
    const last = crumbs?.itemListElement?.at(-1);
    expect(last?.item).toMatch(new RegExp(`/products/${PRODUCT_SLUG}$`));
  });

  test("product page: Open Graph metadata is present and absolute", async ({ page }) => {
    await page.goto(`/products/${PRODUCT_SLUG}`);
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveCount(1);
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute("content");
    // metadataBase makes og:url absolute and pointing at the canonical product URL.
    expect(ogUrl).toMatch(/^https?:\/\/.+\/products\/[^/?#]+$/);
  });

  test("sitemap.xml lists the canonical product URL", async ({ request }) => {
    const res = await request.get("/sitemap.xml");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body).toContain(`/products/${PRODUCT_SLUG}`);
  });

  test("robots.txt disallows /search and references the sitemap", async ({ request }) => {
    const res = await request.get("/robots.txt");
    expect(res.ok()).toBeTruthy();
    const body = await res.text();
    expect(body.toLowerCase()).toContain("disallow: /search");
    expect(body.toLowerCase()).toContain("sitemap:");
  });
});
