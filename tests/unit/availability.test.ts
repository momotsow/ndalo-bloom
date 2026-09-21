import { describe, it, expect } from "vitest";
import {
  deriveAvailability,
  AvailabilityStatus,
  DEFAULT_LOW_STOCK_THRESHOLD,
} from "@/domain/catalogue";

/**
 * Availability derivation (FR-8): read-only derived status with configurable threshold.
 */
describe("deriveAvailability", () => {
  it("returns OUT_OF_STOCK for zero, null, or undefined", () => {
    expect(deriveAvailability(0)).toBe(AvailabilityStatus.OUT_OF_STOCK);
    expect(deriveAvailability(null)).toBe(AvailabilityStatus.OUT_OF_STOCK);
    expect(deriveAvailability(undefined)).toBe(AvailabilityStatus.OUT_OF_STOCK);
  });

  it("returns LOW_STOCK at or below the default threshold (5), above zero", () => {
    expect(deriveAvailability(1)).toBe(AvailabilityStatus.LOW_STOCK);
    expect(deriveAvailability(5)).toBe(AvailabilityStatus.LOW_STOCK);
    expect(DEFAULT_LOW_STOCK_THRESHOLD).toBe(5);
  });

  it("returns IN_STOCK above the threshold", () => {
    expect(deriveAvailability(6)).toBe(AvailabilityStatus.IN_STOCK);
    expect(deriveAvailability(100)).toBe(AvailabilityStatus.IN_STOCK);
  });

  it("honours a configurable threshold", () => {
    expect(deriveAvailability(8, 10)).toBe(AvailabilityStatus.LOW_STOCK);
    expect(deriveAvailability(11, 10)).toBe(AvailabilityStatus.IN_STOCK);
  });
});
