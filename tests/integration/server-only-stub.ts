/**
 * No-op stub for the `server-only` package, used ONLY by the integration Vitest config
 * (vitest.integration.config.ts) via an alias.
 *
 * `server-only` exists to throw at build time if a server module is imported into a
 * client bundle. Integration tests run in a plain Node environment (no client bundle),
 * so importing the real package fails to resolve. Aliasing it to this empty module lets
 * the real data/application server modules load unchanged. Application code is NOT
 * modified — this stub is test-tooling only.
 */
export {};
