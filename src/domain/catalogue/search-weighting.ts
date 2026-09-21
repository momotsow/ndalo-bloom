/**
 * SearchWeighting — a configurable value object carrying the ACTUAL relevance weights
 * used by the PostgreSQL search implementation (Spec 2, FR-19a).
 *
 * The weights map to Postgres `ts_rank` weight labels A/B/C/D (A highest). The default
 * ordering is name > scent > benefit > description. Changing these values changes
 * ranking without requiring a SearchService rewrite. Pure domain module.
 */

export interface SearchWeighting {
  readonly name: number;
  readonly scent: number;
  readonly benefit: number;
  readonly description: number;
}

/** Locked default: name(4) > scent(3) > benefit(2) > description(1). */
export const DEFAULT_SEARCH_WEIGHTING: SearchWeighting = {
  name: 4,
  scent: 3,
  benefit: 2,
  description: 1,
};

/** Postgres ts_rank weight labels, highest → lowest. */
export type TsRankWeightLabel = "A" | "B" | "C" | "D";

/**
 * Map the four weighted fields to Postgres weight labels by descending weight, so the
 * highest-weighted field gets label 'A'. This guarantees the numeric weighting is
 * actually reflected in the tsvector weighting (not merely nominal).
 */
export function toWeightLabels(
  weighting: SearchWeighting = DEFAULT_SEARCH_WEIGHTING,
): Record<keyof SearchWeighting, TsRankWeightLabel> {
  const fields = (Object.keys(weighting) as Array<keyof SearchWeighting>).sort(
    (a, b) => weighting[b] - weighting[a],
  );
  const labels: TsRankWeightLabel[] = ["A", "B", "C", "D"];
  const result = {} as Record<keyof SearchWeighting, TsRankWeightLabel>;
  fields.forEach((field, index) => {
    result[field] = labels[Math.min(index, labels.length - 1)]!;
  });
  return result;
}

/**
 * The `ts_rank` weights array Postgres expects as `{D, C, B, A}` (note the reversed
 * order in the Postgres signature). Derived from the numeric weighting so that ranking
 * genuinely uses the configured values.
 */
export function toTsRankWeightsArray(
  weighting: SearchWeighting = DEFAULT_SEARCH_WEIGHTING,
): [number, number, number, number] {
  const sorted = [
    weighting.name,
    weighting.scent,
    weighting.benefit,
    weighting.description,
  ].sort((a, b) => a - b);
  const max = sorted[sorted.length - 1] || 1;
  // Normalise to 0..1 for ts_rank; order is [D, C, B, A].
  const [d, c, b, a] = sorted.map((w) => w / max) as [number, number, number, number];
  return [d, c, b, a];
}
