import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Container, Grid, Heading, Stack } from "@/ui/primitives/layout";
import { Link } from "@/ui/primitives/link";
import { ProductGallery } from "@/ui/catalogue/product-gallery";
import { VariantSelector } from "@/ui/catalogue/variant-selector";
import { AttributeList, TextBlock } from "@/ui/catalogue/attribute-list";
import { AvailabilityBadge } from "@/ui/catalogue/availability-badge";
import { ProductGrid } from "@/ui/catalogue/product-grid";
import { catalogueService } from "@/application/catalogue/catalogue-service";
import { recommendationService } from "@/application/catalogue/recommendation-service";
import { toGalleryImages, toProductCard } from "@/application/catalogue/view-mappers";
import { catalogueAnalytics } from "@/application/analytics";
import { RelatedProductTracker } from "@/ui/catalogue/related-product-tracker";
import { loadPublicConfig } from "@/config/public";

export async function generateMetadata({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await catalogueService.getProductBySlug(slug);
  if (!product) return {};
  const canonical = `/products/${product.slug}`;
  return {
    title: product.seo.title ?? product.name,
    description: product.seo.description ?? product.description ?? undefined,
    alternates: { canonical },
    openGraph: {
      title: product.name,
      description: product.seo.description ?? product.description ?? undefined,
      url: canonical,
      type: "website",
    },
  };
}

/**
 * Product detail (Server Component). Canonical URL /products/[slug]. Editorial-first
 * hierarchy: story → gallery → price/variants → ingredients/benefits/scent →
 * mood/occasion → availability → related. Includes Product + BreadcrumbList JSON-LD.
 */
export default async function ProductPage({
  params,
}: {
  readonly params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await catalogueService.getProductBySlug(slug);
  if (!product) notFound();

  // Emit product_viewed (server-side, one per view).
  catalogueAnalytics.track({
    name: "product_viewed",
    properties: { productId: product.id, slug: product.slug },
  });

  const gallery = toGalleryImages(product);
  const related = await recommendationService.getRelated(product.id, { limit: 4 });
  const relatedCards = related.map((r) => toProductCard(r.product));
  const relatedIds = related.map((r) => r.product.id);

  const appUrl = loadPublicConfig().NEXT_PUBLIC_APP_URL;
  const canonicalUrl = `${appUrl}/products/${product.slug}`;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    category: product.category.name,
    offers: {
      "@type": "Offer",
      priceCurrency: "ZAR",
      price: (product.fromPriceCents / 100).toFixed(2),
      availability:
        product.availability === "OUT_OF_STOCK"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      url: canonicalUrl,
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Shop", item: `${appUrl}/shop` },
      {
        "@type": "ListItem",
        position: 2,
        name: product.category.name,
        item: `${appUrl}/categories/${product.category.slug}`,
      },
      { "@type": "ListItem", position: 3, name: product.name, item: canonicalUrl },
    ],
  };

  return (
    <Container>
      <script
        type="application/ld+json"
        // JSON-LD is trusted, server-generated structured data.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav aria-label="Breadcrumb" className="py-4 text-sm">
        <ol className="flex flex-wrap gap-2 text-text-muted">
          <li>
            <Link href={{ pathname: "/shop" }}>Shop</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={{
                pathname: "/categories/[slug]",
                query: { slug: product.category.slug },
              }}
            >
              {product.category.name}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-text-secondary">
            {product.name}
          </li>
        </ol>
      </nav>

      <Grid columns={2} gap={6} className="py-4">
        <ProductGallery images={gallery} />

        <Stack gap={6}>
          <div>
            <Heading level={1}>{product.name}</Heading>
            <div className="mt-2">
              <AvailabilityBadge status={product.availability} />
            </div>
          </div>

          {/* Editorial-first: lead with the story before dense specification. */}
          <TextBlock title="The ritual" body={product.story} />

          <VariantSelector variants={product.variants} />

          <TextBlock title="About" body={product.description} />
          <AttributeList title="Ingredients" items={product.ingredients} />
          <AttributeList title="Benefits" items={product.benefits} tone="accent" />
          <AttributeList title="Scent" items={product.scents} />
          <AttributeList title="Mood" items={product.moods} />
          <AttributeList title="Occasion" items={product.occasions} />
        </Stack>
      </Grid>

      {relatedCards.length > 0 ? (
        <Stack gap={4} className="py-10">
          <Heading level={2}>Complete your ritual</Heading>
          <RelatedProductTracker fromProductId={product.id} toProductIds={relatedIds}>
            <ProductGrid products={relatedCards} />
          </RelatedProductTracker>
        </Stack>
      ) : null}
    </Container>
  );
}
