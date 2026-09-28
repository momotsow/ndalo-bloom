import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe } from "jest-axe";
import { AddToCartButton } from "@/ui/cart/add-to-cart-button";
import { CartSummary } from "@/ui/cart/cart-summary";

/**
 * Cart UI component/axe tests (Spec 3, T-4). Presentational behaviour + accessibility.
 */
describe("AddToCartButton", () => {
  it("calls the injected add action and announces success", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue({ ok: true, cart: { notices: [] } });
    render(<AddToCartButton variantId="v1" quantity={1} onAdd={onAdd} />);
    await user.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(onAdd).toHaveBeenCalledWith({ variantId: "v1", quantity: 1 });
    expect(await screen.findByText("Added to your cart.")).toBeInTheDocument();
  });

  it("announces the max-quantity notice when clamped", async () => {
    const user = userEvent.setup();
    const onAdd = vi.fn().mockResolvedValue({
      ok: true,
      cart: { notices: [{ type: "MAX_QUANTITY_REACHED", variantId: "v1" }] },
    });
    render(<AddToCartButton variantId="v1" onAdd={onAdd} />);
    await user.click(screen.getByRole("button", { name: "Add to cart" }));
    expect(await screen.findByText(/Maximum quantity reached/)).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const onAdd = vi.fn().mockResolvedValue({ ok: true, cart: { notices: [] } });
    const { container } = render(<AddToCartButton variantId="v1" onAdd={onAdd} />);
    expect((await axe(container)).violations).toEqual([]);
  });
});

describe("CartSummary", () => {
  it("shows subtotal, item count, and price-updated indicator", () => {
    render(<CartSummary itemCount={2} subtotalCents={35000} anyPriceUpdated />);
    expect(screen.getByText(/Subtotal \(2 items\)/)).toBeInTheDocument();
    expect(screen.getByText(/R\s?350/)).toBeInTheDocument();
    expect(screen.getByText(/prices have been updated/i)).toBeInTheDocument();
  });

  it("has no axe violations", async () => {
    const { container } = render(
      <CartSummary itemCount={1} subtotalCents={20000} anyPriceUpdated={false} />,
    );
    expect((await axe(container)).violations).toEqual([]);
  });
});
