interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private defaultTtl: number;

  constructor(defaultTtlMs: number = 3600000) {
    this.defaultTtl = defaultTtlMs;
  }

  set(key: string, value: T, ttlMs?: number): void {
    const expiresAt = Date.now() + (ttlMs || this.defaultTtl);
    this.store.set(key, { value, expiresAt });
  }

  get(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    this.cleanup();
    return this.store.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}

export function generateCacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(':');
}
