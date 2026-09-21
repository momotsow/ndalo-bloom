import { describe, it, expect, beforeAll } from "vitest";
import { ESLint } from "eslint";
import { resolve } from "node:path";

/**
 * Architecture boundary tests (FR-8, FR-9).
 *
 * These tests execute the SAME ESLint configuration used by CI against deliberately
 * invalid import fixtures, and assert that the configured boundary mechanism ACTUALLY
 * REJECTS the imports. They do not merely check that a rule exists — they prove the
 * gate fails, which means CI would fail if a boundary were violated.
 *
 * Each fixture is linted via `lintText` with a `filePath` that places it inside the
 * layer under test, so the boundaries plugin classifies it correctly without writing
 * files into the source tree.
 */

const cwd = resolve(__dirname, "..", "..");

let eslint: ESLint;

beforeAll(() => {
  eslint = new ESLint({ cwd });
});

async function lintAs(virtualPath: string, code: string): Promise<string[]> {
  const results = await eslint.lintText(code, {
    filePath: resolve(cwd, virtualPath),
  });
  return results.flatMap((r) =>
    r.messages.map((m) => `${m.ruleId ?? "?"}: ${m.message}`),
  );
}

function hasBoundaryError(messages: string[]): boolean {
  // A prohibited import is caught either by the internal layer-direction rule
  // (boundaries/element-types) or by the per-layer external restriction
  // (no-restricted-imports). Either constitutes the configured gate rejecting it.
  return messages.some(
    (m) =>
      m.startsWith("boundaries/element-types") ||
      m.startsWith("boundaries/external") ||
      m.startsWith("no-restricted-imports"),
  );
}

describe("architecture boundaries are enforced by the configured gate", () => {
  it("UI cannot import Prisma", async () => {
    const messages = await lintAs(
      "src/ui/__invalid_ui_prisma__.tsx",
      `import { PrismaClient } from "@prisma/client";\nexport const x = PrismaClient;\n`,
    );
    expect(hasBoundaryError(messages)).toBe(true);
  });

  it("UI cannot import a provider SDK", async () => {
    const messages = await lintAs(
      "src/ui/__invalid_ui_provider__.tsx",
      `import { v2 } from "cloudinary";\nexport const x = v2;\n`,
    );
    expect(hasBoundaryError(messages)).toBe(true);
  });

  it("Domain cannot import framework code (Next.js/React)", async () => {
    const messages = await lintAs(
      "src/domain/__invalid_domain_next__.ts",
      `import { NextResponse } from "next/server";\nexport const x = NextResponse;\n`,
    );
    expect(hasBoundaryError(messages)).toBe(true);
  });

  it("Domain cannot import a provider SDK", async () => {
    const messages = await lintAs(
      "src/domain/__invalid_domain_provider__.ts",
      `import OpenAI from "openai";\nexport const x = OpenAI;\n`,
    );
    expect(hasBoundaryError(messages)).toBe(true);
  });

  it("Prisma is restricted to the data layer (application cannot import it)", async () => {
    const messages = await lintAs(
      "src/application/__invalid_app_prisma__.ts",
      `import { PrismaClient } from "@prisma/client";\nexport const x = PrismaClient;\n`,
    );
    expect(hasBoundaryError(messages)).toBe(true);
  });

  it("Provider SDKs are restricted to integrations (application cannot import them)", async () => {
    const messages = await lintAs(
      "src/application/__invalid_app_provider__.ts",
      `import { Resend } from "resend";\nexport const x = Resend;\n`,
    );
    expect(hasBoundaryError(messages)).toBe(true);
  });

  it("app/ handlers cannot import Prisma directly (must route through Application)", async () => {
    const messages = await lintAs(
      "app/api/__invalid__/route.ts",
      `import { PrismaClient } from "@prisma/client";\nexport const x = PrismaClient;\n`,
    );
    expect(hasBoundaryError(messages)).toBe(true);
  });

  it("catalogue UI cannot import Prisma", async () => {
    const messages = await lintAs(
      "src/ui/catalogue/__invalid_prisma__.tsx",
      `import { PrismaClient } from "@prisma/client";\nexport const x = PrismaClient;\n`,
    );
    expect(hasBoundaryError(messages)).toBe(true);
  });

  it("catalogue UI cannot import a provider SDK (e.g. cloudinary)", async () => {
    const messages = await lintAs(
      "src/ui/catalogue/__invalid_provider__.tsx",
      `import { v2 } from "cloudinary";\nexport const x = v2;\n`,
    );
    expect(hasBoundaryError(messages)).toBe(true);
  });
});

describe("Better Auth is restricted to the auth layer", () => {
  const betterAuthImport = `import { betterAuth } from "better-auth";\nexport const x = betterAuth;\n`;

  it("app/ cannot import Better Auth", async () => {
    const messages = await lintAs("app/__invalid_ba__/page.tsx", betterAuthImport);
    expect(hasBoundaryError(messages)).toBe(true);
  });

  it("src/ui cannot import Better Auth", async () => {
    const messages = await lintAs("src/ui/__invalid_ba__.tsx", betterAuthImport);
    expect(hasBoundaryError(messages)).toBe(true);
  });

  it("src/application cannot import Better Auth", async () => {
    const messages = await lintAs("src/application/__invalid_ba__.ts", betterAuthImport);
    expect(hasBoundaryError(messages)).toBe(true);
  });

  it("src/domain cannot import Better Auth", async () => {
    const messages = await lintAs("src/domain/__invalid_ba__.ts", betterAuthImport);
    expect(hasBoundaryError(messages)).toBe(true);
  });

  it("src/auth MAY import Better Auth (no boundary error)", async () => {
    const messages = await lintAs("src/auth/__valid_ba__.ts", betterAuthImport);
    expect(hasBoundaryError(messages)).toBe(false);
  });
});
