/**
 * Cart money math (Spec 3, PM-1/PM-2). Pure integer ZAR cents — no floating point.
 * Prices are INJECTED by the application layer from current catalogue data; the domain
 * never fetches or stores prices.
 */

/** Line subtotal = unit price (cents) × quantity. Both must be non-negative integers. */
export function computeLineSubtotalCents(
  unitPriceCents: number,
  quantity: number,
): number {
  return unitPriceCents * quantity;
}

/** Cart subtotal = sum of line subtotals (cents). */
export function computeSubtotalCents(lineSubtotalsCents: readonly number[]): number {
  return lineSubtotalsCents.reduce((sum, n) => sum + n, 0);
}
