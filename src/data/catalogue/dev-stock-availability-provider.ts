import "server-only";
import type { ReadOnlyStockAvailabilityProvider } from "@/application/catalogue/stock-availability-port";

/**
 * Deterministic development implementation of the read-only stock provider
 * (Spec 2, FR-8b). It derives a stable pseudo-quantity from the stock key so local
 * dev / tests / preview show a realistic mix of IN_STOCK / LOW_STOCK / OUT_OF_STOCK
 * without any operational inventory system. TEMPORARY, non-production.
 *
 * The real provider (backed by trusted inventory) is delivered in a later Spec.
 */
export const devStockAvailabilityProvider: ReadOnlyStockAvailabilityProvider = {
  async getQuantities(stockKeys) {
    const map = new Map<string, number | null>();
    for (const key of stockKeys) {
      map.set(key, pseudoQuantity(key));
    }
    return map;
  },
};

/** Stable 0..20 quantity derived from the key (deterministic across runs). */
function pseudoQuantity(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  }
  return hash % 21; // 0..20 → yields OUT/LOW/IN mixes given threshold 5
}
