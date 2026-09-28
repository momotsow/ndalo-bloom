"use client";

import { useState, useTransition } from "react";
import { Button } from "@/ui/primitives/button";

/**
 * AddToCartButton (Spec 3, §13). Client component that invokes the add-to-cart server
 * action passed as a prop (UI holds no data/provider access). Announces results via a
 * live region for assistive tech (A-2), including the max-quantity-reached notice.
 */
export interface AddToCartButtonProps {
  readonly variantId: string;
  readonly quantity?: number;
  readonly disabled?: boolean;
  /** Server action; injected so this component stays UI-only. */
  readonly onAdd: (input: { variantId: string; quantity: number }) => Promise<{
    ok: boolean;
    message?: string;
    cart?: { notices: Array<{ type: string; variantId?: string }> };
  }>;
}

export function AddToCartButton({
  variantId,
  quantity = 1,
  disabled = false,
  onAdd,
}: AddToCartButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function handleClick() {
    startTransition(async () => {
      const result = await onAdd({ variantId, quantity });
      if (!result.ok) {
        setMessage(result.message ?? "We couldn't add that to your cart.");
        return;
      }
      const maxReached = result.cart?.notices?.some(
        (n) => n.type === "MAX_QUANTITY_REACHED" && n.variantId === variantId,
      );
      setMessage(maxReached ? "Maximum quantity reached (99)." : "Added to your cart.");
    });
  }

  return (
    <div>
      <Button type="button" onClick={handleClick} loading={isPending} disabled={disabled}>
        Add to cart
      </Button>
      <p role="status" aria-live="polite" className="sr-only">
        {message}
      </p>
    </div>
  );
}
