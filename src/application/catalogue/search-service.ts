import { searchRepository } from "@/data/catalogue/search-repository";
import { catalogueRepository } from "@/data/catalogue/catalogue-repository";
import { DEFAULT_SEARCH_WEIGHTING, type SearchWeighting } from "@/domain/catalogue";
import { createCatalogueService } from "./catalogue-service";
import { pagedProductsSchema, type PagedProducts } from "./read-models";

/**
 * SearchService (Spec 2, FR-18..FR-20).
 *
 * Structured contract: search(query: StructuredQuery): Promise<SearchResults>.
 * V1 implementation is Postgres FTS + pg_trgm with the configured SearchWeighting
 * actually applied to ranking. A future AI/NL layer can translate free text into this
 * same StructuredQuery without changing this service.
 */

export type SortOption = "relevance" | "newest" | "price_asc" | "price_desc";

export interface StructuredQuery {
  text?: string;
  categorySlug?: string;
  collectionSlug?: string;
  minPriceCents?: number;
  maxPriceCents?: number;
  sort?: SortOption;
  page?: number;
  pageSize?: number;
}

export type SearchResults = PagedProducts;

export function createSearchService(deps?: { weighting?: SearchWeighting }) {
  const weighting = deps?.weighting ?? DEFAULT_SEARCH_WEIGHTING;
  const catalogue = createCatalogueService();

  return {
    async search(query: StructuredQuery): Promise<SearchResults> {
      const page = Math.max(1, query.page ?? 1);
      const pageSize = Math.min(48, Math.max(1, query.pageSize ?? 12));
      const sort: SortOption = query.sort ?? "relevance";

      try {
        const { ids, total } = await searchRepository.searchProductIds({
          text: query.text ?? "",
          weighting,
          categorySlug: query.categorySlug,
          collectionSlug: query.collectionSlug,
          minPriceCents: query.minPriceCents,
          maxPriceCents: query.maxPriceCents,
          sort,
          skip: (page - 1) * pageSize,
          take: pageSize,
        });

        if (ids.length === 0) {
          return pagedProductsSchema.parse({
            items: [],
            total,
            page,
            pageSize,
            hasMore: false,
          });
        }

        const rows = await catalogueRepository.productsByIds(ids);
        // Preserve search rank ordering.
        const order = new Map(ids.map((id, i) => [id, i]));
        rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
        const byKey = await catalogue._availabilityByStockKey(rows);

        return pagedProductsSchema.parse({
          items: rows.map((r) => catalogue._toSummary(r, byKey)),
          total,
          page,
          pageSize,
          hasMore: page * pageSize < total,
        });
      } catch {
        // Graceful failure: return an empty, well-formed result rather than throwing
        // into the UI. The caller renders an error/empty state.
        return pagedProductsSchema.parse({
          items: [],
          total: 0,
          page,
          pageSize,
          hasMore: false,
        });
      }
    },
  };
}

export const searchService = createSearchService();
export type SearchService = ReturnType<typeof createSearchService>;
