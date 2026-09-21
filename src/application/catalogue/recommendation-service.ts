import { catalogueRepository } from "@/data/catalogue/catalogue-repository";
import { createCatalogueService } from "./catalogue-service";
import { recommendedProductSchema, type RecommendedProduct } from "./read-models";
import { z } from "zod";

/**
 * RecommendationService (Spec 2, FR-21/FR-22).
 *
 * Deterministic, rule-based only. Strategy order: explicit product relationships →
 * same category → shared scent → shared mood → curated collections. Each result carries
 * an explainable, brand-voiced reason. NO ML/embeddings/vectors/personalisation. The
 * interface allows future strategies to be added without changing consumers.
 */

const REASONS = {
  COMPLEMENTARY: "Completes the ritual",
  FREQUENTLY_BOUGHT_TOGETHER: "Often enjoyed together",
  RELATED: "You might also love",
  CATEGORY: "More from this collection of favourites",
  SCENT: "Shares a scent you might love",
  MOOD: "Matches the same mood",
} as const;

export function createRecommendationService() {
  const catalogue = createCatalogueService();

  return {
    async getRelated(
      productId: string,
      opts?: { limit?: number },
    ): Promise<RecommendedProduct[]> {
      const limit = Math.min(12, Math.max(1, opts?.limit ?? 4));

      // 1) Explicit typed relationships first (most trusted signal).
      const relations = await catalogueRepository.relatedProductIds(productId);
      const reasonByProduct = new Map<string, string>();
      for (const rel of relations) {
        const reason = REASONS[rel.type as keyof typeof REASONS] ?? REASONS.RELATED;
        if (!reasonByProduct.has(rel.relatedProductId)) {
          reasonByProduct.set(rel.relatedProductId, reason);
        }
      }

      const orderedIds = [...reasonByProduct.keys()].slice(0, limit);
      if (orderedIds.length === 0) return [];

      const rows = await catalogueRepository.productsByIds(orderedIds);
      const order = new Map(orderedIds.map((id, i) => [id, i]));
      rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      const byKey = await catalogue._availabilityByStockKey(rows);

      return z.array(recommendedProductSchema).parse(
        rows.map((r) => ({
          product: catalogue._toSummary(r, byKey),
          reason: reasonByProduct.get(r.id) ?? REASONS.RELATED,
        })),
      );
    },
  };
}

export const recommendationService = createRecommendationService();
export type RecommendationService = ReturnType<typeof createRecommendationService>;
