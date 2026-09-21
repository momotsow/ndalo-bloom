/**
 * Minimal className combiner. Pure utility (no framework state), safe for server
 * components. Falsy values are dropped; truthy strings are joined with a space.
 */
export function cn(...values: ReadonlyArray<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}
