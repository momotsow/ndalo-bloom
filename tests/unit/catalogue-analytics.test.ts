import { describe, it, expect, vi } from "vitest";
import {
  createCatalogueAnalytics,
  ALLOWED_CATALOGUE_EVENTS,
  type CatalogueEvent,
} from "@/application/analytics/catalogue-events";
import type { AnalyticsProvider } from "@/integrations/analytics/analytics-provider";

/**
 * Catalogue analytics contract (Spec 2, FR-26). Verifies the five approved events map
 * to provider.capture with the correct name/properties, and that any non-approved event
 * name is refused by the boundary (defence in depth against scope creep).
 */
function makeProvider() {
  const capture = vi.fn();
  const provider: AnalyticsProvider = { capture };
  return { provider, capture };
}

describe("catalogue analytics emission contract", () => {
  it("exposes exactly the five approved event names", () => {
    expect([...ALLOWED_CATALOGUE_EVENTS].sort()).toEqual(
      [
        "category_viewed",
        "collection_viewed",
        "product_relationship_clicked",
        "product_viewed",
        "search_performed",
      ].sort(),
    );
  });

  it("emits each approved event through the provider with its properties", () => {
    const { provider, capture } = makeProvider();
    const analytics = createCatalogueAnalytics(provider);

    const events: CatalogueEvent[] = [
      { name: "product_viewed", properties: { productId: "p1", slug: "s1" } },
      { name: "search_performed", properties: { query: "rose", resultCount: 3 } },
      { name: "collection_viewed", properties: { collectionSlug: "the-exhale" } },
      { name: "category_viewed", properties: { categorySlug: "candles" } },
      {
        name: "product_relationship_clicked",
        properties: { fromProductId: "p1", toProductId: "p2", reason: "related" },
      },
    ];
    for (const e of events) analytics.track(e);

    expect(capture).toHaveBeenCalledTimes(5);
    expect(capture).toHaveBeenCalledWith({
      name: "product_viewed",
      properties: { productId: "p1", slug: "s1" },
    });
  });

  it("refuses to emit a non-approved event name", () => {
    const { provider, capture } = makeProvider();
    const analytics = createCatalogueAnalytics(provider);
    // Force an out-of-scope event past the type system to prove the runtime guard.
    (analytics.track as (e: unknown) => void)({
      name: "purchase_completed",
      properties: {},
    });
    expect(capture).not.toHaveBeenCalled();
  });
});
