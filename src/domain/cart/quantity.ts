/**
 * Cart quantity rules (Spec 3, BR-2/BR-3/BR-7). Pure domain: no framework/infra/provider.
 *
 * Valid quantity is an integer in [MIN_QUANTITY, MAX_QUANTITY].
 * - `addLine` is ADDITIVE and CLAMPS the result to MAX_QUANTITY (surfacing a notice).
 * - `updateLineQuantity` is an ABSOLUTE SET and REJECTS values outside the range.
 */

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 99;

export function isValidQuantity(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_QUANTITY && value <= MAX_QUANTITY;
}

/** Whether a requested increment amount is a usable positive integer. */
export function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value >= 1;
}

/**
 * Add `requested` to `current`, clamping the result to MAX_QUANTITY.
 * Returns the resulting quantity and whether clamping occurred.
 */
export function incrementClamped(
  current: number,
  requested: number,
): { readonly value: number; readonly clamped: boolean } {
  const raw = current + requested;
  if (raw > MAX_QUANTITY) {
    return { value: MAX_QUANTITY, clamped: true };
  }
  return { value: raw, clamped: false };
}
