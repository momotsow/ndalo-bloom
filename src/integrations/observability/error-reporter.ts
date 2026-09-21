import "server-only";
import * as Sentry from "@sentry/nextjs";

/**
 * ErrorReporter abstraction over Sentry (provider SDK restricted to this layer).
 *
 * Application code depends on this interface, not on Sentry directly. Sentry is
 * server-side only in Foundation. PII scrubbing is configured centrally in
 * sentry.server.config.ts via `sendDefaultPii: false` and a `beforeSend` scrubber.
 */
export interface ErrorReporter {
  captureException(error: unknown, context?: Record<string, string>): void;
}

export const errorReporter: ErrorReporter = {
  captureException(error, context) {
    Sentry.captureException(error, context ? { extra: context } : undefined);
  },
};
