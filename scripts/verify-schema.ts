/**
 * PostgreSQL schema verification (Spec 2, review item 6/7).
 *
 * Runs against the connected database (DATABASE_URL — Neon DEVELOPMENT branch in CI)
 * and asserts the catalogue schema is correct AND that there is no Availability/
 * Inventory/operational-stock table. Exits non-zero on any mismatch so CI fails.
 *
 * This is verification tooling, not application code; it may use Prisma directly.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EXPECTED_TABLES = [
  "Product",
  "ProductVariant",
  "ProductImage",
  "Category",
  "Collection",
  "ProductCollection",
  "Ingredient",
  "ProductIngredient",
  "Benefit",
  "ProductBenefit",
  "Scent",
  "ProductScent",
  "Mood",
  "ProductMood",
  "Occasion",
  "ProductOccasion",
  "ProductRelationship",
];

// Tables that MUST NOT exist (no operational inventory/availability in Spec 2).
const FORBIDDEN_TABLE_PATTERNS = [
  /availability/i,
  /inventory/i,
  /stock(level|movement|transaction|adjustment|history|receipt)/i,
  /warehouse/i,
];

const failures: string[] = [];

async function tableNames(): Promise<string[]> {
  const rows = await prisma.$queryRawUnsafe<Array<{ table_name: string }>>(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
  );
  return rows.map((r) => r.table_name);
}

async function indexNames(): Promise<string[]> {
  const rows = await prisma.$queryRawUnsafe<Array<{ indexname: string }>>(
    "SELECT indexname FROM pg_indexes WHERE schemaname = 'public'",
  );
  return rows.map((r) => r.indexname);
}

async function hasExtension(name: string): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ extname: string }>>(
    `SELECT extname FROM pg_extension WHERE extname = '${name}'`,
  );
  return rows.length > 0;
}

async function main(): Promise<void> {
  const tables = await tableNames();

  for (const t of EXPECTED_TABLES) {
    if (!tables.includes(t)) failures.push(`Missing expected table: ${t}`);
  }

  for (const t of tables) {
    for (const pat of FORBIDDEN_TABLE_PATTERNS) {
      if (pat.test(t))
        failures.push(`Forbidden table present (no inventory in Spec 2): ${t}`);
    }
  }

  // pg_trgm must be enabled for fuzzy search.
  if (!(await hasExtension("pg_trgm"))) {
    failures.push("Extension pg_trgm is not enabled");
  }

  // Uniqueness / index expectations (by index existence).
  const indexes = (await indexNames()).join("\n");
  const expectUnique = [
    { label: "Product.slug unique", re: /Product_slug_key/ },
    { label: "ProductVariant.sku unique", re: /ProductVariant_sku_key/ },
    { label: "Category.slug unique", re: /Category_slug_key/ },
    { label: "Collection.slug unique", re: /Collection_slug_key/ },
    {
      label: "ProductRelationship composite unique",
      re: /ProductRelationship_productId_relatedProductId_type_key/,
    },
  ];
  for (const e of expectUnique) {
    if (!e.re.test(indexes)) failures.push(`Missing unique constraint/index: ${e.label}`);
  }

  // Required ProductImage.alt column is NOT NULL.
  const altCol = await prisma.$queryRawUnsafe<Array<{ is_nullable: string }>>(
    "SELECT is_nullable FROM information_schema.columns WHERE table_schema='public' AND table_name='ProductImage' AND column_name='alt'",
  );
  if (altCol[0]?.is_nullable !== "NO") {
    failures.push("ProductImage.alt must be NOT NULL (required alt text)");
  }

  if (failures.length > 0) {
    for (const f of failures) console.error(`SCHEMA CHECK FAILED: ${f}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Schema OK: ${EXPECTED_TABLES.length} catalogue tables present, pg_trgm enabled, ` +
        "required constraints present, and no availability/inventory table.",
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("VERIFY_ERROR:", e?.message ?? e);
    await prisma.$disconnect();
    process.exit(1);
  });
