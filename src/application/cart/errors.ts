/**
 * Cart error model (Spec 3, §11, V-3/E-1..E-6). Typed, safe, customer-appropriate errors
 * with no internal leakage. Notices (MAX_QUANTITY_REACHED, PRICE_UPDATED) are NOT errors —
 * they travel in the read model.
 */

export type CartErrorCode =
  | "VARIANT_NOT_FOUND"
  | "VARIANT_NOT_PURCHASABLE"
  | "INVALID_QUANTITY"
  | "INVALID_CART_TOKEN";

export class CartError extends Error {
  readonly code: CartErrorCode;
  /** Safe, customer-facing message (no internal detail). */
  readonly customerMessage: string;

  constructor(code: CartErrorCode, customerMessage: string) {
    super(`${code}: ${customerMessage}`);
    this.name = "CartError";
    this.code = code;
    this.customerMessage = customerMessage;
  }
}

export const cartErrors = {
  variantNotFound(): CartError {
    return new CartError("VARIANT_NOT_FOUND", "That product option could not be found.");
  },
  variantNotPurchasable(): CartError {
    return new CartError(
      "VARIANT_NOT_PURCHASABLE",
      "That product option is not available to purchase right now.",
    );
  },
  invalidQuantity(): CartError {
    return new CartError(
      "INVALID_QUANTITY",
      "Please choose a quantity between 1 and 99.",
    );
  },
  invalidCartToken(): CartError {
    return new CartError("INVALID_CART_TOKEN", "Your cart could not be read.");
  },
};
