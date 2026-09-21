/**
 * AnalyticsProvider abstraction (interface only in Foundation).
 *
 *   AnalyticsService -> AnalyticsProvider -> PostHogProvider (later Spec)
 *
 * Events are strongly typed at the AnalyticsService layer. The provider transports
 * already-validated events. The database remains the source of truth for orders and
 * revenue; analytics is never transactional truth.
 */
export interface AnalyticsEvent {
  readonly name: string;
  readonly properties?: Readonly<Record<string, string | number | boolean>>;
}

export interface AnalyticsProvider {
  capture(event: AnalyticsEvent): void;
}
