import type { AnalyticsProvider } from "@/integrations/analytics/analytics-provider";

/**
 * Catalogue/search analytics events (Spec 2, FR-26).
 *
 * ONLY these five events are emitted in Spec 2. Future commerce/customer/AI/gift-finder/
 * social/inventory/admin events are documented in the Spec roadmap but NOT emitted here.
 * Events are strongly typed and routed through the AnalyticsProvider boundary — no direct
 * PostHog usage in application/UI code.
 */

export type CatalogueEvent =
  | { name: "product_viewed"; properties: { productId: string; slug: string } }
  | {
      name: "search_performed";
      properties: { query: string; resultCount: number };
    }
  | { name: "collection_viewed"; properties: { collectionSlug: string } }
  | { name: "category_viewed"; properties: { categorySlug: string } }
  | {
      name: "product_relationship_clicked";
      properties: { fromProductId: string; toProductId: string; reason: string };
    };

export interface CatalogueAnalytics {
  track(event: CatalogueEvent): void;
}

/**
 * The set of event names Spec 2 is permitted to emit. Used to guarantee (and test) that
 * no other event categories leak through this boundary.
 */
export const ALLOWED_CATALOGUE_EVENTS = [
  "product_viewed",
  "search_performed",
  "collection_viewed",
  "category_viewed",
  "product_relationship_clicked",
] as const;

export function createCatalogueAnalytics(
  provider: AnalyticsProvider,
): CatalogueAnalytics {
  const allowed = new Set<string>(ALLOWED_CATALOGUE_EVENTS);
  return {
    track(event) {
      // Defensive: only the five approved Spec 2 events may be emitted.
      if (!allowed.has(event.name)) return;
      provider.capture({ name: event.name, properties: event.properties });
    },
  };
}
