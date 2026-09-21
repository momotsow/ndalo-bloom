import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, Heading, Stack, Text } from "@/ui/primitives/layout";
import { Empty } from "@/ui/primitives/state";
import { ProductGrid } from "@/ui/catalogue/product-grid";
import { catalogueService } from "@/application/catalogue/catalogue-service";
import { catalogueRepository } from "@/data/catalogue/catalogue-repository";
import { toProductCard } from "@/application/catalogue/view-mappers";
import { catalogueAnalytics } from "@/application/analytics";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const collection = await catalogueRepository.findCollectionBySlug(slug);
  if (!collection) return {};
  return {
    title: collection.name,
    description: collection.description ?? undefined,
    alternates: { canonical: `/collections/${slug}` },
  };
}

/** Collection editorial landing (Server Component). */
export default async function CollectionPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const collection = await catalogueRepository.findCollectionBySlug(slug);
  if (!collection) notFound();

  catalogueAnalytics.track({
    name: "collection_viewed",
    properties: { collectionSlug: slug },
  });

  const result = await catalogueService.listProducts({
    collectionSlug: slug,
    pageSize: 24,
  });
  const items = result.items.map((s) => toProductCard(s));

  return (
    <Container>
      <Stack gap={6} className="py-10">
        <header>
          <Heading level={1}>{collection.name}</Heading>
          {collection.description ? (
            <Text tone="secondary" className="mt-2">
              {collection.description}
            </Text>
          ) : null}
        </header>
        {items.length === 0 ? (
          <Empty title="This collection is being curated" />
        ) : (
          <ProductGrid products={items} />
        )}
      </Stack>
    </Container>
  );
}
