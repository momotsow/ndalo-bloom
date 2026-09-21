import type { Metadata } from "next";
import { Container, Heading, Stack, Text } from "@/ui/primitives/layout";
import { Empty } from "@/ui/primitives/state";
import { ProductGrid } from "@/ui/catalogue/product-grid";
import { catalogueService } from "@/application/catalogue/catalogue-service";
import { toProductCard } from "@/application/catalogue/view-mappers";
import { catalogueAnalytics } from "@/application/analytics";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} category`,
    alternates: { canonical: `/categories/${slug}` },
  };
}

/** Category listing (Server Component). Products link to canonical /products/[slug]. */
export default async function CategoryPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  catalogueAnalytics.track({
    name: "category_viewed",
    properties: { categorySlug: slug },
  });
  const result = await catalogueService.listProducts({
    categorySlug: slug,
    pageSize: 24,
  });
  const items = result.items.map((s) => toProductCard(s));

  return (
    <Container>
      <Stack gap={6} className="py-10">
        <header>
          <Heading level={1}>{slug}</Heading>
          <Text tone="secondary" className="mt-2">
            Explore this category.
          </Text>
        </header>
        {items.length === 0 ? (
          <Empty title="No products in this category yet" />
        ) : (
          <ProductGrid products={items} />
        )}
      </Stack>
    </Container>
  );
}
