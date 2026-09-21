/**
 * TEMPORARY DEVELOPMENT SEED — NOT PRODUCTION CONTENT (Spec 2, FR-27).
 *
 * All copy, imagery references, ingredients, benefits, pricing, moods, and occasions
 * below are placeholder development/preview/test data only. Production launch requires
 * approved Ndalo Bloom content and photography. Do NOT treat any of this as approved
 * brand content.
 *
 * Run with: `npm run db:seed` (requires a DATABASE_URL pointing at a dev database).
 */
import { PrismaClient } from "@prisma/client";

/**
 * Development safety guard.
 *
 * Refuses to run when DATABASE_URL clearly points at a production branch/database, so
 * placeholder development content can never be written to production. It reads only the
 * host/database portion of the connection string (never logs the value) and looks for
 * obvious production markers. Legitimate development and CI (dev branch) are unaffected.
 * A deliberate override (ALLOW_SEED_ON_PROD=1) exists for the rare case someone truly
 * intends it, but it is never set in CI.
 */
function assertNotProduction(): void {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set — refusing to seed.");
  }
  if (process.env.ALLOW_SEED_ON_PROD === "1") {
    return;
  }
  let host = "";
  let database = "";
  try {
    const parsed = new URL(url);
    host = parsed.host.toLowerCase();
    database = parsed.pathname.replace(/^\//, "").toLowerCase();
  } catch {
    // If it can't be parsed, fall through to the marker check on the raw string.
    host = url.toLowerCase();
  }
  const haystack = `${host} ${database}`;
  const PROD_MARKERS = ["prod", "production", "-main", "live"];
  const looksProd = PROD_MARKERS.some((m) => haystack.includes(m));
  if (looksProd) {
    throw new Error(
      "Refusing to run the development seed: DATABASE_URL appears to point at a " +
        "production database/branch. Use the development branch. (Set ALLOW_SEED_ON_PROD=1 " +
        "only if you are absolutely certain.)",
    );
  }
}

const prisma = new PrismaClient();

const CATEGORIES = [
  { slug: "bath-salts", name: "Bath salts" },
  { slug: "candles", name: "Candles" },
  { slug: "soap", name: "Soap" },
  { slug: "body-scrub", name: "Body scrub" },
  { slug: "diffusers", name: "Diffusers" },
];

const MOODS = ["relax", "recharge", "unwind", "indulge", "comfort", "reset"];
const OCCASIONS = [
  "birthday",
  "mothers-day",
  "anniversary",
  "thank-you",
  "self-care",
  "new-mom",
  "bridesmaid",
  "just-because",
];
const SCENTS = ["rose", "lavender", "neroli", "vanilla"];
const BENEFITS = ["calming", "restoring", "hydrating", "uplifting"];
const INGREDIENTS = ["epsom-salt", "shea-butter", "essential-oils", "coconut-oil"];

function titleCase(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

async function main(): Promise<void> {
  assertNotProduction();

  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: { name: c.name },
    });
  }

  const ref = async (
    model: "scent" | "benefit" | "ingredient" | "mood" | "occasion",
    slugs: string[],
  ) => {
    for (const slug of slugs) {
      // @ts-expect-error dynamic model access for seed convenience only
      await prisma[model].upsert({
        where: { slug },
        create: { slug, name: titleCase(slug) },
        update: {},
      });
    }
  };
  await ref("scent", SCENTS);
  await ref("benefit", BENEFITS);
  await ref("ingredient", INGREDIENTS);
  await ref("mood", MOODS);
  await ref("occasion", OCCASIONS);

  const categories = await prisma.category.findMany();
  const scents = await prisma.scent.findMany();
  const benefits = await prisma.benefit.findMany();
  const ingredients = await prisma.ingredient.findMany();
  const moods = await prisma.mood.findMany();
  const occasions = await prisma.occasion.findMany();

  // A handful of placeholder products per category.
  let counter = 0;
  const created: string[] = [];
  for (const category of categories) {
    for (let i = 0; i < 3; i += 1) {
      counter += 1;
      const slug = `${category.slug}-ritual-${i + 1}`;
      const scent = scents[counter % scents.length]!;
      const benefit = benefits[counter % benefits.length]!;
      const ingredient = ingredients[counter % ingredients.length]!;
      const mood = moods[counter % moods.length]!;
      const occasion = occasions[counter % occasions.length]!;

      const product = await prisma.product.upsert({
        where: { slug },
        update: {},
        create: {
          slug,
          name: `${titleCase(category.slug)} Ritual ${i + 1}`,
          story:
            "[Placeholder] A quiet moment made just for you — temporary development copy.",
          description: "[Placeholder] Development-only product description.",
          status: "ACTIVE",
          categoryId: category.id,
          seoTitle: `${titleCase(category.slug)} Ritual ${i + 1}`,
          seoDescription: "[Placeholder] Development-only SEO description.",
          variants: {
            create: [
              {
                name: "Standard",
                sku: `SKU-${slug}-STD`,
                priceCents: 24900 + counter * 1000,
                position: 0,
                stockKey: `stock-${slug}-std`,
              },
              {
                name: "Large",
                sku: `SKU-${slug}-LRG`,
                priceCents: 34900 + counter * 1000,
                position: 1,
                stockKey: `stock-${slug}-lrg`,
              },
            ],
          },
          images: {
            create: [
              {
                mediaRef: `ndalo/dev/${slug}-hero`,
                alt: `${titleCase(category.slug)} ritual hero image`,
                role: "HERO",
                position: 0,
              },
              {
                mediaRef: `ndalo/dev/${slug}-detail`,
                alt: `${titleCase(category.slug)} ritual detail image`,
                role: "DETAIL",
                position: 1,
              },
            ],
          },
          scents: { create: [{ scentId: scent.id }] },
          benefits: { create: [{ benefitId: benefit.id }] },
          ingredients: { create: [{ ingredientId: ingredient.id }] },
          moods: { create: [{ moodId: mood.id }] },
          occasions: { create: [{ occasionId: occasion.id }] },
        },
      });
      created.push(product.id);
    }
  }

  // A couple of complementary relationships between the first few products.
  for (let i = 0; i + 1 < Math.min(created.length, 6); i += 1) {
    await prisma.productRelationship.upsert({
      where: {
        productId_relatedProductId_type: {
          productId: created[i]!,
          relatedProductId: created[i + 1]!,
          type: "COMPLEMENTARY",
        },
      },
      update: {},
      create: {
        productId: created[i]!,
        relatedProductId: created[i + 1]!,
        type: "COMPLEMENTARY",
      },
    });
  }

  // A curated collection.
  const collection = await prisma.collection.upsert({
    where: { slug: "the-exhale" },
    update: {},
    create: {
      slug: "the-exhale",
      name: "The Exhale",
      description: "[Placeholder] A calming evening edit — development-only content.",
    },
  });
  for (let i = 0; i < Math.min(created.length, 4); i += 1) {
    await prisma.productCollection.upsert({
      where: {
        productId_collectionId: {
          productId: created[i]!,
          collectionId: collection.id,
        },
      },
      update: {},
      create: { productId: created[i]!, collectionId: collection.id },
    });
  }

  console.log(
    `Seeded ${categories.length} categories and ${created.length} products (DEV ONLY).`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
