import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Cache, generateCacheKey } from './cache';
import { withRetry, RetryError, isRetryableError } from './retry';

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

describe('Cache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('basic operations', () => {
    it('should store and retrieve value', () => {
      const cache = new Cache<string>();
      cache.set('key1', 'value1');
      expect(cache.get('key1')).toBe('value1');
    });

    it('should return null for missing key', () => {
      const cache = new Cache<string>();
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('should check if key exists', () => {
      const cache = new Cache<string>();
      cache.set('key1', 'value1');
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('nonexistent')).toBe(false);
    });

    it('should delete key', () => {
      const cache = new Cache<string>();
      cache.set('key1', 'value1');
      expect(cache.delete('key1')).toBe(true);
      expect(cache.has('key1')).toBe(false);
    });

    it('should return false when deleting nonexistent key', () => {
      const cache = new Cache<string>();
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('should clear all keys', () => {
      const cache = new Cache<string>();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');
      cache.clear();
      expect(cache.size()).toBe(0);
    });

    it('should return correct size', () => {
      const cache = new Cache<string>();
      expect(cache.size()).toBe(0);
      cache.set('key1', 'value1');
      expect(cache.size()).toBe(1);
      cache.set('key2', 'value2');
      expect(cache.size()).toBe(2);
    });
  });

  describe('TTL expiration', () => {
    it('should expire entry after TTL', () => {
      const cache = new Cache<string>(1000);
      const now = Date.now();
      cache.set('key1', 'value1');

      expect(cache.get('key1')).toBe('value1');

      vi.setSystemTime(now + 999);
      expect(cache.get('key1')).toBe('value1');

      vi.setSystemTime(now + 1001);
      expect(cache.get('key1')).toBeNull();
    });

    it('should use custom TTL when provided', () => {
      const cache = new Cache<string>(2000);
      const now = Date.now();
      cache.set('key1', 'value1', 500);

      vi.setSystemTime(now + 499);
      expect(cache.get('key1')).toBe('value1');

      vi.setSystemTime(now + 501);
      expect(cache.get('key1')).toBeNull();
    });

    it('should delete expired entries on size check', () => {
      const cache = new Cache<string>(1000);
      const now = Date.now();
      cache.set('key1', 'value1');

      vi.setSystemTime(now + 1001);
      expect(cache.size()).toBe(0);
    });

    it('should cleanup expired entries on size', () => {
      const cache = new Cache<string>(1000);
      const now = Date.now();
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      vi.setSystemTime(now + 500);
      expect(cache.size()).toBe(2);

      vi.setSystemTime(now + 1001);
      expect(cache.size()).toBe(0);
    });
  });

  describe('generateCacheKey', () => {
    it('should generate key from multiple parts', () => {
      const key = generateCacheKey('movie', '123', 'facts');
      expect(key).toBe('movie:123:facts');
    });

    it('should ignore undefined parts', () => {
      const key = generateCacheKey('movie', undefined, 'facts');
      expect(key).toBe('movie:facts');
    });

    it('should handle single part', () => {
      const key = generateCacheKey('movie');
      expect(key).toBe('movie');
    });

    it('should handle numeric parts', () => {
      const key = generateCacheKey('movie', 123, 'fact', 5);
      expect(key).toBe('movie:123:fact:5');
    });
  });
});

describe('Retry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('withRetry', () => {
    it('should return result on successful operation', async () => {
      const operation = vi.fn().mockResolvedValue('success');
      const result = await withRetry(operation, {}, 'TestOp');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail 1'))
        .mockRejectedValueOnce(new Error('Fail 2'))
        .mockResolvedValueOnce('success');

      const result = await withRetry(operation, { maxRetries: 3 }, 'TestOp');

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should throw RetryError after exhausting retries', async () => {
      const operation = vi.fn().mockRejectedValue(new Error('Persistent error'));

      await expect(withRetry(operation, { maxRetries: 2 }, 'TestOp')).rejects.toThrow(RetryError);
      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('should use default retry config', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error('Fail'))
        .mockResolvedValueOnce('success');

      const result = await withRetry(operation);

      expect(result).toBe('success');
      expect(operation).toHaveBeenCalledTimes(2);
    });
  });

  describe('RetryError', () => {
    it('should contain attempt count and last error', () => {
      const originalError = new Error('Test error');
      const retryError = new RetryError('Operation failed', 3, originalError);

      expect(retryError.message).toBe('Operation failed');
      expect(retryError.attempts).toBe(3);
      expect(retryError.lastError).toBe(originalError);
    });
  });

  describe('isRetryableError', () => {
    it('should identify timeout errors as retryable', () => {
      const error = new Error('Connection timeout');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify rate limit errors as retryable', () => {
      const error = new Error('Rate limit exceeded - 429');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify network errors as retryable', () => {
      const error = new Error('ECONNREFUSED');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should identify 503 errors as retryable', () => {
      const error = new Error('Service unavailable - 503');
      expect(isRetryableError(error)).toBe(true);
    });

    it('should not identify non-retryable errors', () => {
      const error = new Error('Invalid input');
      expect(isRetryableError(error)).toBe(false);
    });

    it('should not identify 404 as retryable', () => {
      const error = new Error('Not found - 404');
      expect(isRetryableError(error)).toBe(false);
    });
  });
});
