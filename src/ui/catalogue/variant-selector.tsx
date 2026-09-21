"use client";

import { useState } from "react";
import { RadioGroup, Radio } from "@/ui/primitives/radio";
import { Price } from "./price";
import { AvailabilityBadge } from "./availability-badge";

/**
 * Variant selector (catalogue-scoped, client component). Presentational: lets the
 * customer choose a variant and shows its price + availability. No cart logic (Spec 2
 * excludes cart). No data access.
 */
export interface VariantOption {
  readonly id: string;
  readonly name: string;
  readonly priceCents: number;
  readonly availability: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK";
}

export function VariantSelector({
  variants,
}: {
  readonly variants: readonly VariantOption[];
}) {
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  if (variants.length === 0) return null;
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0]!;

  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="text-sm font-medium text-text-primary">Options</legend>
        <RadioGroup
          value={selectedId}
          onValueChange={setSelectedId}
          className="mt-2 gap-2"
          aria-label="Product options"
        >
          {variants.map((v) => (
            <label key={v.id} className="flex items-center gap-2">
              <Radio value={v.id} />
              <span className="text-text-primary">{v.name}</span>
            </label>
          ))}
        </RadioGroup>
      </fieldset>
      <div className="flex items-center gap-3">
        <Price cents={selected.priceCents} />
        <AvailabilityBadge status={selected.availability} />
      </div>
    </div>
  );
}
