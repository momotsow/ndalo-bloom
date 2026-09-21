import { z } from "zod";

/**
 * Shared helper for building validated configuration accessors (FR-7).
 *
 * Configuration is NOT validated unconditionally at startup. Instead, each config
 * category exposes a `load()` function that validates ONLY when the dependent feature
 * first needs it (feature-scoped validation). Results are memoized.
 *
 * Errors are clear and NON-SENSITIVE: they name the offending variable and the
 * expectation, and never include the offending value.
 */

export class ConfigError extends Error {
  constructor(scope: string, issues: readonly z.ZodIssue[]) {
    const lines = issues.map((issue) => {
      const key = issue.path.join(".") || "(root)";
      return `  - ${key}: ${issue.message}`;
    });
    super(
      `Invalid ${scope} configuration. Fix the following environment variable(s):\n` +
        lines.join("\n"),
    );
    this.name = "ConfigError";
  }
}

/**
 * Build a memoized, lazily-validated config loader.
 *
 * @param scope   Human-readable category name used in error messages.
 * @param schema  Zod schema describing the required variables.
 * @param source  Raw source of values (defaults to process.env).
 */
export function createConfig<TSchema extends z.ZodTypeAny>(
  scope: string,
  schema: TSchema,
  source: () => Record<string, string | undefined> = () => process.env,
): () => z.infer<TSchema> {
  let cached: z.infer<TSchema> | undefined;

  return function load(): z.infer<TSchema> {
    if (cached !== undefined) {
      return cached;
    }
    const result = schema.safeParse(source());
    if (!result.success) {
      // Never log or include the raw values — only variable names + messages.
      throw new ConfigError(scope, result.error.issues);
    }
    cached = result.data;
    return cached;
  };
}
