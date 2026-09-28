import type { AnalyticsProvider } from "@/integrations/analytics/analytics-provider";

/**
 * Cart commerce analytics events (Spec 3, AN-2). Exactly FOUR events, and no others.
 * Emitted only via the AnalyticsProvider boundary (no direct PostHog in app/UI). Typed
 * payloads, no PII. Analytics is never transactional truth (AN-4).
 */

export type CartEvent =
  | { name: "add_to_cart"; properties: { variantId: string; quantity: number } }
  | { name: "cart_viewed"; properties: { itemCount: number; subtotalCents: number } }
  | {
      name: "cart_quantity_updated";
      properties: { variantId: string; quantity: number };
    }
  | { name: "remove_from_cart"; properties: { variantId: string } };

export interface CartAnalytics {
  track(event: CartEvent): void;
}

/** The only cart event names permitted in Spec 3. */
export const ALLOWED_CART_EVENTS = [
  "add_to_cart",
  "cart_viewed",
  "cart_quantity_updated",
  "remove_from_cart",
] as const;

export function createCartAnalytics(provider: AnalyticsProvider): CartAnalytics {
  const allowed = new Set<string>(ALLOWED_CART_EVENTS);
  return {
    track(event) {
      if (!allowed.has(event.name)) return;
      provider.capture({ name: event.name, properties: event.properties });
    },
  };
}
