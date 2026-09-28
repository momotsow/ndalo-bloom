import { Heading, Stack, Text } from "@/ui/primitives/layout";
import { Price } from "@/ui/catalogue/price";

/**
 * CartSummary (Spec 3, §13). Presentational: subtotal only (no tax/shipping/discount),
 * item count, and a cart-level price-updated indicator. No data/provider access.
 */
export function CartSummary({
  itemCount,
  subtotalCents,
  anyPriceUpdated,
}: {
  readonly itemCount: number;
  readonly subtotalCents: number;
  readonly anyPriceUpdated: boolean;
}) {
  return (
    <Stack gap={3} className="rounded-lg border border-border bg-surface p-5">
      <Heading level={2} className="text-lg">
        Summary
      </Heading>
      {anyPriceUpdated ? (
        <Text tone="secondary" className="text-sm text-warning">
          Some prices have been updated since you added them.
        </Text>
      ) : null}
      <div className="flex items-center justify-between">
        <Text tone="secondary">
          Subtotal ({itemCount} item{itemCount === 1 ? "" : "s"})
        </Text>
        <Price cents={subtotalCents} />
      </div>
      <Text tone="muted" className="text-xs">
        Shipping and taxes are calculated at checkout.
      </Text>
    </Stack>
  );
}
