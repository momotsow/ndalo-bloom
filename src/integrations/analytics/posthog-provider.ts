import "server-only";
import { PostHog } from "posthog-node";
import { loadPostHogConfig } from "@/config/integration";
import type { AnalyticsEvent, AnalyticsProvider } from "./analytics-provider";

/**
 * PostHog implementation of AnalyticsProvider (Spec 2).
 *
 * The posthog-node SDK is imported ONLY here (integration boundary). Application/UI code
 * depends on the AnalyticsProvider interface. If PostHog is not configured (no API key),
 * a no-op provider is returned so analytics never breaks catalogue rendering — analytics
 * is never transactional truth and must degrade gracefully.
 *
 * A stable anonymous distinctId is required by PostHog; server-side catalogue events use
 * a per-request/anonymous id supplied by the caller (AnalyticsService).
 */
export function createPostHogProvider(): AnalyticsProvider {
  const client = tryCreateClient();
  if (!client) {
    return { capture: () => {} };
  }
  return {
    capture(event: AnalyticsEvent) {
      const distinctId =
        (event.properties?.distinctId as string | undefined) ?? "anonymous";
      client.capture({
        distinctId,
        event: event.name,
        properties: event.properties,
      });
    },
  };
}

function tryCreateClient(): PostHog | null {
  try {
    const cfg = loadPostHogConfig();
    return new PostHog(cfg.POSTHOG_API_KEY, {
      host: cfg.POSTHOG_HOST ?? "https://eu.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  } catch {
    return null;
  }
}

export const posthogProvider: AnalyticsProvider = createPostHogProvider();
