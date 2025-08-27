import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import type { Agent, ParseError } from "../conversion/agent-parser.js";

/**
 * Performance optimization utilities for the codeflow system
 * Provides caching, batching, and optimization strategies
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  mtime: number; // File modification time
}

interface PerformanceMetrics {
  fileWatchLatency: number;
  agentParseTime: number;
  syncOperationTime: number;
  cacheHitRate: number;
}

/**
 * Agent parsing cache with file modification time tracking
 */
class AgentParseCache {
  private cache = new Map<string, CacheEntry<Agent>>();
  private errorCache = new Map<string, CacheEntry<ParseError>>();
  private readonly maxAge = 5 * 60 * 1000; // 5 minutes
  private hits = 0;
  private misses = 0;

  /**
   * Get cached agent if file hasn't been modified
   */
  async get(filePath: string): Promise<Agent | ParseError | null> {
    try {
      const stats = await stat(filePath);
      const mtime = stats.mtime.getTime();
      
      // Check successful parse cache
      const cachedEntry = this.cache.get(filePath);
      if (cachedEntry) {
        const isValid = 
          Date.now() - cachedEntry.timestamp < this.maxAge &&
          cachedEntry.mtime === mtime;
        
        if (isValid) {
          this.hits++;
          return cachedEntry.data;
        } else {
          this.cache.delete(filePath);
        }
      }

      // Check error cache
      const cachedError = this.errorCache.get(filePath);
      if (cachedError) {
        const isValid = 
          Date.now() - cachedError.timestamp < this.maxAge &&
          cachedError.mtime === mtime;
        
        if (isValid) {
          this.hits++;
          return cachedError.data;
        } else {
          this.errorCache.delete(filePath);
        }
      }

      this.misses++;
      return null;
    } catch {
      // File doesn't exist or can't be accessed
      this.misses++;
      return null;
    }
  }

  /**
   * Cache successful agent parse
   */
  async set(filePath: string, agent: Agent): Promise<void> {
    try {
      const stats = await stat(filePath);
      const mtime = stats.mtime.getTime();
      
      this.cache.set(filePath, {
        data: agent,
        timestamp: Date.now(),
        mtime
      });
    } catch {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Cache parse error
   */
  async setError(filePath: string, error: ParseError): Promise<void> {
    try {
      const stats = await stat(filePath);
      const mtime = stats.mtime.getTime();
      
      this.errorCache.set(filePath, {
        data: error,
        timestamp: Date.now(),
        mtime
      });
    } catch {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;
    
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: Math.round(hitRate * 100) / 100,
      cacheSize: this.cache.size + this.errorCache.size
    };
  }

  /**
   * Clear cache (useful for testing)
   */
  clear(): void {
    this.cache.clear();
    this.errorCache.clear();
    this.hits = 0;
    this.misses = 0;
  }
}

/**
 * Batch processing for synchronization operations
 */
class SyncBatcher {
  private pending = new Set<string>();
  private timer: NodeJS.Timeout | null = null;
  private readonly batchDelay = 500; // 500ms batching window
  private readonly maxBatchSize = 50; // Max files per batch

  constructor(private onBatch: (filePaths: string[]) => Promise<void>) {}

  /**
   * Add file to batch for processing
   */
  add(filePath: string): void {
    this.pending.add(filePath);
    
    // If batch is full, process immediately
    if (this.pending.size >= this.maxBatchSize) {
      this.flush();
      return;
    }

    // Otherwise, schedule batch processing
    if (this.timer) {
      clearTimeout(this.timer);
    }
    
    this.timer = setTimeout(() => {
      this.flush();
    }, this.batchDelay);
  }

  /**
   * Process pending files immediately
   */
  flush(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.pending.size === 0) {
      return;
    }

    const filePaths = Array.from(this.pending);
    this.pending.clear();
    
    // Process batch asynchronously
    this.onBatch(filePaths).catch(error => {
      console.error('Batch processing error:', error);
    });
  }

  /**
   * Get pending count
   */
  getPendingCount(): number {
    return this.pending.size;
  }
}

/**
 * Performance monitoring and optimization manager
 */
class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    fileWatchLatency: 0,
    agentParseTime: 0,
    syncOperationTime: 0,
    cacheHitRate: 0
  };
  
  private parseCache = new AgentParseCache();
  private syncBatcher: SyncBatcher;

  constructor(onSyncBatch?: (filePaths: string[]) => Promise<void>) {
    this.syncBatcher = new SyncBatcher(onSyncBatch || (async () => {}));
  }

  /**
   * Time a function execution
   */
  async time<T>(operation: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const start = performance.now();
    const result = await operation();
    const duration = performance.now() - start;
    return { result, duration };
  }

  /**
   * Get agent parse cache
   */
  getParseCache(): AgentParseCache {
    return this.parseCache;
  }

  /**
   * Get sync batcher
   */
  getSyncBatcher(): SyncBatcher {
    return this.syncBatcher;
  }

  /**
   * Update performance metrics
   */
  updateMetrics(updates: Partial<PerformanceMetrics>): void {
    Object.assign(this.metrics, updates);
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): PerformanceMetrics & { cache: ReturnType<AgentParseCache['getStats']> } {
    return {
      ...this.metrics,
      cache: this.parseCache.getStats()
    };
  }

  /**
   * Check if performance targets are being met
   */
  checkPerformanceTargets(): {
    fileWatchLatency: { target: number; current: number; passing: boolean };
    agentParseTime: { target: number; current: number; passing: boolean };
    syncOperationTime: { target: number; current: number; passing: boolean };
    cacheHitRate: { target: number; current: number; passing: boolean };
  } {
    const cacheStats = this.parseCache.getStats();
    
    return {
      fileWatchLatency: {
        target: 1000, // < 1 second
        current: this.metrics.fileWatchLatency,
        passing: this.metrics.fileWatchLatency < 1000
      },
      agentParseTime: {
        target: 100, // < 100ms per agent
        current: this.metrics.agentParseTime,
        passing: this.metrics.agentParseTime < 100
      },
      syncOperationTime: {
        target: 5000, // < 5 seconds
        current: this.metrics.syncOperationTime,
        passing: this.metrics.syncOperationTime < 5000
      },
      cacheHitRate: {
        target: 70, // > 70% cache hit rate
        current: cacheStats.hitRate,
        passing: cacheStats.hitRate > 70
      }
    };
  }

  /**
   * Reset all performance tracking
   */
  reset(): void {
    this.metrics = {
      fileWatchLatency: 0,
      agentParseTime: 0,
      syncOperationTime: 0,
      cacheHitRate: 0
    };
    this.parseCache.clear();
  }
}

/**
 * Optimized file reading with caching
 */
class OptimizedFileReader {
  private cache = new Map<string, CacheEntry<string>>();
  private readonly maxAge = 2 * 60 * 1000; // 2 minutes for file content

  async readFile(filePath: string): Promise<string> {
    try {
      const stats = await stat(filePath);
      const mtime = stats.mtime.getTime();
      
      const cached = this.cache.get(filePath);
      if (cached) {
        const isValid = 
          Date.now() - cached.timestamp < this.maxAge &&
          cached.mtime === mtime;
        
        if (isValid) {
          return cached.data;
        } else {
          this.cache.delete(filePath);
        }
      }

      const content = await readFile(filePath, 'utf-8');
      
      this.cache.set(filePath, {
        data: content,
        timestamp: Date.now(),
        mtime
      });

      return content;
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getSize(): number {
    return this.cache.size;
  }
}

/**
 * Global performance monitor instance
 */
const globalPerformanceMonitor = new PerformanceMonitor();

/**
 * Global file reader instance
 */
const globalFileReader = new OptimizedFileReader();

export {
  PerformanceMonitor,
  AgentParseCache,
  SyncBatcher,
  OptimizedFileReader,
  globalPerformanceMonitor,
  globalFileReader
};

export type {
  PerformanceMetrics,
  CacheEntry
};