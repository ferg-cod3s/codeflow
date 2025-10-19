/**
 * Cache Manager Tests
 * Tests the CacheManager.ts functionality for caching, TTL, eviction, and persistence
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import {
  CacheManager,
  CacheConfig,
  CacheEntry,
  CacheStats
} from '../../../src/cache/CacheManager.js';
import { setupTests, cleanupTests, TEST_DIR } from '../../setup.js';

describe('Cache Manager', () => {
  let testCacheDir: string;
  let cacheManager: CacheManager;

  beforeAll(async () => {
    await setupTests();
  });

  afterAll(async () => {
    await cleanupTests();
  });

  beforeEach(async () => {
    testCacheDir = join(TEST_DIR, `cache-test-${Date.now()}`);
    await mkdir(testCacheDir, { recursive: true });
  });

  afterEach(async () => {
    if (cacheManager) {
      cacheManager.dispose();
    }
    if (existsSync(testCacheDir)) {
      await rm(testCacheDir, { recursive: true, force: true });
    }
  });

  const createCacheManager = (config: Partial<CacheConfig> = {}) => {
    const defaultConfig: CacheConfig = {
      type: 'shared',
      ttl: 3600, // 1 hour
      invalidation: 'time_based',
      scope: 'global',
      compression: false,
      maxSize: 1024 * 1024, // 1MB
      maxEntries: 100,
      ...config
    };

    cacheManager = new CacheManager(defaultConfig, testCacheDir);
    return cacheManager;
  };

  describe('Basic Cache Operations', () => {
    test('should create cache manager with default config', () => {
      const manager = createCacheManager();
      expect(manager).toBeDefined();
    });

    test('should set and get cache entries', async () => {
      const manager = createCacheManager();

      await manager.set('test-key', 'test-value');
      const result = await manager.get('test-key');

      expect(result).toBe('test-value');
    });

    test('should return null for non-existent keys', async () => {
      const manager = createCacheManager();

      const result = await manager.get('non-existent-key');
      expect(result).toBeNull();
    });

    test('should delete cache entries', async () => {
      const manager = createCacheManager();

      await manager.set('test-key', 'test-value');
      const deleted = await manager.delete('test-key');
      const result = await manager.get('test-key');

      expect(deleted).toBe(true);
      expect(result).toBeNull();
    });

    test('should return false when deleting non-existent entries', async () => {
      const manager = createCacheManager();

      const deleted = await manager.delete('non-existent-key');
      expect(deleted).toBe(false);
    });

    test('should clear all cache entries', async () => {
      const manager = createCacheManager();

      await manager.set('key1', 'value1');
      await manager.set('key2', 'value2');

      await manager.clear();

      expect(await manager.get('key1')).toBeNull();
      expect(await manager.get('key2')).toBeNull();
    });

    test('should handle different data types', async () => {
      const manager = createCacheManager();

      await manager.set('string', 'test');
      await manager.set('number', 42);
      await manager.set('boolean', true);
      await manager.set('object', { key: 'value' });
      await manager.set('array', [1, 2, 3]);

      expect(await manager.get('string')).toBe('test');
      expect(await manager.get('number')).toBe(42);
      expect(await manager.get('boolean')).toBe(true);
      expect(await manager.get('object')).toEqual({ key: 'value' });
      expect(await manager.get('array')).toEqual([1, 2, 3]);
    });
  });

  describe('Cache Key Generation', () => {
    test('should generate consistent keys for same data', () => {
      const manager = createCacheManager();

      const key1 = manager.generateKey('test-data');
      const key2 = manager.generateKey('test-data');

      expect(key1).toBe(key2);
    });

    test('should generate different keys for different data', () => {
      const manager = createCacheManager();

      const key1 = manager.generateKey('test-data-1');
      const key2 = manager.generateKey('test-data-2');

      expect(key1).not.toBe(key2);
    });

    test('should generate keys with prefixes', () => {
      const manager = createCacheManager();

      const key = manager.generateKey('test-data', 'prefix-');

      expect(key).toMatch(/^prefix-/);
    });

    test('should generate content-based keys', () => {
      const manager = createCacheManager();

      const key1 = manager.generateContentKey('/path/to/file', 'content');
      const key2 = manager.generateContentKey('/path/to/file', 'different-content');

      expect(key1).not.toBe(key2);
      expect(key1).toMatch(/^content:/);
    });

    test('should generate file-based keys', () => {
      const manager = createCacheManager();

      const key = manager.generateContentKey('/path/to/file');

      expect(key).toMatch(/^file:/);
    });

    test('should generate query-based keys', () => {
      const manager = createCacheManager();

      const key = manager.generateQueryKey({ query: 'test', params: [1, 2, 3] });

      expect(key).toMatch(/^query:/);
    });
  });

  describe('TTL and Expiration', () => {
    test('should respect TTL for time-based invalidation', async () => {
      const manager = createCacheManager({
        ttl: 0.1, // 100ms
        invalidation: 'time_based'
      });

      await manager.set('test-key', 'test-value');

      // Should be available immediately
      expect(await manager.get('test-key')).toBe('test-value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be expired
      expect(await manager.get('test-key')).toBeNull();
    });

    test('should not expire entries with manual invalidation', async () => {
      const manager = createCacheManager({
        ttl: 0.1,
        invalidation: 'manual'
      });

      await manager.set('test-key', 'test-value');

      // Wait longer than TTL
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should still be available
      expect(await manager.get('test-key')).toBe('test-value');
    });

    test('should handle content-based invalidation', async () => {
      const manager = createCacheManager({
        invalidation: 'content_based'
      });

      await manager.set('test-key', 'test-value');

      // Should be available (content-based invalidation is handled externally)
      expect(await manager.get('test-key')).toBe('test-value');
    });
  });

  describe('Size and Entry Limits', () => {
    test('should enforce max size limit', async () => {
      const manager = createCacheManager({
        maxSize: 100, // 100 bytes
        maxEntries: 1000
      });

      // Create entry that exceeds max size
      const largeData = 'x'.repeat(200);

      await manager.set('large-key', largeData);

      // Should trigger eviction
      const result = await manager.get('large-key');
      expect(result).toBeNull();
    });

    test('should enforce max entries limit', async () => {
      const manager = createCacheManager({
        maxEntries: 3,
        maxSize: 1024 * 1024
      });

      // Add more entries than max
      await manager.set('key1', 'value1');
      await manager.set('key2', 'value2');
      await manager.set('key3', 'value3');
      await manager.set('key4', 'value4'); // Should trigger eviction

      // First entry should be evicted (LRU)
      expect(await manager.get('key1')).toBeNull();
      expect(await manager.get('key2')).toBe('value2');
      expect(await manager.get('key3')).toBe('value3');
      expect(await manager.get('key4')).toBe('value4');
    });

    test('should use LRU eviction strategy', async () => {
      const manager = createCacheManager({
        maxEntries: 2
      });

      await manager.set('key1', 'value1');
      await manager.set('key2', 'value2');

      // Access key1 to make it more recently used
      await manager.get('key1');

      // Add key3, should evict key2 (least recently used)
      await manager.set('key3', 'value3');

      expect(await manager.get('key1')).toBe('value1');
      expect(await manager.get('key2')).toBeNull();
      expect(await manager.get('key3')).toBe('value3');
    });
  });

  describe('Tag-based Invalidation', () => {
    test('should invalidate entries by tags', async () => {
      const manager = createCacheManager();

      await manager.set('key1', 'value1', ['tag1', 'tag2']);
      await manager.set('key2', 'value2', ['tag2', 'tag3']);
      await manager.set('key3', 'value3', ['tag3', 'tag4']);

      // Invalidate entries with tag2
      const invalidated = await manager.invalidateByTags(['tag2']);

      expect(invalidated).toBe(2);
      expect(await manager.get('key1')).toBeNull();
      expect(await manager.get('key2')).toBeNull();
      expect(await manager.get('key3')).toBe('value3');
    });

    test('should invalidate entries with multiple matching tags', async () => {
      const manager = createCacheManager();

      await manager.set('key1', 'value1', ['tag1', 'tag2']);
      await manager.set('key2', 'value2', ['tag2', 'tag3']);

      // Invalidate entries with tag1 or tag3
      const invalidated = await manager.invalidateByTags(['tag1', 'tag3']);

      expect(invalidated).toBe(2);
      expect(await manager.get('key1')).toBeNull();
      expect(await manager.get('key2')).toBeNull();
    });

    test('should return 0 for non-matching tags', async () => {
      const manager = createCacheManager();

      await manager.set('key1', 'value1', ['tag1']);

      const invalidated = await manager.invalidateByTags(['tag2']);

      expect(invalidated).toBe(0);
      expect(await manager.get('key1')).toBe('value1');
    });
  });

  describe('Content-based Invalidation', () => {
    test('should invalidate entries by file path', async () => {
      const manager = createCacheManager();

      await manager.set('file:/path/to/file1', 'value1');
      await manager.set('file:/path/to/file2', 'value2');
      await manager.set('content:/path/to/file1:hash', 'value3');

      // Invalidate entries related to file1
      const invalidated = await manager.invalidateByContent('/path/to/file1');

      expect(invalidated).toBe(2);
      expect(await manager.get('file:/path/to/file1')).toBeNull();
      expect(await manager.get('file:/path/to/file2')).toBe('value2');
      expect(await manager.get('content:/path/to/file1:hash')).toBeNull();
    });

    test('should invalidate entries with file tags', async () => {
      const manager = createCacheManager();

      await manager.set('key1', 'value1', ['file:/path/to/file1']);
      await manager.set('key2', 'value2', ['file:/path/to/file2']);

      const invalidated = await manager.invalidateByContent('/path/to/file1');

      expect(invalidated).toBe(1);
      expect(await manager.get('key1')).toBeNull();
      expect(await manager.get('key2')).toBe('value2');
    });
  });

  describe('Statistics Tracking', () => {
    test('should track cache hits and misses', async () => {
      const manager = createCacheManager();

      // Initial stats
      let stats = manager.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);

      // Miss
      await manager.get('non-existent');
      stats = manager.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(0);

      // Hit
      await manager.set('test-key', 'test-value');
      await manager.get('test-key');
      stats = manager.getStats();
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    test('should calculate hit rate correctly', async () => {
      const manager = createCacheManager();

      // 1 miss, 2 hits = 2/3 = 0.667
      await manager.get('non-existent');
      await manager.set('test-key', 'test-value');
      await manager.get('test-key');
      await manager.get('test-key');

      const stats = manager.getStats();
      expect(stats.hitRate).toBeCloseTo(2/3, 2);
    });

    test('should track cache size and entries', async () => {
      const manager = createCacheManager();

      await manager.set('key1', 'value1');
      await manager.set('key2', 'value2');

      const stats = manager.getStats();
      expect(stats.entries).toBe(2);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should track evictions', async () => {
      const manager = createCacheManager({
        maxEntries: 1
      });

      await manager.set('key1', 'value1');
      await manager.set('key2', 'value2'); // Should evict key1

      const stats = manager.getStats();
      expect(stats.evictions).toBe(1);
    });
  });

  describe('Persistence', () => {
    test('should persist entries to disk for shared cache', async () => {
      const manager = createCacheManager({
        scope: 'global'
      });

      await manager.set('persistent-key', 'persistent-value');

      // Check if file exists on disk
      const cacheFiles = await import('fs/promises').then(fs =>
        fs.readdir(testCacheDir).then(files =>
          files.filter(f => f.endsWith('.json'))
        )
      );

      expect(cacheFiles.length).toBeGreaterThan(0);
    });

    test('should not persist entries for command scope', async () => {
      const manager = createCacheManager({
        scope: 'command'
      });

      await manager.set('temp-key', 'temp-value');

      // Should not create files for command scope
      const cacheFiles = await import('fs/promises').then(fs =>
        fs.readdir(testCacheDir).then(files =>
          files.filter(f => f.endsWith('.json'))
        )
      );

      expect(cacheFiles).toHaveLength(0);
    });

    test('should load cache from disk on initialization', async () => {
      // Create first cache manager and add entry
      const manager1 = createCacheManager({ scope: 'global' });
      await manager1.set('loaded-key', 'loaded-value');
      manager1.dispose();

      // Create new cache manager (should load from disk)
      const manager2 = createCacheManager({ scope: 'global' });
      const result = await manager2.get('loaded-key');

      expect(result).toBe('loaded-value');
    });

    test('should handle corrupted cache files gracefully', async () => {
      // Create corrupted cache file
      await import('fs/promises').then(fs =>
        fs.writeFile(join(testCacheDir, 'corrupted.json'), 'invalid json')
      );

      // Should not throw error
      expect(() => createCacheManager({ scope: 'global' })).not.toThrow();
    });
  });

  describe('Cleanup and Disposal', () => {
    test('should cleanup expired entries periodically', async () => {
      const manager = createCacheManager({
        ttl: 0.1,
        invalidation: 'time_based'
      });

      await manager.set('expiring-key', 'expiring-value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      // Cleanup should have run
      expect(await manager.get('expiring-key')).toBeNull();
    });

    test('should dispose cleanup interval', () => {
      const manager = createCacheManager();

      expect(() => manager.dispose()).not.toThrow();

      // Should not throw error on multiple dispose calls
      expect(() => manager.dispose()).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    test('should handle file system errors gracefully', async () => {
      const manager = createCacheManager({
        scope: 'global'
      });

      // Remove cache directory to simulate file system error
      await rm(testCacheDir, { recursive: true, force: true });

      // Should not throw error when trying to persist
      await expect(manager.set('test-key', 'test-value')).resolves.toBeUndefined();
    });

    test('should handle JSON serialization errors', async () => {
      const manager = createCacheManager();

      // Create circular reference
      const circularObj: any = {};
      circularObj.self = circularObj;

      // Should not throw error
      await expect(manager.set('circular-key', circularObj)).resolves.toBeUndefined();
    });
  });

  describe('Cache Configurations', () => {
    test('should work with agent-specific cache', () => {
      const manager = createCacheManager({
        type: 'agent_specific',
        scope: 'workflow'
      });

      expect(manager).toBeDefined();
    });

    test('should work with hierarchical cache', () => {
      const manager = createCacheManager({
        type: 'hierarchical',
        scope: 'global'
      });

      expect(manager).toBeDefined();
    });

    test('should work with compression enabled', () => {
      const manager = createCacheManager({
        compression: true
      });

      expect(manager).toBeDefined();
    });
  });
});
