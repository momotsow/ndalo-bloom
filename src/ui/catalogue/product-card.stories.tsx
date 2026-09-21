import type { Meta, StoryObj } from "@storybook/react";
import { ProductCard } from "./product-card";

/**
 * # ProductCard
 *
 * **Purpose:** Compact product presentation for grids/listings.
 *
 * **Intended usage:** Fed a plain summary (with a pre-resolved image URL from the
 * application view-mapper). Always links to the canonical `/products/[slug]`.
 *
 * **Accessibility:** Image has meaningful alt; the card title is a real link; the
 * availability badge conveys status with text (not colour alone).
 *
 * **Variants/States:** availability IN_STOCK / LOW_STOCK / OUT_OF_STOCK.
 *
 * **Responsive:** fills its grid cell; image uses a 4:5 aspect ratio.
 *
 * **Prohibited usage:** no data fetching or provider access inside the card.
 */
const meta: Meta<typeof ProductCard> = {
  title: "Catalogue/ProductCard",
  component: ProductCard,
  tags: ["autodocs"],
};
export default meta;

type Story = StoryObj<typeof ProductCard>;

const base = {
  slug: "the-exhale-ritual-1",
  name: "The Exhale Ritual",
  heroImage: { mediaRef: "ndalo/dev/hero", alt: "The Exhale ritual" },
  fromPriceCents: 24900,
  imageUrl: "https://picsum.photos/seed/exhale/600/750",
};

export const InStock: Story = {
  args: { product: { ...base, availability: "IN_STOCK" } },
};
export const LowStock: Story = {
  args: { product: { ...base, availability: "LOW_STOCK" } },
};
export const OutOfStock: Story = {
  args: { product: { ...base, availability: "OUT_OF_STOCK" } },
};
