import { describe, it, expect, vi } from "vitest";
import {
  createCartAnalytics,
  ALLOWED_CART_EVENTS,
  type CartEvent,
} from "@/application/analytics/cart-events";
import { ALLOWED_EVENTS } from "@/application/analytics";
import type { AnalyticsProvider } from "@/integrations/analytics/analytics-provider";

/**
 * Cart analytics contract (Spec 3, AN-2/AN-3, T-8): exactly four cart events; nine total
 * across the app; no other event may be emitted through the boundary.
 */
function makeProvider() {
  const capture = vi.fn();
  const provider: AnalyticsProvider = { capture };
  return { provider, capture };
}

describe("cart analytics emission contract", () => {
  it("exposes exactly the four approved cart event names", () => {
    expect([...ALLOWED_CART_EVENTS].sort()).toEqual(
      ["add_to_cart", "cart_quantity_updated", "cart_viewed", "remove_from_cart"].sort(),
    );
  });

  it("the app-wide allow-list is exactly nine events (5 catalogue + 4 cart)", () => {
    expect(ALLOWED_EVENTS).toHaveLength(9);
    expect(new Set(ALLOWED_EVENTS).size).toBe(9);
  });

  it("emits each approved cart event with its payload", () => {
    const { provider, capture } = makeProvider();
    const analytics = createCartAnalytics(provider);
    const events: CartEvent[] = [
      { name: "add_to_cart", properties: { variantId: "v1", quantity: 2 } },
      { name: "cart_viewed", properties: { itemCount: 3, subtotalCents: 12345 } },
      { name: "cart_quantity_updated", properties: { variantId: "v1", quantity: 5 } },
      { name: "remove_from_cart", properties: { variantId: "v1" } },
    ];
    for (const e of events) analytics.track(e);
    expect(capture).toHaveBeenCalledTimes(4);
    expect(capture).toHaveBeenCalledWith({
      name: "add_to_cart",
      properties: { variantId: "v1", quantity: 2 },
    });
  });

  it("refuses to emit a non-approved event name", () => {
    const { provider, capture } = makeProvider();
    const analytics = createCartAnalytics(provider);
    (analytics.track as (e: unknown) => void)({
      name: "checkout_started",
      properties: {},
    });
    expect(capture).not.toHaveBeenCalled();
  });
});
