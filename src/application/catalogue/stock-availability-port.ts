/**
 * ReadOnlyStockAvailabilityProvider — abstract, READ-ONLY dependency for obtaining
 * trusted stock quantities (Spec 2, FR-8b/FR-8c).
 *
 * Spec 2 does NOT own inventory. This port lets the catalogue read trusted stock to
 * DERIVE availability without implementing any operational inventory system. The real
 * implementation arrives in a later Commerce/Admin/Inventory Spec; Spec 2 provides only
 * a deterministic development implementation (in the data layer).
 */
export interface ReadOnlyStockAvailabilityProvider {
  /**
   * Return trusted units available for a set of stock keys. Missing keys map to null
   * (treated as OUT_OF_STOCK by the domain). This method is strictly read-only.
   */
  getQuantities(
    stockKeys: readonly string[],
  ): Promise<ReadonlyMap<string, number | null>>;
}
