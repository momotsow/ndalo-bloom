import type { Route } from "next";
import { Link } from "@/ui/primitives/link";
import { Image } from "@/ui/primitives/image";
import { Text } from "@/ui/primitives/layout";
import { Price } from "./price";
import { AvailabilityBadge } from "./availability-badge";

/**
 * ProductCard (catalogue-scoped, presentational). Takes a plain summary as props;
 * contains no data access or provider code. Always links to the canonical
 * /products/[slug] URL (FR-17a).
 */
export interface ProductCardData {
  readonly slug: string;
  readonly name: string;
  readonly heroImage: { readonly mediaRef: string; readonly alt: string } | null;
  readonly fromPriceCents: number;
  readonly availability: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  readonly imageUrl: string | null;
}

/**
 * Build the canonical product href as an INTERPOLATED path (e.g. /products/my-slug).
 * The object form `{ pathname: "/products/[slug]", query: { slug } }` renders the route
 * template literally under typedRoutes (/products/[slug]?slug=...), so we interpolate the
 * dynamic segment directly and type it as a Route for typedRoutes.
 */
function productHref(slug: string): Route {
  return `/products/${encodeURIComponent(slug)}` as Route;
}

export function ProductCard({ product }: { readonly product: ProductCardData }) {
  const href = productHref(product.slug);
  return (
    <article className="group flex flex-col gap-3">
      <Link
        href={href}
        className="block overflow-hidden rounded-lg bg-surface-muted"
        aria-label={product.name}
      >
        <div className="relative aspect-[4/5] w-full">
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.heroImage?.alt ?? product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-slow group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : null}
        </div>
      </Link>
      <div className="flex items-center justify-between gap-2">
        <Text as="h3" className="font-heading text-base">
          <Link href={href} className="text-text-primary no-underline hover:underline">
            {product.name}
          </Link>
        </Text>
        <AvailabilityBadge status={product.availability} />
      </div>
      <Price cents={product.fromPriceCents} from />
    </article>
  );
}
