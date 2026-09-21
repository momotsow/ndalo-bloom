import type { Metadata } from "next";
import { Container, Heading, Stack, Text } from "@/ui/primitives/layout";
import { Empty } from "@/ui/primitives/state";
import { ProductGrid } from "@/ui/catalogue/product-grid";
import { SearchControls } from "@/ui/catalogue/search-controls";
import { searchService, type SortOption } from "@/application/catalogue/search-service";
import { toProductCard } from "@/application/catalogue/view-mappers";
import { catalogueAnalytics } from "@/application/analytics";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false }, // search result pages are not indexed
};

const SORTS: SortOption[] = ["relevance", "newest", "price_asc", "price_desc"];

/**
 * Search results (Server Component). Accessible GET form; server-first execution;
 * empty and failure states. No AI/NL search — the SearchService uses Postgres FTS with
 * configured weighting.
 */
export default async function SearchPage({
  searchParams,
}: {
  readonly searchParams: Promise<{
    q?: string;
    sort?: string;
    category?: string;
    collection?: string;
  }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const sort: SortOption = SORTS.includes(params.sort as SortOption)
    ? (params.sort as SortOption)
    : "relevance";

  const results = q
    ? await searchService.search({
        text: q,
        sort,
        categorySlug: params.category,
        collectionSlug: params.collection,
        pageSize: 24,
      })
    : { items: [], total: 0, page: 1, pageSize: 24, hasMore: false };

  if (q) {
    catalogueAnalytics.track({
      name: "search_performed",
      properties: { query: q, resultCount: results.total },
    });
  }

  const items = results.items.map((s) => toProductCard(s));

  return (
    <Container>
      <Stack gap={6} className="py-10">
        <header>
          <Heading level={1}>Search</Heading>
          <Text tone="secondary" className="mt-2">
            Find something that fits your mood.
          </Text>
        </header>

        <SearchControls defaultQuery={q} defaultSort={sort} />

        {q === "" ? (
          <Empty
            title="What are you looking for?"
            description="Search by name, scent, or benefit."
          />
        ) : items.length === 0 ? (
          <Empty
            title={`No results for "${q}"`}
            description="Try a different word or browse the shop."
          />
        ) : (
          <>
            <Text tone="muted">{results.total} result(s)</Text>
            <ProductGrid products={items} />
          </>
        )}
      </Stack>
    </Container>
  );
}
