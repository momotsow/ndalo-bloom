"use client";

import { AddToCartButton } from "@/ui/cart/add-to-cart-button";
import { addItemAction } from "@/app/(store)/cart/actions";

/**
 * Binds the add-to-cart server action to the presentational AddToCartButton on the
 * product page. Keeps the UI component action-agnostic; the action performs cookie I/O,
 * rate limiting, validation, and analytics.
 */
export function ProductAddToCart({
  variantId,
  disabled,
}: {
  readonly variantId: string;
  readonly disabled?: boolean;
}) {
  return (
    <AddToCartButton
      variantId={variantId}
      quantity={1}
      disabled={disabled}
      onAdd={addItemAction}
    />
  );
}
