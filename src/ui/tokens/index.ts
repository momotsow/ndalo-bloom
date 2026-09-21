/**
 * Typed references to SEMANTIC token names.
 *
 * These are the semantic token identifiers components may rely on. The concrete values
 * live in the CSS variable layer (primitives.css -> semantic.css). This module exists so
 * TypeScript code (e.g. Storybook docs, tests) can reference token names safely.
 */

export const semanticColorTokens = [
  "background",
  "surface",
  "surface-muted",
  "border",
  "text-primary",
  "text-secondary",
  "text-muted",
  "accent",
  "accent-foreground",
  "focus",
  "success",
  "warning",
  "error",
] as const;

export type SemanticColorToken = (typeof semanticColorTokens)[number];

export const radiusTokens = ["sm", "md", "lg", "xl", "full"] as const;
export type RadiusToken = (typeof radiusTokens)[number];

export const shadowTokens = ["sm", "md", "lg"] as const;
export type ShadowToken = (typeof shadowTokens)[number];

export const motionTokens = ["fast", "base", "slow"] as const;
export type MotionToken = (typeof motionTokens)[number];
