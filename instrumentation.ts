import * as Sentry from "@sentry/nextjs";

/**
 * Next.js instrumentation hook (server-side only for Foundation).
 *
 * Locked decision: Sentry is SERVER-SIDE ONLY in Foundation. There is no client or
 * edge Sentry. Only the Node.js server runtime is initialised here. Safe when no DSN
 * is configured (Sentry stays disabled — graceful degradation).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
}

// Server-side request-error capture. Provided by the framework instrumentation API.
export const onRequestError = Sentry.captureRequestError;
