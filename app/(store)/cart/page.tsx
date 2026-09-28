import type { Metadata } from "next";
import { Container, Grid, Heading, Stack } from "@/ui/primitives/layout";
import { Empty } from "@/ui/primitives/state";
import { CartLineItem } from "@/ui/cart/cart-line-item";
import { CartSummary } from "@/ui/cart/cart-summary";
import { cartService } from "@/application/cart/cart-service";
import { toCartLineView } from "@/application/cart/view-mappers";
import { cookies } from "next/headers";
import { CART_COOKIE_NAME, isValidCartTokenShape } from "@/application/cart/cart-token";
import { updateItemAction, removeItemAction } from "./actions";

// Cart is private/transient — never indexed (SEO-1). robots.txt also disallows /cart.
export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: false },
};

// The cart is always dynamic (per-guest, cookie-based).
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const store = await cookies();
  const raw = store.get(CART_COOKIE_NAME)?.value;
  const token = isValidCartTokenShape(raw) ? raw : undefined;

  // Read-only presentation of the cart (does not require a mutation).
  const { cart } = await cartService.getCart({ token });
  const views = cart.lines.map((line) => toCartLineView(line));

  return (
    <Container>
      <Stack gap={6} className="py-10">
        <Heading level={1}>Your cart</Heading>

        {cart.lines.length === 0 ? (
          <Empty
            title="Your cart is empty"
            description="Browse the shop to find your next ritual."
          />
        ) : (
          <Grid columns={3} gap={6}>
            <div className="lg:col-span-2">
              {views.map((v) => (
                <CartLineItem
                  key={v.line.variantId}
                  variantId={v.line.variantId}
                  productName={v.line.productName}
                  variantName={v.line.variantName}
                  unitPriceCents={v.line.unitPriceCents}
                  quantity={v.line.quantity}
                  lineSubtotalCents={v.line.lineSubtotalCents}
                  availability={v.line.availability}
                  unavailable={v.line.unavailable}
                  priceUpdated={v.line.priceUpdated}
                  imageUrl={v.imageUrl}
                  alt={v.alt}
                  onUpdateQuantity={updateItemAction}
                  onRemove={removeItemAction}
                />
              ))}
            </div>
            <CartSummary
              itemCount={cart.itemCount}
              subtotalCents={cart.subtotalCents}
              anyPriceUpdated={cart.anyPriceUpdated}
            />
          </Grid>
        )}
      </Stack>
    </Container>
  );
}
