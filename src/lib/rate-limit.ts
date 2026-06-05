/**
 * rate-limit.ts — best-effort in-memory per-IP limiter to cap LLM quota burn.
 *
 * Limitation: in-memory state is per serverless instance and resets on cold start, so this is
 * a soft cap, not a hard guarantee on Vercel. A KV-backed limiter (Vercel KV / Upstash) is the
 * robust upgrade and is the natural companion to a KV-backed shareable-link store.
 */

type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;

const buckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number };

export function checkRateLimit(
  key: string,
  now: number = Date.now(),
  max: number = MAX_PER_WINDOW,
): RateLimitResult {
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    const fresh: Bucket = { count: 1, resetAt: now + WINDOW_MS };
    buckets.set(key, fresh);
    return { allowed: true, remaining: max - 1, resetAt: fresh.resetAt };
  }

  if (bucket.count >= max) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }

  bucket.count += 1;
  return { allowed: true, remaining: max - bucket.count, resetAt: bucket.resetAt };
}

/** Test-only: clear all buckets between cases. */
export function _resetRateLimit(): void {
  buckets.clear();
}
