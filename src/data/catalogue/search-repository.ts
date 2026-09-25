import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "@/data/prisma-client";
import {
  toTsRankWeightsArray,
  toWeightLabels,
  type SearchWeighting,
} from "@/domain/catalogue";

/**
 * Search repository — Postgres full-text + pg_trgm, the ONLY place search SQL lives.
 *
 * The weighted tsvector is built with setweight() so the field weights map to Postgres
 * weight labels A/B/C/D, and ts_rank is called with the numeric weights derived from the
 * configured SearchWeighting. This guarantees the configured weighting is ACTUALLY
 * applied to ranking (FR-19a), not merely nominal. Trigram similarity provides fuzzy
 * fallback for typos.
 */

export interface SearchRow {
  id: string;
  rank: number;
}

export interface SearchParams {
  text: string;
  weighting: SearchWeighting;
  categorySlug?: string;
  collectionSlug?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  sort: "relevance" | "newest" | "price_asc" | "price_desc";
  skip: number;
  take: number;
}

export const searchRepository = {
  async searchProductIds(
    params: SearchParams,
  ): Promise<{ ids: string[]; total: number }> {
    const [wD, wC, wB, wA] = toTsRankWeightsArray(params.weighting);
    // Derive the Postgres weight LABELS from the configured weighting so the
    // highest-weighted field is actually tagged 'A' in the tsvector. This is what makes
    // the weighting genuinely affect ranking (FR-19a) — changing the weighting reorders
    // both the labels here and the ts_rank weights array below.
    const labels = toWeightLabels(params.weighting);
    const q = params.text.trim();

    const tsQuery = Prisma.sql`plainto_tsquery('english', ${q})`;

    // setweight() requires a literal weight label ('A'..'D'), not a bind parameter.
    // `toWeightLabels` only ever returns A/B/C/D from a closed set we control, so it is
    // safe to inline via Prisma.raw (no user input reaches this).
    const lit = (label: "A" | "B" | "C" | "D") => Prisma.raw(`'${label}'`);
    const weightedDoc = Prisma.sql`
      setweight(to_tsvector('english', coalesce(p."name", '')), ${lit(labels.name)}) ||
      setweight(to_tsvector('english', coalesce(scent_txt.txt, '')), ${lit(labels.scent)}) ||
      setweight(to_tsvector('english', coalesce(benefit_txt.txt, '')), ${lit(labels.benefit)}) ||
      setweight(to_tsvector('english', coalesce(p."description", '')), ${lit(labels.description)})
    `;

    const filters: Prisma.Sql[] = [Prisma.sql`p."status" = 'ACTIVE'`];
    if (params.categorySlug) {
      filters.push(
        Prisma.sql`p."categoryId" IN (SELECT id FROM "Category" WHERE slug = ${params.categorySlug})`,
      );
    }
    if (params.collectionSlug) {
      filters.push(Prisma.sql`EXISTS (
        SELECT 1 FROM "ProductCollection" pc
        JOIN "Collection" c ON c.id = pc."collectionId"
        WHERE pc."productId" = p.id AND c.slug = ${params.collectionSlug})`);
    }
    if (params.minPriceCents !== undefined) {
      filters.push(Prisma.sql`price.min_price >= ${params.minPriceCents}`);
    }
    if (params.maxPriceCents !== undefined) {
      filters.push(Prisma.sql`price.min_price <= ${params.maxPriceCents}`);
    }
    // Text match: FTS, OR a trigram fuzzy fallback for typos. The fallback uses a
    // strict whole-string similarity threshold so that a genuine near-match (a typo of
    // the product name) still matches, but a query that merely shares a token amid other
    // non-matching words does NOT leak a match (that must return no results).
    if (q.length > 0) {
      filters.push(Prisma.sql`(${weightedDoc} @@ ${tsQuery}
        OR similarity(p."name", ${q}) > 0.4)`);
    }
    const whereSql = Prisma.join(filters, " AND ");

    const rankExpr = Prisma.sql`ts_rank(ARRAY[${wD}, ${wC}, ${wB}, ${wA}]::real[], ${weightedDoc}, ${tsQuery})`;

    const orderSql =
      params.sort === "newest"
        ? Prisma.sql`p."createdAt" DESC`
        : params.sort === "price_asc"
          ? Prisma.sql`price.min_price ASC`
          : params.sort === "price_desc"
            ? Prisma.sql`price.min_price DESC`
            : Prisma.sql`rank DESC, p."createdAt" DESC`;

    const base = Prisma.sql`
      FROM "Product" p
      LEFT JOIN LATERAL (
        SELECT min("priceCents") AS min_price FROM "ProductVariant" v WHERE v."productId" = p.id
      ) price ON true
      LEFT JOIN LATERAL (
        SELECT string_agg(s.name, ' ') AS txt
        FROM "ProductScent" ps JOIN "Scent" s ON s.id = ps."scentId"
        WHERE ps."productId" = p.id
      ) scent_txt ON true
      LEFT JOIN LATERAL (
        SELECT string_agg(b.name, ' ') AS txt
        FROM "ProductBenefit" pb JOIN "Benefit" b ON b.id = pb."benefitId"
        WHERE pb."productId" = p.id
      ) benefit_txt ON true
      WHERE ${whereSql}
    `;

    const rows = await prisma.$queryRaw<Array<{ id: string; rank: number }>>(Prisma.sql`
      SELECT p.id AS id, ${rankExpr} AS rank
      ${base}
      ORDER BY ${orderSql}
      OFFSET ${params.skip} LIMIT ${params.take}
    `);

    const totalRows = await prisma.$queryRaw<Array<{ count: bigint }>>(Prisma.sql`
      SELECT count(*)::bigint AS count ${base}
    `);
    const total = totalRows[0] ? Number(totalRows[0].count) : 0;

    return { ids: rows.map((r) => r.id), total };
  },
};
