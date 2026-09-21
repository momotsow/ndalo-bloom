import { describe, it, expect } from "vitest";
import {
  DEFAULT_SEARCH_WEIGHTING,
  toWeightLabels,
  toTsRankWeightsArray,
} from "@/domain/catalogue";

/**
 * SearchWeighting (FR-19a): weights are real and drive ranking labels/array. The default
 * ordering is name > scent > benefit > description, and the derived Postgres artefacts
 * must reflect the configured numeric weights (not nominal).
 */
describe("SearchWeighting", () => {
  it("default order is name > scent > benefit > description", () => {
    const w = DEFAULT_SEARCH_WEIGHTING;
    expect(w.name).toBeGreaterThan(w.scent);
    expect(w.scent).toBeGreaterThan(w.benefit);
    expect(w.benefit).toBeGreaterThan(w.description);
  });

  it("maps the highest weight to label A, descending", () => {
    const labels = toWeightLabels();
    expect(labels.name).toBe("A");
    expect(labels.scent).toBe("B");
    expect(labels.benefit).toBe("C");
    expect(labels.description).toBe("D");
  });

  it("reflects reconfigured weights in labels (not nominal)", () => {
    const labels = toWeightLabels({ name: 1, scent: 2, benefit: 3, description: 4 });
    // description now highest → label A
    expect(labels.description).toBe("A");
    expect(labels.name).toBe("D");
  });

  it("produces a normalised ts_rank weights array ordered [D,C,B,A]", () => {
    const arr = toTsRankWeightsArray();
    expect(arr).toHaveLength(4);
    // ascending by construction; last (A) is the max → 1
    expect(arr[3]).toBe(1);
    expect(arr[0]).toBeLessThanOrEqual(arr[3]);
  });
});
