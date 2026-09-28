import { incrementClamped, isValidQuantity, isPositiveInteger } from "./quantity";

/**
 * Cart line intent operations (Spec 3, §1). Pure domain over intent state.
 *
 * A `CartLineIntent` is purchase intent only — a variant reference and a quantity. It
 * holds NO catalogue facts (name/price/availability/image); those are resolved at read
 * time by the application layer (source-of-truth: catalogue).
 *
 * Distinction (locked):
 * - `addLine`  : ADDITIVE; result clamps to MAX_QUANTITY, returns `clamped`.
 * - `updateLineQuantity` : ABSOLUTE SET; rejects values outside [MIN, MAX].
 */

export interface CartLineIntent {
  readonly variantId: string;
  readonly quantity: number;
}

export class InvalidQuantityError extends Error {
  constructor(message = "Quantity must be an integer between 1 and 99.") {
    super(message);
    this.name = "InvalidQuantityError";
  }
}

/**
 * Add `requested` units of `variantId`. If a line exists, increment additively and clamp
 * to the max; otherwise append a new line (clamped to max). `requested` must be a positive
 * integer. Returns the new lines and whether the result was clamped.
 */
export function addLine(
  lines: readonly CartLineIntent[],
  variantId: string,
  requested: number,
): { readonly lines: CartLineIntent[]; readonly clamped: boolean } {
  if (!isPositiveInteger(requested)) {
    throw new InvalidQuantityError("Requested quantity must be a positive integer.");
  }
  const existing = lines.find((l) => l.variantId === variantId);
  const current = existing ? existing.quantity : 0;
  const { value, clamped } = incrementClamped(current, requested);

  const next = existing
    ? lines.map((l) => (l.variantId === variantId ? { ...l, quantity: value } : l))
    : [...lines, { variantId, quantity: value }];

  return { lines: next, clamped };
}

/**
 * Set an existing line's quantity to an absolute value. Rejects any value outside
 * [MIN, MAX] (never clamps). This is not a remove; use `removeLine` to delete.
 */
export function updateLineQuantity(
  lines: readonly CartLineIntent[],
  variantId: string,
  quantity: number,
): CartLineIntent[] {
  if (!isValidQuantity(quantity)) {
    throw new InvalidQuantityError();
  }
  return lines.map((l) => (l.variantId === variantId ? { ...l, quantity } : l));
}

/** Remove a line by variant id (explicit removal). */
export function removeLine(
  lines: readonly CartLineIntent[],
  variantId: string,
): CartLineIntent[] {
  return lines.filter((l) => l.variantId !== variantId);
}

/** Clear all lines. */
export function clearLines(): CartLineIntent[] {
  return [];
}
