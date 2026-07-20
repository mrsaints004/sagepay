export interface RetryOptions {
  maxAttempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelayMs: 500,
  maxDelayMs: 10_000,
  shouldRetry: () => true,
};

function jitter(ms: number): number {
  return ms * (0.5 + Math.random());
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  opts?: RetryOptions
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs, shouldRetry } = {
    ...DEFAULT_OPTIONS,
    ...opts,
  };

  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }
      const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, jitter(delay)));
    }
  }
  throw lastError;
}

/** Returns true for errors that should NOT be retried (user-initiated, validation, etc.) */
export function isNonRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes("user rejected") ||
    msg.includes("user denied") ||
    msg.includes("cancelled") ||
    msg.includes("invalid") ||
    msg.includes("not logged in") ||
    msg.includes("insufficient")
  );
}

/** Convenience: retry unless it's a user/validation error */
export function shouldRetryBlockchainOp(error: unknown): boolean {
  return !isNonRetryableError(error);
}
