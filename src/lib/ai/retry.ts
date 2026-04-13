import { logger } from '../utils/logger';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  jitter: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffFactor: 2,
  jitter: true,
};

export class RetryError extends Error {
  constructor(
    message: string,
    public readonly attempts: number,
    public readonly lastError: Error
  ) {
    super(message);
    this.name = 'RetryError';
  }
}

function calculateDelay(attempt: number, config: RetryConfig): number {
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffFactor, attempt);
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs);

  if (config.jitter) {
    return Math.random() * cappedDelay;
  }

  return cappedDelay;
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  operationName?: string
): Promise<T> {
  const fullConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= fullConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < fullConfig.maxRetries) {
        const delay = calculateDelay(attempt, fullConfig);
        const name = operationName || 'Operation';

        if (fullConfig.jitter) {
          logger.warn(
            `${name} failed (attempt ${attempt + 1}/${fullConfig.maxRetries + 1}), retrying in ${delay.toFixed(0)}ms: ${lastError.message}`
          );
        } else {
          logger.warn(
            `${name} failed (attempt ${attempt + 1}/${fullConfig.maxRetries + 1}), retrying in ${delay}ms: ${lastError.message}`
          );
        }

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw new RetryError(
    `${operationName || 'Operation'} failed after ${fullConfig.maxRetries + 1} attempts`,
    fullConfig.maxRetries + 1,
    lastError!
  );
}

export function isRetryableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  const retryablePatterns = [
    'timeout',
    'econnreset',
    'econnrefused',
    'socket hang up',
    'network',
    'rate limit',
    '429',
    '503',
    '502',
    '504',
  ];

  return retryablePatterns.some(pattern => message.includes(pattern));
}
