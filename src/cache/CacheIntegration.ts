/**
 * Cache Integration Utilities
 *
 * Helper functions and decorators for easy cache integration in commands
 */

import { CacheManager } from './CacheManager';
import {
  LocatorAgentCache,
  AnalyzerAgentCache,
  GeneratorAgentCache,
  ValidatorAgentCache,
  SharedWorkflowCache,
  HierarchicalGlobalCache,
} from './AgentCacheStrategies';

export interface CacheIntegrationConfig {
  enabled: boolean;
  cacheDir?: string;
  defaultTTL?: number;
  maxSize?: number;
  compression?: boolean;
}

/**
 * Cache Integration Manager
 * Provides easy access to different cache types for commands
 */
export class CacheIntegration {
  private config: CacheIntegrationConfig;
  private caches: Map<string, CacheManager> = new Map();

  constructor(config: CacheIntegrationConfig) {
    this.config = {
      cacheDir: './.cache',
      defaultTTL: 3600,
      maxSize: 50 * 1024 * 1024, // 50MB
      compression: true,
      ...config,
    };
  }

  /**
   * Get or create a locator agent cache
   */
  getLocatorCache(agentId: string): LocatorAgentCache {
    return this.getOrCreateCache(
      `locator:${agentId}`,
      () =>
        new LocatorAgentCache({
          agentType: 'locator',
          ttl: this.config.defaultTTL!,
          invalidation: 'content_based',
          scope: 'command',
          compression: this.config.compression,
          maxSize: this.config.maxSize,
        })
    ) as LocatorAgentCache;
  }

  /**
   * Get or create an analyzer agent cache
   */
  getAnalyzerCache(agentId: string): AnalyzerAgentCache {
    return this.getOrCreateCache(
      `analyzer:${agentId}`,
      () =>
        new AnalyzerAgentCache({
          agentType: 'analyzer',
          ttl: this.config.defaultTTL!,
          invalidation: 'content_based',
          scope: 'command',
          compression: this.config.compression,
          maxSize: this.config.maxSize,
        })
    ) as AnalyzerAgentCache;
  }

  /**
   * Get or create a generator agent cache
   */
  getGeneratorCache(agentId: string): GeneratorAgentCache {
    return this.getOrCreateCache(
      `generator:${agentId}`,
      () =>
        new GeneratorAgentCache({
          agentType: 'generator',
          ttl: this.config.defaultTTL!,
          invalidation: 'time_based',
          scope: 'command',
          compression: this.config.compression,
          maxSize: this.config.maxSize,
        })
    ) as GeneratorAgentCache;
  }

  /**
   * Get or create a validator agent cache
   */
  getValidatorCache(agentId: string): ValidatorAgentCache {
    return this.getOrCreateCache(
      `validator:${agentId}`,
      () =>
        new ValidatorAgentCache({
          agentType: 'validator',
          ttl: this.config.defaultTTL!,
          invalidation: 'content_based',
          scope: 'command',
          compression: this.config.compression,
          maxSize: this.config.maxSize,
        })
    ) as ValidatorAgentCache;
  }

  /**
   * Get or create a shared workflow cache
   */
  getWorkflowCache(workflowId: string): SharedWorkflowCache {
    return this.getOrCreateCache(
      `workflow:${workflowId}`,
      () =>
        new SharedWorkflowCache({
          agentType: 'locator', // Not used for shared caches
          ttl: this.config.defaultTTL! * 2, // Longer TTL for workflows
          invalidation: 'time_based',
          scope: 'workflow',
          compression: this.config.compression,
          maxSize: this.config.maxSize,
        })
    ) as SharedWorkflowCache;
  }

  /**
   * Get or create a hierarchical global cache
   */
  getGlobalCache(): HierarchicalGlobalCache {
    return this.getOrCreateCache(
      'global',
      () =>
        new HierarchicalGlobalCache({
          agentType: 'locator', // Not used for global caches
          ttl: this.config.defaultTTL! * 4, // Even longer TTL for global
          invalidation: 'manual',
          scope: 'global',
          compression: this.config.compression,
          maxSize: this.config.maxSize! * 2, // Larger size for global
        })
    ) as HierarchicalGlobalCache;
  }

  /**
   * Get cache statistics across all managed caches
   */
  getAllStats(): Record<string, any> {
    const stats: Record<string, any> = {};
    for (const [key, cache] of this.caches.entries()) {
      stats[key] = cache.getStats();
    }
    return stats;
  }

  /**
   * Clear all caches
   */
  async clearAll(): Promise<void> {
    const promises = Array.from(this.caches.values()).map((cache) => cache.clear());
    await Promise.all(promises);
  }

  /**
   * Invalidate caches by tags across all managed caches
   */
  async invalidateByTags(tags: string[]): Promise<number> {
    let totalInvalidated = 0;
    const promises = Array.from(this.caches.values()).map((cache) => cache.invalidateByTags(tags));
    const results = await Promise.all(promises);
    totalInvalidated = results.reduce((sum, count) => sum + count, 0);
    return totalInvalidated;
  }

  /**
   * Invalidate caches by file path across all managed caches
   */
  async invalidateByFile(filePath: string, newContent?: string): Promise<number> {
    let totalInvalidated = 0;
    const promises = Array.from(this.caches.values()).map((cache) =>
      cache.invalidateByContent(filePath, newContent)
    );
    const results = await Promise.all(promises);
    totalInvalidated = results.reduce((sum, count) => sum + count, 0);
    return totalInvalidated;
  }

  private getOrCreateCache<T extends CacheManager>(key: string, factory: () => T): T {
    if (!this.config.enabled) {
      // Return a no-op cache when disabled
      return factory();
    }

    if (!this.caches.has(key)) {
      const cache = factory();
      this.caches.set(key, cache);
    }

    return this.caches.get(key) as T;
  }

  /**
   * Dispose of all managed caches
   */
  dispose(): void {
    for (const cache of this.caches.values()) {
      if (cache.dispose) {
        cache.dispose();
      }
    }
    this.caches.clear();
  }
}

/**
 * Cache-aware function decorator
 */
export function withCache<T extends any[], R>(
  cacheKeyFn: (...args: T) => string,
  cacheManager: CacheManager,
  _ttl?: number
) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: T): Promise<R> {
      const cacheKey = cacheKeyFn(...args);

      // Try to get from cache first
      const cachedResult = await cacheManager.get<R>(cacheKey);
      if (cachedResult !== null) {
        return cachedResult;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache the result
      await cacheManager.set(cacheKey, result, []);

      return result;
    };

    return descriptor;
  };
}

/**
 * Cache invalidation decorator
 */
export function invalidateCache(
  cacheKeyFn: (...args: any[]) => string,
  cacheManager: CacheManager
) {
  return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Invalidate cache
      const cacheKey = cacheKeyFn(...args);
      await cacheManager.delete(cacheKey);

      return result;
    };

    return descriptor;
  };
}

/**
 * Structured output with cache metadata
 */
export interface CachedOutput<T = any> {
  data: T;
  cache: {
    hit: boolean;
    key: string;
    ttl_remaining?: number;
    savings?: number;
  };
  timestamp: string;
  processing_time: number;
}

/**
 * Create cached output wrapper
 */
export function createCachedOutput<T>(
  data: T,
  cacheHit: boolean,
  cacheKey: string,
  processingTime: number,
  ttlRemaining?: number,
  savings?: number
): CachedOutput<T> {
  return {
    data,
    cache: {
      hit: cacheHit,
      key: cacheKey,
      ttl_remaining: ttlRemaining,
      savings,
    },
    timestamp: new Date().toISOString(),
    processing_time: processingTime,
  };
}

/**
 * Cache performance monitoring
 */
export class CacheMonitor {
  private metrics: Map<
    string,
    {
      hits: number;
      misses: number;
      avgResponseTime: number;
      totalRequests: number;
    }
  > = new Map();

  recordHit(operation: string, responseTime: number): void {
    this.updateMetrics(operation, true, responseTime);
  }

  recordMiss(operation: string, responseTime: number): void {
    this.updateMetrics(operation, false, responseTime);
  }

  private updateMetrics(operation: string, isHit: boolean, responseTime: number): void {
    const current = this.metrics.get(operation) || {
      hits: 0,
      misses: 0,
      avgResponseTime: 0,
      totalRequests: 0,
    };

    if (isHit) {
      current.hits++;
    } else {
      current.misses++;
    }

    current.totalRequests++;
    current.avgResponseTime =
      (current.avgResponseTime * (current.totalRequests - 1) + responseTime) /
      current.totalRequests;

    this.metrics.set(operation, current);
  }

  getMetrics(operation?: string): any {
    if (operation) {
      return this.metrics.get(operation) || null;
    }

    const summary: any = {};
    for (const [op, metrics] of this.metrics.entries()) {
      summary[op] = {
        ...metrics,
        hitRate: metrics.totalRequests > 0 ? metrics.hits / metrics.totalRequests : 0,
      };
    }
    return summary;
  }

  reset(): void {
    this.metrics.clear();
  }
}

// Global cache monitor instance
export const globalCacheMonitor = new CacheMonitor();
