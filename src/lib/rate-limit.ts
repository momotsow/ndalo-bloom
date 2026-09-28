/**
 * Minimal in-memory sliding-window rate limiter (Spec 3, S-4). No new dependency and no
 * new infrastructure — a lightweight guard for cart mutation entrypoints.
 *
 * NOTE: in-memory state is per-process; on multi-instance deployments this is a
 * best-effort limiter. A shared store (e.g. Redis) can replace it later behind the same
 * `checkRateLimit` contract without changing callers. Documented as known technical debt.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  readonly allowed: boolean;
  readonly remaining: number;
}

/**
 * Allow up to `limit` events per `windowMs` for a given key. Returns whether the current
 * event is allowed and how many remain in the window.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now: number = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key) ?? { timestamps: [] };
  const cutoff = now - windowMs;
  const recent = bucket.timestamps.filter((t) => t > cutoff);

  if (recent.length >= limit) {
    buckets.set(key, { timestamps: recent });
    return { allowed: false, remaining: 0 };
  }

  recent.push(now);
  buckets.set(key, { timestamps: recent });
  return { allowed: true, remaining: Math.max(0, limit - recent.length) };
}

/** Test helper: clear all limiter state. */
export function __resetRateLimiter(): void {
  buckets.clear();
}
