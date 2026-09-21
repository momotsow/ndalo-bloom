import { Grid } from "@/ui/primitives/layout";
import { ProductCard, type ProductCardData } from "./product-card";

/**
 * Product grid (catalogue-scoped, presentational, server-compatible). Renders a
 * responsive grid of product cards. No data access.
 */
export function ProductGrid({
  products,
}: {
  readonly products: readonly ProductCardData[];
}) {
  return (
    <Grid columns={4} gap={5}>
      {products.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </Grid>
  );
}
