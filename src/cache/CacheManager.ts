/**
 * Core Cache Manager for CodeFlow
 *
 * Implements multi-level caching with intelligent invalidation strategies
 * Supports agent-specific, shared, and hierarchical cache types
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  metadata: {
    created: number;
    accessed: number;
    ttl: number;
    size: number;
    hash: string;
    tags: string[];
  };
}

export interface CacheConfig {
  type: 'agent_specific' | 'shared' | 'hierarchical';
  ttl: number;
  invalidation: 'content_based' | 'time_based' | 'manual';
  scope: 'command' | 'workflow' | 'global';
  compression?: boolean;
  maxSize?: number;
  maxEntries?: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
  entries: number;
  hitRate: number;
  avgAccessTime: number;
}

export class CacheManager {
  private cache: Map<string, CacheEntry> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private cacheDir: string;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: CacheConfig, cacheDir = './.cache') {
    this.config = config;
    this.cacheDir = cacheDir;
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      entries: 0,
      hitRate: 0,
      avgAccessTime: 0,
    };

    this.initialize();
  }

  private async initialize(): Promise<void> {
    // Ensure cache directory exists
    await fs.mkdir(this.cacheDir, { recursive: true });

    // Load existing cache if available
    await this.loadCache();

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Clean up every minute
  }

  /**
   * Generate cache key from input data
   */
  generateKey(data: any, prefix = ''): string {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    const hash = createHash('sha256').update(content).digest('hex').substring(0, 16);
    return `${prefix}${hash}`;
  }

  /**
   * Generate content-based key for file caching
   */
  generateContentKey(filePath: string, content?: string): string {
    if (content) {
      return this.generateKey(`${filePath}:${content}`, 'content:');
    }

    // For file paths, use file metadata
    const normalizedPath = path.normalize(filePath);
    return this.generateKey(normalizedPath, 'file:');
  }

  /**
   * Generate query-based key for search results
   */
  generateQueryKey(query: any): string {
    return this.generateKey(query, 'query:');
  }

  /**
   * Get cached data
   */
  async get<T = any>(key: string): Promise<T | null> {
    const startTime = Date.now();
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.evictions++;
      this.stats.misses++;
      return null;
    }

    // Update access time
    entry.metadata.accessed = Date.now();
    this.stats.hits++;

    // Update hit rate
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;

    // Update average access time
    const accessTime = Date.now() - startTime;
    this.stats.avgAccessTime = (this.stats.avgAccessTime + accessTime) / 2;

    return entry.data as T;
  }

  /**
   * Set cached data
   */
  async set<T = any>(key: string, data: T, tags: string[] = []): Promise<void> {
    const size = this.calculateSize(data);
    const entry: CacheEntry<T> = {
      key,
      data,
      metadata: {
        created: Date.now(),
        accessed: Date.now(),
        ttl: this.config.ttl,
        size,
        hash: this.generateKey(data),
        tags,
      },
    };

    // Check size limits
    if (this.config.maxSize && this.stats.size + size > this.config.maxSize) {
      await this.evictEntries(size);
    }

    // Check entry limits
    if (this.config.maxEntries && this.cache.size >= this.config.maxEntries) {
      await this.evictLRU();
    }

    this.cache.set(key, entry);
    this.stats.size += size;
    this.stats.entries++;

    // Persist to disk for shared/hierarchical caches
    if (this.config.scope !== 'command') {
      await this.persistEntry(entry);
    }
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (!entry) return false;

    this.cache.delete(key);
    this.stats.size -= entry.metadata.size;
    this.stats.entries--;

    // Remove from disk
    if (this.config.scope !== 'command') {
      await this.deletePersistedEntry(key);
    }

    return true;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      size: 0,
      entries: 0,
      hitRate: 0,
      avgAccessTime: 0,
    };

    // Clear disk cache
    if (this.config.scope !== 'command') {
      await this.clearPersistedCache();
    }
  }

  /**
   * Invalidate cache entries by tags
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let invalidated = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (tags.some((tag) => entry.metadata.tags.includes(tag))) {
        keysToDelete.push(key);
        invalidated++;
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }

    return invalidated;
  }

  /**
   * Invalidate cache entries by content hash
   */
  async invalidateByContent(filePath: string, _newContent?: string): Promise<number> {
    let invalidated = 0;

    // Find entries that depend on this file
    const keysToDelete: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (key.includes(filePath) || entry.metadata.tags.includes(`file:${filePath}`)) {
        keysToDelete.push(key);
        invalidated++;
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }

    return invalidated;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    if (this.config.invalidation === 'manual') return false;
    if (this.config.invalidation === 'time_based') {
      return Date.now() - entry.metadata.created > this.config.ttl * 1000;
    }
    // content_based invalidation is handled externally
    return false;
  }

  /**
   * Calculate size of data
   */
  private calculateSize(data: any): number {
    const content = typeof data === 'string' ? data : JSON.stringify(data);
    return Buffer.byteLength(content, 'utf8');
  }

  /**
   * Evict entries to make room for new data
   */
  private async evictEntries(requiredSize: number): Promise<void> {
    // Sort by access time (LRU)
    const entries = Array.from(this.cache.entries()).sort(
      ([, a], [, b]) => a.metadata.accessed - b.metadata.accessed
    );

    let freedSize = 0;
    const keysToDelete: string[] = [];

    for (const [key, entry] of entries) {
      if (freedSize >= requiredSize) break;
      keysToDelete.push(key);
      freedSize += entry.metadata.size;
      this.stats.evictions++;
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }

  /**
   * Evict least recently used entry
   */
  private async evictLRU(): Promise<void> {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.metadata.accessed < oldestTime) {
        oldestTime = entry.metadata.accessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      await this.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Clean up expired entries
   */
  private async cleanup(): Promise<void> {
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        keysToDelete.push(key);
        this.stats.evictions++;
      }
    }

    for (const key of keysToDelete) {
      await this.delete(key);
    }
  }

  /**
   * Persist entry to disk
   */
  private async persistEntry(entry: CacheEntry): Promise<void> {
    const filePath = path.join(this.cacheDir, `${entry.key}.json`);
    const data = JSON.stringify(entry, null, 2);
    await fs.writeFile(filePath, data, 'utf8');
  }

  /**
   * Delete persisted entry
   */
  private async deletePersistedEntry(key: string): Promise<void> {
    const filePath = path.join(this.cacheDir, `${key}.json`);
    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Load cache from disk
   */
  private async loadCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const cacheFiles = files.filter((f) => f.endsWith('.json'));

      for (const file of cacheFiles) {
        const filePath = path.join(this.cacheDir, file);
        const data = await fs.readFile(filePath, 'utf8');
        const entry: CacheEntry = JSON.parse(data);

        // Check if still valid
        if (!this.isExpired(entry)) {
          this.cache.set(entry.key, entry);
          this.stats.size += entry.metadata.size;
          this.stats.entries++;
        }
      }
    } catch {
      // Ignore if cache directory doesn't exist or is corrupted
    }
  }

  /**
   * Clear persisted cache
   */
  private async clearPersistedCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      const cacheFiles = files.filter((f) => f.endsWith('.json'));

      for (const file of cacheFiles) {
        const filePath = path.join(this.cacheDir, file);
        await fs.unlink(filePath);
      }
    } catch {
      // Ignore if directory doesn't exist
    }
  }

  /**
   * Dispose of cache manager
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}
