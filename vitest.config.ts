import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
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
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
    // DB-backed integration tests are DELIBERATELY excluded from the default gate so
    // `npm test` stays DB-free and passes anywhere. They run via
    // `npm run test:integration` (vitest.integration.config.ts) in the CI DB job only.
    exclude: ["node_modules/**", "tests/integration/**"],
  },
});
