import { posthogProvider } from "@/integrations/analytics/posthog-provider";
import { createCatalogueAnalytics } from "./catalogue-events";

/**
 * Default catalogue analytics instance, wired to the PostHog provider behind the
 * AnalyticsProvider boundary. Routes/server components import this to emit the five
 * approved Spec 2 events. If PostHog is unconfigured, the provider is a no-op.
 */
export const catalogueAnalytics = createCatalogueAnalytics(posthogProvider);
export { ALLOWED_CATALOGUE_EVENTS } from "./catalogue-events";
export type { CatalogueEvent, CatalogueAnalytics } from "./catalogue-events";
