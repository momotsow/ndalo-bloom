import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * Integration test config — DB-BACKED tests only.
 *
 * These tests require a live PostgreSQL connection (DATABASE_URL) and are therefore
 * NOT part of the default `npm test` gate (which must stay DB-free and pass anywhere).
 * They run only in the CI database-verification job, where DATABASE_URL is injected as
 * a secret pointing at the Neon DEVELOPMENT branch.
 *
 * Tests live under tests/integration/**. A Node environment is used (no jsdom) because
 * these exercise the data/application layers against Postgres, not React components.
 */
export default defineConfig({
  resolve: {
    alias: {
      // `server-only` guards server modules from client bundles; in a Node integration
      // context there is no client bundle, so alias it to a no-op stub so the real
      // data/application server modules load unchanged.
      "server-only": resolve(__dirname, "tests/integration/server-only-stub.ts"),
      "@/app": resolve(__dirname, "app"),
      "@/domain": resolve(__dirname, "src/domain"),
      "@/application": resolve(__dirname, "src/application"),
      "@/data": resolve(__dirname, "src/data"),
      "@/integrations": resolve(__dirname, "src/integrations"),
      "@/auth": resolve(__dirname, "src/auth"),
      "@/config": resolve(__dirname, "src/config"),
      "@/ui": resolve(__dirname, "src/ui"),
      "@/lib": resolve(__dirname, "src/lib"),
    },
  },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.test.ts"],
    // Integration tests may need more time for network round-trips to Neon.
    testTimeout: 30000,
    hookTimeout: 60000,
    // Run serially to avoid cross-test data races against a shared dev DB.
    fileParallelism: false,
  },
});
