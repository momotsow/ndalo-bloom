import { describe, it, expect } from "vitest";
import { z } from "zod";
import { createConfig, ConfigError } from "@/config/env";

/**
 * Configuration behaviour (FR-7): feature-scoped validation, clear + NON-SENSITIVE
 * errors (variable name + expectation, never the value), and memoization.
 */
describe("createConfig", () => {
  it("validates lazily and returns typed values", () => {
    const load = createConfig("test", z.object({ API_KEY: z.string().min(1) }), () => ({
      API_KEY: "present",
    }));
    expect(load().API_KEY).toBe("present");
  });

  it("throws a ConfigError naming the variable but not its value", () => {
    const secretValue = "super-secret-should-not-appear";
    const load = createConfig(
      "test",
      z.object({ API_KEY: z.string().min(20, "API_KEY looks too short") }),
      () => ({ API_KEY: secretValue.slice(0, 3) }),
    );
    try {
      load();
      throw new Error("expected ConfigError");
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      const message = (err as ConfigError).message;
      expect(message).toContain("API_KEY");
      expect(message).not.toContain(secretValue.slice(0, 3));
    }
  });

  it("does not validate until the loader is called (feature-scoped)", () => {
    let sourceReads = 0;
    const load = createConfig("test", z.object({ X: z.string() }), () => {
      sourceReads += 1;
      return { X: "ok" };
    });
    expect(sourceReads).toBe(0);
    load();
    load();
    // memoized: source read exactly once
    expect(sourceReads).toBe(1);
  });
});
