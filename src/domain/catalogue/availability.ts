/**
 * Availability — a DERIVED, read-only domain concept (Spec 2, FR-8/FR-8a).
 *
 * This is NOT a persistent inventory model. `AvailabilityStatus` is computed at read
 * time from a trusted stock quantity (obtained via a read-only provider in the data
 * layer) and a configurable low-stock threshold. No stock is mutated here.
 *
 * Pure domain module: no framework, infrastructure, or provider dependencies.
 */

export const AvailabilityStatus = {
  IN_STOCK: "IN_STOCK",
  LOW_STOCK: "LOW_STOCK",
  OUT_OF_STOCK: "OUT_OF_STOCK",
} as const;

export type AvailabilityStatus =
  (typeof AvailabilityStatus)[keyof typeof AvailabilityStatus];

/** Default low-stock threshold (locked human decision: LOW_STOCK <= 5). */
export const DEFAULT_LOW_STOCK_THRESHOLD = 5;

/**
 * Derive availability from a trusted quantity.
 *
 * @param quantity   Trusted units available (>= 0). If unknown/null, treated as
 *                   OUT_OF_STOCK conservatively.
 * @param threshold  Low-stock threshold (configurable; default 5). quantity <= threshold
 *                   (and > 0) is LOW_STOCK.
 */
export function deriveAvailability(
  quantity: number | null | undefined,
  threshold: number = DEFAULT_LOW_STOCK_THRESHOLD,
): AvailabilityStatus {
  if (quantity === null || quantity === undefined || quantity <= 0) {
    return AvailabilityStatus.OUT_OF_STOCK;
  }
  if (quantity <= threshold) {
    return AvailabilityStatus.LOW_STOCK;
  }
  return AvailabilityStatus.IN_STOCK;
}
