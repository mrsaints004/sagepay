interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export interface RateLimiter {
  check(key: string): { limited: boolean; remaining: number; resetAt: number };
}

export function createRateLimiter(opts: {
  limit: number;
  windowMs: number;
  maxEntries?: number;
}): RateLimiter {
  const { limit, windowMs, maxEntries = 10_000 } = opts;
  const map = new Map<string, RateLimitEntry>();

  return {
    check(key: string) {
      const now = Date.now();
      const entry = map.get(key);

      if (!entry || now > entry.resetAt) {
        if (map.size > maxEntries) {
          for (const [k, v] of map) {
            if (now > v.resetAt) map.delete(k);
          }
        }
        map.set(key, { count: 1, resetAt: now + windowMs });
        return { limited: false, remaining: limit - 1, resetAt: now + windowMs };
      }

      entry.count++;
      const remaining = Math.max(0, limit - entry.count);
      return {
        limited: entry.count > limit,
        remaining,
        resetAt: entry.resetAt,
      };
    },
  };
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
