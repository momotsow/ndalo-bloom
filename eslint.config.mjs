import js from "@eslint/js";
import tseslint from "typescript-eslint";
import boundaries from "eslint-plugin-boundaries";

/**
 * Architecture boundary enforcement (FR-8, FR-9).
 *
 * Two complementary mechanisms:
 *
 * 1. INTERNAL layer direction — `boundaries/element-types` enforces which layers
 *    may import which other layers.
 *
 * 2. EXTERNAL implementation restriction — a SINGLE per-layer `no-restricted-imports`
 *    override restricts third-party implementations to their owning layer:
 *      - Prisma        -> src/data only
 *      - Better Auth   -> src/auth only
 *      - provider SDKs -> src/integrations only
 *      - Next.js/React -> additionally forbidden in src/domain (framework independence)
 *
 *    Because flat-config rule settings for the same rule name are overridden (not
 *    merged) by later matching blocks, ALL restrictions that apply to a layer are
 *    combined into that layer's single override.
 *
 * These rules are complemented by executable architecture tests
 * (tests/architecture/boundaries.test.ts) that run this SAME config against
 * deliberately invalid fixtures and assert the gate rejects them.
 */

const MSG = {
  prisma: "Prisma is restricted to the data layer (src/data).",
  auth: "Better Auth is restricted to the auth layer (src/auth). Use AuthService.",
  provider: "Provider SDKs are restricted to the integration layer (src/integrations).",
  framework: "Domain must be framework-independent (no Next.js/React).",
};

const RESTRICTIONS = {
  prisma: {
    paths: ["@prisma/client", "prisma", ".prisma/client"],
    patterns: [],
    message: MSG.prisma,
  },
  auth: {
    paths: ["better-auth"],
    patterns: ["better-auth/*"],
    message: MSG.auth,
  },
  provider: {
    paths: [],
    patterns: [
      "cloudinary",
      "resend",
      "openai",
      "posthog-node",
      "posthog-js",
      "@sentry/*",
    ],
    message: MSG.provider,
  },
  framework: {
    paths: ["next", "react", "react-dom"],
    patterns: ["next/*", "react/*"],
    message: MSG.framework,
  },
};

/** Combine several restriction keys into one no-restricted-imports rule config. */
function combineRestrictions(keys) {
  const paths = [];
  const patterns = [];
  for (const key of keys) {
    const r = RESTRICTIONS[key];
    for (const name of r.paths) paths.push({ name, message: r.message });
    if (r.patterns.length) patterns.push({ group: r.patterns, message: r.message });
  }
  return ["error", { paths, patterns }];
}

function layer(dir, keys) {
  return {
    files: [`${dir}/**/*.{ts,tsx}`],
    rules: { "no-restricted-imports": combineRestrictions(keys) },
  };
}

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "storybook-static/**",
      "coverage/**",
      "next-env.d.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // Internal layer direction.
  {
    files: ["app/**/*.{ts,tsx}", "src/**/*.{ts,tsx}"],
    plugins: { boundaries },
    settings: {
      "boundaries/include": ["app/**/*", "src/**/*"],
      "boundaries/elements": [
        { type: "app", pattern: "app/**/*", mode: "full" },
        { type: "ui", pattern: "src/ui/**/*", mode: "full" },
        { type: "application", pattern: "src/application/**/*", mode: "full" },
        { type: "domain", pattern: "src/domain/**/*", mode: "full" },
        { type: "data", pattern: "src/data/**/*", mode: "full" },
        { type: "integrations", pattern: "src/integrations/**/*", mode: "full" },
        { type: "auth", pattern: "src/auth/**/*", mode: "full" },
        { type: "config", pattern: "src/config/**/*", mode: "full" },
        { type: "lib", pattern: "src/lib/**/*", mode: "full" },
      ],
    },
    rules: {
      "boundaries/element-types": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: "app",
              allow: ["app", "ui", "application", "config", "lib", "domain"],
            },
            { from: "ui", allow: ["ui", "config", "lib", "domain"] },
            {
              from: "application",
              allow: [
                "application",
                "domain",
                "data",
                "integrations",
                "auth",
                "config",
                "lib",
              ],
            },
            { from: "domain", allow: ["domain", "lib"] },
            { from: "data", allow: ["data", "domain", "config", "lib"] },
            { from: "integrations", allow: ["integrations", "domain", "config", "lib"] },
            { from: "auth", allow: ["auth", "domain", "config", "lib"] },
            { from: "config", allow: ["config", "lib"] },
            { from: "lib", allow: ["lib"] },
          ],
        },
      ],
    },
  },

  // Per-layer external restrictions (each combines every restriction that applies).
  layer("app", ["prisma", "auth", "provider"]),
  layer("src/ui", ["prisma", "auth", "provider"]),
  layer("src/application", ["prisma", "auth", "provider"]),
  layer("src/domain", ["prisma", "auth", "provider", "framework"]),
  layer("src/data", ["auth", "provider"]),
  layer("src/integrations", ["prisma", "auth"]),
  layer("src/auth", ["prisma", "provider"]),
  layer("src/config", ["prisma", "auth", "provider"]),
  layer("src/lib", ["prisma", "auth", "provider"]),

  // Test files, tooling config, and Prisma seed may use Node/tooling globals freely.
  // The seed is dev-only tooling and is permitted to import Prisma directly.
  {
    files: [
      "tests/**/*.{ts,tsx}",
      "**/*.config.{ts,mjs}",
      "*.mjs",
      "prisma/**/*.ts",
      "scripts/**/*.ts",
    ],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        __dirname: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-restricted-imports": "off",
    },
  },

  // Data/config/auth modules run on the server and use process/console.
  {
    files: ["src/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        process: "readonly",
        console: "readonly",
        globalThis: "readonly",
        Request: "readonly",
        Response: "readonly",
        navigator: "readonly",
        window: "readonly",
        document: "readonly",
        fetch: "readonly",
      },
    },
  },
);
