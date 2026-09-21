import * as Sentry from "@sentry/nextjs";

/**
 * Server-side Sentry init (Foundation).
 *
 * - DSN is OPTIONAL: if unset, Sentry is effectively disabled and the app still runs
 *   (graceful degradation).
 * - PII scrubbing: `sendDefaultPii: false` and a `beforeSend` hook strip common PII
 *   fields so secrets/customer data are not sent to the provider.
 */
const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
  beforeSend(event) {
    if (event.request?.cookies) delete event.request.cookies;
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
    if (event.user) {
      // Keep only a non-identifying id if present; drop email/ip/username.
      event.user = event.user.id ? { id: event.user.id } : {};
    }
    return event;
  },
});
