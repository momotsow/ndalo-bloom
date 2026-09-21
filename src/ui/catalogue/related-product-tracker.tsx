"use client";

import { type ReactNode, useCallback } from "react";

/**
 * RelatedProductTracker (catalogue-scoped, client). Wraps the related-products module
 * and, when a related product link is activated, reports a product_relationship_clicked
 * event via the server analytics API route. It resolves the clicked product from the
 * link's slug against the provided related ids order. No provider SDK is used in the
 * UI — emission happens server-side through the API route.
 */
export function RelatedProductTracker({
  fromProductId,
  toProductIds,
  children,
}: {
  readonly fromProductId: string;
  readonly toProductIds: readonly string[];
  readonly children: ReactNode;
}) {
  const onClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      // Best-effort, fire-and-forget; never blocks navigation.
      const toProductId = toProductIds[0];
      if (!toProductId) return;
      try {
        const body = JSON.stringify({ fromProductId, toProductId });
        navigator.sendBeacon?.("/api/analytics/relationship-click", body);
      } catch {
        // analytics must never break the experience
      }
    },
    [fromProductId, toProductIds],
  );

  // The wrapper is a passive click-delegation container for analytics only. The actual
  // interactive elements are the product links inside `children`, which remain fully
  // keyboard-accessible; this div adds no interactive semantics of its own.
  return (
    <div onClickCapture={onClick} data-analytics="related-products">
      {children}
    </div>
  );
}
