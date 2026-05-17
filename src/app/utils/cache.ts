import NodeCache from "node-cache";

class CacheManager {
  private cache: NodeCache;
  private maxSizeBytes: number;
  private currentSizeBytes: number;
  private keySizes: Map<string, number>;
  private accessOrder: string[]; // Keep track of key access for LRU eviction

  constructor(maxSizeMB: number = 200) {
    this.cache = new NodeCache({
      stdTTL: 600, // 10 minutes default TTL
      checkperiod: 60, // Check for expired keys every 60 seconds
    });
    this.maxSizeBytes = maxSizeMB * 1024 * 1024;
    this.currentSizeBytes = 0;
    this.keySizes = new Map();
    this.accessOrder = [];

    // Keep size calculations in sync when items expire or are manually deleted
    this.cache.on("del", (key) => {
      this.handleKeyRemoval(key);
    });

    this.cache.on("expired", (key) => {
      this.handleKeyRemoval(key);
    });
  }

  /**
   * Approximate byte size of a value when serialized to JSON
   */
  private calculateSize(value: any): number {
    try {
      const str = JSON.stringify(value);
      return str ? Buffer.byteLength(str) : 0;
    } catch (e) {
      // Fallback for non-serializable objects (default to 2KB)
      return 2048;
    }
  }

  private handleKeyRemoval(key: string) {
    const size = this.keySizes.get(key) || 0;
    this.currentSizeBytes = Math.max(0, this.currentSizeBytes - size);
    this.keySizes.delete(key);
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
  }

  private updateAccess(key: string) {
    // Move key to the end of the LRU tracking array (most recently used)
    this.accessOrder = this.accessOrder.filter((k) => k !== key);
    this.accessOrder.push(key);
  }

  /**
   * Get an item from the cache
   */
  public get<T>(key: string): T | undefined {
    const value = this.cache.get<T>(key);
    if (value !== undefined) {
      this.updateAccess(key);
    }
    return value;
  }

  /**
   * Set an item in the cache with LRU eviction if size exceeds 200MB
   */
  public set<T>(key: string, value: T, ttl?: number | string): boolean {
    const size = this.calculateSize(value);

    // If the single item itself is larger than the entire cache size limit, don't cache it
    if (size > this.maxSizeBytes) {
      return false;
    }

    // Subtract the old size if overwriting an existing key
    if (this.cache.has(key)) {
      const oldSize = this.keySizes.get(key) || 0;
      this.currentSizeBytes = Math.max(0, this.currentSizeBytes - oldSize);
    }

    // Evict least-recently-used items if the new item exceeds the max size limit
    while (this.currentSizeBytes + size > this.maxSizeBytes && this.accessOrder.length > 0) {
      const oldestKey = this.accessOrder.shift();
      if (oldestKey) {
        this.cache.del(oldestKey); // Will trigger 'del' listener to adjust size
      }
    }

    // Set the value in node-cache
    let success;
    if (ttl !== undefined) {
      success = this.cache.set(key, value, ttl);
    } else {
      success = this.cache.set(key, value);
    }

    if (success) {
      this.keySizes.set(key, size);
      this.currentSizeBytes += size;
      this.updateAccess(key);
    }

    return success;
  }

  /**
   * Delete a specific key
   */
  public del(key: string): number {
    return this.cache.del(key);
  }

  /**
   * Delete keys matching a pattern (e.g. "reviews:*")
   */
  public delPattern(pattern: string): number {
    const keys = this.cache.keys();
    // Convert a glob pattern (e.g. "reviews:*") into a Regular Expression
    const regex = new RegExp("^" + pattern.replace(/[-/\\^$*+?.()|[\]{}]/g, (char) => (char === "*" ? ".*" : "\\" + char)) + "$");
    
    let count = 0;
    for (const key of keys) {
      if (regex.test(key)) {
        this.cache.del(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Flush the entire cache
   */
  public flushAll(): void {
    this.cache.flushAll();
    this.currentSizeBytes = 0;
    this.keySizes.clear();
    this.accessOrder = [];
  }

  /**
   * Get stats for health monitoring
   */
  public getStats() {
    return {
      keys: this.cache.keys().length,
      currentSizeBytes: this.currentSizeBytes,
      currentSizeMB: (this.currentSizeBytes / (1024 * 1024)).toFixed(2),
      maxSizeMB: (this.maxSizeBytes / (1024 * 1024)).toFixed(0),
      hitRatio: this.cache.getStats(),
    };
  }
}

// Export singleton instance with a 200MB memory limit
export const cacheManager = new CacheManager(200);
