import type { Metadata } from "next";
import { Container, Heading, Stack, Text } from "@/ui/primitives/layout";
import { Link } from "@/ui/primitives/link";
import { Empty } from "@/ui/primitives/state";
import { ProductGrid } from "@/ui/catalogue/product-grid";
import { catalogueService } from "@/application/catalogue/catalogue-service";
import { toProductCard } from "@/application/catalogue/view-mappers";

export const metadata: Metadata = {
  title: "Shop",
  description: "Explore Ndalo Bloom self-care rituals.",
};

const PAGE_SIZE = 12;

/**
 * Shop listing (Server Component). Server-side pagination with a progressive "Load More"
 * link (accumulates pages 1..page). Editorial layout; no client JS for listing.
 */
export default async function ShopPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page ?? "1") || 1);

  // Accumulate items for pages 1..page so "Load More" progressively reveals more.
  const pages = await Promise.all(
    Array.from({ length: page }, (_, i) =>
      catalogueService.listProducts({ page: i + 1, pageSize: PAGE_SIZE }),
    ),
  );
  const items = pages.flatMap((p) => p.items).map((s) => toProductCard(s));
  const hasMore = pages[pages.length - 1]?.hasMore ?? false;

  return (
    <Container>
      <Stack gap={6} className="py-10">
        <header>
          <Heading level={1}>Shop</Heading>
          <Text tone="secondary" className="mt-2">
            Luxury rituals for the woman who gives everyone else everything.
          </Text>
        </header>

        {items.length === 0 ? (
          <Empty title="Nothing here yet" description="Products are on their way." />
        ) : (
          <>
            <ProductGrid products={items} />
            {hasMore ? (
              <div className="flex justify-center">
                <Link
                  href={{ pathname: "/shop", query: { page: page + 1 } }}
                  className="rounded-md border border-border px-6 py-3 text-text-primary no-underline hover:bg-surface-muted"
                >
                  Load more
                </Link>
              </div>
            ) : null}
          </>
        )}
      </Stack>
    </Container>
  );
}
