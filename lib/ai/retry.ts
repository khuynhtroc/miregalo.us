export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  onRetry?: (error: unknown, attempt: number, nextDelayMs: number) => void;
}

/**
 * Executes an async function with exponential backoff and jitter.
 */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const initialDelayMs = options.initialDelayMs ?? 500;
  const maxDelayMs = options.maxDelayMs ?? 5000;
  const backoffFactor = options.backoffFactor ?? 2;

  let attempt = 0;

  while (true) {
    try {
      attempt++;
      return await fn(attempt);
    } catch (error) {
      if (attempt > maxRetries) {
        throw error;
      }

      // Calculate exponential backoff with jitter
      const rawDelay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
      const jitter = Math.random() * 0.2 * rawDelay; // +/- 10% jitter
      const delay = Math.min(rawDelay + jitter, maxDelayMs);

      if (options.onRetry) {
        options.onRetry(error, attempt, delay);
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}
