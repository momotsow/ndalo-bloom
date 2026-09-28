import { describe, it, expect } from "vitest";
import {
  MIN_QUANTITY,
  MAX_QUANTITY,
  isValidQuantity,
  incrementClamped,
  addLine,
  updateLineQuantity,
  removeLine,
  clearLines,
  computeLineSubtotalCents,
  computeSubtotalCents,
  InvalidQuantityError,
  type CartLineIntent,
} from "@/domain/cart";

/**
 * Cart domain rules (Spec 3, T-1): quantity bounds, add (additive + clamp-to-99),
 * update (absolute set, reject >99/<1/non-int), remove/clear, one-line-per-variant,
 * integer-cents math.
 */
describe("cart quantity rules", () => {
  it("validates integer quantities in 1..99", () => {
    expect(MIN_QUANTITY).toBe(1);
    expect(MAX_QUANTITY).toBe(99);
    expect(isValidQuantity(1)).toBe(true);
    expect(isValidQuantity(99)).toBe(true);
    expect(isValidQuantity(0)).toBe(false);
    expect(isValidQuantity(-1)).toBe(false);
    expect(isValidQuantity(100)).toBe(false);
    expect(isValidQuantity(2.5)).toBe(false);
  });

  it("incrementClamped clamps to 99 and reports clamping", () => {
    expect(incrementClamped(1, 1)).toEqual({ value: 2, clamped: false });
    expect(incrementClamped(98, 1)).toEqual({ value: 99, clamped: false });
    expect(incrementClamped(98, 5)).toEqual({ value: 99, clamped: true });
    expect(incrementClamped(99, 1)).toEqual({ value: 99, clamped: true });
  });
});

describe("addLine (additive + clamp)", () => {
  it("appends a new line", () => {
    const { lines, clamped } = addLine([], "v1", 2);
    expect(lines).toEqual([{ variantId: "v1", quantity: 2 }]);
    expect(clamped).toBe(false);
  });

  it("increments an existing line (one line per variant)", () => {
    const start: CartLineIntent[] = [{ variantId: "v1", quantity: 3 }];
    const { lines } = addLine(start, "v1", 4);
    expect(lines).toEqual([{ variantId: "v1", quantity: 7 }]);
    expect(lines).toHaveLength(1);
  });

  it("clamps the result to 99 and flags clamped", () => {
    const start: CartLineIntent[] = [{ variantId: "v1", quantity: 97 }];
    const { lines, clamped } = addLine(start, "v1", 10);
    expect(lines[0]?.quantity).toBe(99);
    expect(clamped).toBe(true);
  });

  it("rejects a non-positive-integer requested amount", () => {
    expect(() => addLine([], "v1", 0)).toThrow(InvalidQuantityError);
    expect(() => addLine([], "v1", -2)).toThrow(InvalidQuantityError);
    expect(() => addLine([], "v1", 1.5)).toThrow(InvalidQuantityError);
  });
});

describe("updateLineQuantity (absolute set, rejects out-of-range)", () => {
  const start: CartLineIntent[] = [{ variantId: "v1", quantity: 3 }];

  it("sets an in-range quantity", () => {
    expect(updateLineQuantity(start, "v1", 10)).toEqual([
      { variantId: "v1", quantity: 10 },
    ]);
  });

  it("rejects >99, <1, and non-integers (never clamps)", () => {
    expect(() => updateLineQuantity(start, "v1", 100)).toThrow(InvalidQuantityError);
    expect(() => updateLineQuantity(start, "v1", 0)).toThrow(InvalidQuantityError);
    expect(() => updateLineQuantity(start, "v1", 2.5)).toThrow(InvalidQuantityError);
  });
});

describe("removeLine / clearLines", () => {
  it("removes a specific line", () => {
    const start: CartLineIntent[] = [
      { variantId: "v1", quantity: 1 },
      { variantId: "v2", quantity: 2 },
    ];
    expect(removeLine(start, "v1")).toEqual([{ variantId: "v2", quantity: 2 }]);
  });

  it("clears all lines", () => {
    expect(clearLines()).toEqual([]);
  });
});

describe("integer-cents money math", () => {
  it("computes line subtotal and cart subtotal", () => {
    expect(computeLineSubtotalCents(24900, 3)).toBe(74700);
    expect(computeSubtotalCents([74700, 15000, 0])).toBe(89700);
    expect(computeSubtotalCents([])).toBe(0);
  });
});
