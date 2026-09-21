import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "jest-axe";
import { ProductCard, type ProductCardData } from "@/ui/catalogue/product-card";
import { AvailabilityBadge } from "@/ui/catalogue/availability-badge";

const product: ProductCardData = {
  slug: "the-exhale-ritual-1",
  name: "The Exhale Ritual",
  heroImage: { mediaRef: "ndalo/dev/hero", alt: "The Exhale ritual" },
  fromPriceCents: 24900,
  availability: "IN_STOCK",
  imageUrl: "https://picsum.photos/seed/x/600/750",
};

describe("ProductCard", () => {
  it("links to the canonical /products/[slug] and shows the name + price", () => {
    render(<ProductCard product={product} />);
    const links = screen.getAllByRole("link");
    // typedRoutes may render the object href as /products/[slug]?slug=... ; assert the
    // link targets the products route and carries the canonical slug.
    const productLink = links.find((a) => {
      const href = a.getAttribute("href") ?? "";
      return href.includes("/products/") && href.includes("the-exhale-ritual-1");
    });
    expect(productLink).toBeTruthy();
    expect(screen.getByText("The Exhale Ritual")).toBeInTheDocument();
    expect(screen.getByText(/R\s?249/)).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(<ProductCard product={product} />);
    const results = await axe(container);
    expect(results.violations).toEqual([]);
  });
});

describe("AvailabilityBadge", () => {
  it("renders an accessible label per status", () => {
    const { rerender } = render(<AvailabilityBadge status="IN_STOCK" />);
    expect(screen.getByText("In stock")).toBeInTheDocument();
    rerender(<AvailabilityBadge status="LOW_STOCK" />);
    expect(screen.getByText("Low stock")).toBeInTheDocument();
    rerender(<AvailabilityBadge status="OUT_OF_STOCK" />);
    expect(screen.getByText("Out of stock")).toBeInTheDocument();
  });
});
