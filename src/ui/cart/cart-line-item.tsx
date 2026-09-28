"use client";

import { useState, useTransition } from "react";
import { Image } from "@/ui/primitives/image";
import { Button } from "@/ui/primitives/button";
import { Text } from "@/ui/primitives/layout";
import { Price } from "@/ui/catalogue/price";
import { AvailabilityBadge } from "@/ui/catalogue/availability-badge";

/**
 * CartLineItem (Spec 3, §13). Client component: quantity control (absolute set),
 * explicit remove, unavailable flag, per-line price-updated indicator. Calls injected
 * server actions; no data/provider access. Announces changes via a live region.
 */
export interface CartLineItemProps {
  readonly variantId: string;
  readonly productName: string | null;
  readonly variantName: string | null;
  readonly unitPriceCents: number;
  readonly quantity: number;
  readonly lineSubtotalCents: number;
  readonly availability: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
  readonly unavailable: boolean;
  readonly priceUpdated: boolean;
  readonly imageUrl: string | null;
  readonly alt: string;
  readonly onUpdateQuantity: (input: {
    variantId: string;
    quantity: number;
  }) => Promise<{ ok: boolean; message?: string }>;
  readonly onRemove: (input: {
    variantId: string;
  }) => Promise<{ ok: boolean; message?: string }>;
}

const QTY_OPTIONS = Array.from({ length: 99 }, (_, i) => i + 1);

export function CartLineItem(props: CartLineItemProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  function updateQuantity(quantity: number) {
    startTransition(async () => {
      const r = await props.onUpdateQuantity({ variantId: props.variantId, quantity });
      setMessage(
        r.ok ? "Quantity updated." : (r.message ?? "Could not update quantity."),
      );
    });
  }

  function remove() {
    startTransition(async () => {
      const r = await props.onRemove({ variantId: props.variantId });
      setMessage(r.ok ? "Item removed." : (r.message ?? "Could not remove item."));
    });
  }

  const title = props.productName ?? "Unavailable product";

  return (
    <article className="flex gap-4 border-b border-border py-4">
      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-md bg-surface-muted">
        {props.imageUrl ? (
          <Image
            src={props.imageUrl}
            alt={props.alt}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <Text as="h3" className="font-heading text-base text-text-primary">
          {title}
        </Text>
        {props.variantName ? (
          <Text tone="secondary" className="text-sm">
            {props.variantName}
          </Text>
        ) : null}

        <div className="mt-1 flex flex-wrap items-center gap-3">
          <AvailabilityBadge status={props.availability} />
          {props.unavailable ? (
            <span className="text-sm text-error">Unavailable — please remove</span>
          ) : null}
          {props.priceUpdated ? (
            <span className="text-sm text-warning">Price updated</span>
          ) : null}
        </div>

        <div className="mt-2 flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <span>Qty</span>
            <select
              aria-label={`Quantity for ${title}`}
              value={props.quantity}
              disabled={isPending || props.unavailable}
              onChange={(e) => updateQuantity(Number(e.target.value))}
              className="h-9 rounded-md border border-border bg-surface px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              {QTY_OPTIONS.map((q) => (
                <option key={q} value={q}>
                  {q}
                </option>
              ))}
            </select>
          </label>

          <Button type="button" variant="ghost" onClick={remove} loading={isPending}>
            Remove
          </Button>
        </div>
      </div>

      <div className="text-right">
        <Price cents={props.lineSubtotalCents} />
        <Text tone="muted" className="text-xs">
          <Price cents={props.unitPriceCents} /> each
        </Text>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {message}
      </p>
    </article>
  );
}
