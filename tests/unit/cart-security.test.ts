import { describe, it, expect } from "vitest";
import {
  addItemInputSchema,
  updateItemInputSchema,
  removeItemInputSchema,
} from "@/application/cart/read-models";
import { isValidCartTokenShape } from "@/application/cart/cart-token";
import { updateLineQuantity, InvalidQuantityError } from "@/domain/cart";

/**
 * Cart security/validation (Spec 3, T-7, S-1/S-3, V-2): the server rejects tampered or
 * invalid input. Prices/totals are never accepted from the client — the input schemas do
 * not even include price/total fields, so tampering is structurally impossible.
 */
describe("cart input validation rejects tampering", () => {
  it("add input accepts only variantId + quantity 1..99 (no price/total field)", () => {
    expect(addItemInputSchema.safeParse({ variantId: "v1", quantity: 1 }).success).toBe(
      true,
    );
    expect(addItemInputSchema.safeParse({ variantId: "v1", quantity: 0 }).success).toBe(
      false,
    );
    expect(addItemInputSchema.safeParse({ variantId: "v1", quantity: -3 }).success).toBe(
      false,
    );
    expect(addItemInputSchema.safeParse({ variantId: "v1", quantity: 100 }).success).toBe(
      false,
    );
    expect(addItemInputSchema.safeParse({ variantId: "v1", quantity: 2.5 }).success).toBe(
      false,
    );
    expect(addItemInputSchema.safeParse({ variantId: "", quantity: 1 }).success).toBe(
      false,
    );

    // A tampered price/total is stripped/ignored — parsed output never carries it.
    const parsed = addItemInputSchema.parse({
      variantId: "v1",
      quantity: 1,
      unitPriceCents: 1,
      totalCents: 1,
    } as unknown as { variantId: string; quantity: number });
    expect(parsed).toEqual({ variantId: "v1", quantity: 1 });
    expect((parsed as Record<string, unknown>).unitPriceCents).toBeUndefined();
    expect((parsed as Record<string, unknown>).totalCents).toBeUndefined();
  });

  it("update input rejects quantities outside 1..99", () => {
    expect(
      updateItemInputSchema.safeParse({ variantId: "v1", quantity: 99 }).success,
    ).toBe(true);
    expect(
      updateItemInputSchema.safeParse({ variantId: "v1", quantity: 100 }).success,
    ).toBe(false);
    expect(
      updateItemInputSchema.safeParse({ variantId: "v1", quantity: 0 }).success,
    ).toBe(false);
  });

  it("remove input requires a non-empty variantId", () => {
    expect(removeItemInputSchema.safeParse({ variantId: "v1" }).success).toBe(true);
    expect(removeItemInputSchema.safeParse({ variantId: "" }).success).toBe(false);
  });

  it("rejects malformed cart tokens", () => {
    expect(isValidCartTokenShape("A".repeat(43))).toBe(true);
    expect(isValidCartTokenShape("short")).toBe(false);
    expect(isValidCartTokenShape("bad token with spaces!!")).toBe(false);
    expect(isValidCartTokenShape(undefined)).toBe(false);
  });

  it("domain update never clamps a tampered >99 quantity — it rejects", () => {
    expect(() =>
      updateLineQuantity([{ variantId: "v1", quantity: 1 }], "v1", 1000),
    ).toThrow(InvalidQuantityError);
  });
});
