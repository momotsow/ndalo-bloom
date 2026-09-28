import { posthogProvider } from "@/integrations/analytics/posthog-provider";
import { createCatalogueAnalytics, ALLOWED_CATALOGUE_EVENTS } from "./catalogue-events";
import { createCartAnalytics, ALLOWED_CART_EVENTS } from "./cart-events";

/**
 * Default analytics instances, wired to the PostHog provider behind the AnalyticsProvider
 * boundary. Routes/server components/actions import these to emit approved events only.
 * If PostHog is unconfigured, the provider is a no-op.
 *
 * The full set of emittable events across the app is exactly:
 *   5 catalogue events (Spec 2) + 4 cart events (Spec 3) = 9.
 */
export const catalogueAnalytics = createCatalogueAnalytics(posthogProvider);
export const cartAnalytics = createCartAnalytics(posthogProvider);

/** Union of every event name the application is allowed to emit (9 total). */
export const ALLOWED_EVENTS = [
  ...ALLOWED_CATALOGUE_EVENTS,
  ...ALLOWED_CART_EVENTS,
] as const;

export { ALLOWED_CATALOGUE_EVENTS } from "./catalogue-events";
export { ALLOWED_CART_EVENTS } from "./cart-events";
export type { CatalogueEvent, CatalogueAnalytics } from "./catalogue-events";
export type { CartEvent, CartAnalytics } from "./cart-events";
