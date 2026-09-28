import { test, expect } from "@playwright/test";

/**
 * Spec 3 cart E2E journeys (real app → Application → Repository → Postgres), using the
 * deterministic development seed. A seeded product that is in stock is used so add-to-cart
 * succeeds and the cart persists across navigation.
 */

const SEEDED_PRODUCT_SLUG = "bath-salts-ritual-1";

test.describe("Shopping cart", () => {
  test("add from product → /cart shows the line", async ({ page }) => {
    await page.goto(`/products/${SEEDED_PRODUCT_SLUG}`);
    await page.getByRole("button", { name: "Add to cart" }).click();
    // Live-region confirmation (added or max-reached both indicate the action ran).
    await expect(page.getByText(/Added to your cart|Maximum quantity/)).toBeVisible();

    await page.goto("/cart");
    await expect(
      page.getByRole("heading", { level: 1, name: "Your cart" }),
    ).toBeVisible();
    await expect(page.locator("article")).toHaveCount(1);
    await expect(page.getByText(/Subtotal/)).toBeVisible();
  });

  test("update quantity then remove empties the cart", async ({ page }) => {
    await page.goto(`/products/${SEEDED_PRODUCT_SLUG}`);
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByText(/Added to your cart|Maximum quantity/)).toBeVisible();

    await page.goto("/cart");
    // Update quantity via the qty select.
    await page.getByLabel(/Quantity for/i).selectOption("3");
    await expect(page.getByText("Quantity updated.")).toBeVisible();

    // Remove the line.
    await page.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByText(/Your cart is empty/i)).toBeVisible();
  });

  test("guest cart persists across navigation", async ({ page }) => {
    await page.goto(`/products/${SEEDED_PRODUCT_SLUG}`);
    await page.getByRole("button", { name: "Add to cart" }).click();
    await expect(page.getByText(/Added to your cart|Maximum quantity/)).toBeVisible();

    // Navigate away and back; the guest cookie keeps the cart.
    await page.goto("/shop");
    await page.goto("/cart");
    await expect(page.locator("article").first()).toBeVisible();
  });
});
