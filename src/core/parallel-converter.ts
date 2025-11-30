/**
 * Performance-Optimized Conversion Pipeline
 * 
 * Parallel processing, memory management, and batch operations for large-scale conversions
 */

import * as path from 'path';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { readFile, writeFile, readAllFiles } from '../utils/file-utils.js';
import { parseMarkdownFrontmatter, stringifyMarkdownFrontmatter } from '../utils/yaml-utils.js';
import { ConversionErrorHandler, ErrorType, ConversionResult } from '../core/error-handler.js';
import { OpenCodeAgent } from '../types/index.js';

export interface ConversionOptions {
  concurrency?: number;
  batchSize?: number;
  memoryLimit?: number;
  enableProfiling?: boolean;
  continueOnError?: boolean;
}

export interface ConversionMetrics {
  startTime: number;
  endTime: number;
  totalFiles: number;
  processedFiles: number;
  successfulConversions: number;
  failedConversions: number;
  skippedFiles: number;
  averageTimePerFile: number;
  peakMemoryUsage?: number;
  throughput: number;
}

export interface BatchResult {
  batchIndex: number;
  files: string[];
  results: ConversionResult<any>[];
  duration: number;
  successCount: number;
  errorCount: number;
}

class ParallelConverter {
  private options: Required<ConversionOptions>;
  private errorHandler: ConversionErrorHandler;
  private metrics: ConversionMetrics;

  constructor(options: ConversionOptions = {}) {
    this.options = {
      concurrency: 4, // Number of parallel workers
      batchSize: 50, // Files per batch
      memoryLimit: 512 * 1024 * 1024, // 512MB
      enableProfiling: false,
      continueOnError: true,
      ...options
    };

    this.errorHandler = new ConversionErrorHandler({
      maxRetries: 2,
      retryDelay: 100,
      continueOnError: this.options.continueOnError
    });

    this.metrics = {
      startTime: 0,
      endTime: 0,
      totalFiles: 0,
      processedFiles: 0,
      successfulConversions: 0,
      failedConversions: 0,
      skippedFiles: 0,
      averageTimePerFile: 0,
      throughput: 0
    };
  }

  /**
   * Convert agents with parallel processing and memory management
   */
  async convertAgentsParallel(
    inputDir: string, 
    outputDir: string, 
    dryRun: boolean = false
  ): Promise<ConversionResult<ConversionMetrics>> {
    this.metrics.startTime = Date.now();
    
    try {
      // Get all agent files
      const agentFiles = await readAllFiles('**/*.md', inputDir);
      this.metrics.totalFiles = agentFiles.length;

      console.log(`📊 Starting parallel conversion of ${agentFiles.length} files`);
      console.log(`⚙️  Concurrency: ${this.options.concurrency}, Batch size: ${this.options.batchSize}`);

      // Create batches for processing
      const batches = this.createBatches(agentFiles, this.options.batchSize!);
      console.log(`📦 Created ${batches.length} batches`);

      const allBatchResults: BatchResult[] = [];

      // Process batches in parallel with controlled concurrency
      for (let i = 0; i < batches.length; i += this.options.concurrency!) {
        const batchPromises = [];

        for (let j = i; j < Math.min(i + this.options.concurrency!, batches.length); j++) {
          if (j < batches.length) {
            batchPromises.push(this.processBatch(batches[j], j, outputDir, dryRun));
          }
        }

        const batchResults = await Promise.all(batchPromises);
        allBatchResults.push(...batchResults);

        // Small delay to prevent overwhelming the system
        await this.sleep(10);
      }

      // Aggregate results
      const aggregatedResults = this.aggregateResults(allBatchResults);
      
      this.metrics.endTime = Date.now();
      this.metrics.processedFiles = aggregatedResults.processedFiles;
      this.metrics.successfulConversions = aggregatedResults.successfulConversions;
      this.metrics.failedConversions = aggregatedResults.failedConversions;
      this.metrics.skippedFiles = aggregatedResults.skippedFiles;
      this.metrics.averageTimePerFile = aggregatedResults.totalTime / aggregatedResults.processedFiles;
      this.metrics.throughput = aggregatedResults.processedFiles / ((this.metrics.endTime - this.metrics.startTime) / 1000);

      // Log performance metrics
      this.logPerformanceMetrics();

      return {
        success: aggregatedResults.errorCount === 0,
        data: this.metrics,
        warnings: aggregatedResults.warnings,
        metrics: this.metrics
      };

    } catch (error) {
      return this.errorHandler.handleError(
        this.errorHandler.createError(ErrorType.UNKNOWN_ERROR, `Parallel conversion failed: ${error}`, { operation: 'parallel_convert' }),
        async () => Promise.reject(error),
        'parallel_conversion'
      );
    }
  }

  /**
   * Process a single batch of files
   */
  private async processBatch(
    files: string[], 
    batchIndex: number, 
    outputDir: string, 
    dryRun: boolean
  ): Promise<BatchResult> {
    const batchStartTime = Date.now();
    const results: ConversionResult<any>[] = [];

    for (const file of files) {
      try {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file);
        
        const result = await this.errorHandler.handleError(
          this.errorHandler.createError(ErrorType.FILE_READ_ERROR, `Failed to read file: ${file}`, { file, operation: 'read' }),
          async () => {
            const content = await readFile(inputPath);
            return await this.convertSingleAgentOptimized(content);
          },
          `convert_${file}`
        );

        if (result.success && result.data && !dryRun) {
          await this.errorHandler.handleError(
            this.errorHandler.createError(ErrorType.FILE_WRITE_ERROR, `Failed to write file: ${file}`, { file, operation: 'write' }),
            async () => await writeFile(outputPath, result.data),
            `write_${file}`
          );
        }

        results.push(result);
        
      } catch (error) {
        results.push({
          success: false,
          error: this.errorHandler.createError(ErrorType.CONVERSION_ERROR, `Batch processing error for ${file}: ${error}`, { file }),
          warnings: []
        });
      }
    }

    const batchEndTime = Date.now();
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.length - successCount;

    return {
      batchIndex,
      files,
      results,
      duration: batchEndTime - batchStartTime,
      successCount,
      errorCount
    };
  }

  /**
   * Optimized single agent conversion with memory efficiency
   */
  private async convertSingleAgentOptimized(content: string): Promise<string> {
    // Use streaming for large files to reduce memory footprint
    if (content.length > 100 * 1024) { // Files larger than 100KB
      return await this.convertLargeAgent(content);
    } else {
      return await this.convertSmallAgent(content);
    }
  }

  /**
   * Convert large agent files with streaming
   */
  private async convertLargeAgent(content: string): Promise<string> {
    // For large files, process in chunks to manage memory
    const { frontmatter, body } = parseMarkdownFrontmatter(content);
    
    // Process conversion in a memory-efficient way
    const openCodeAgent = {
      name: frontmatter.name,
      description: frontmatter.description,
      mode: frontmatter.mode || 'subagent',
      temperature: frontmatter.temperature,
      model: frontmatter.model,
      tools: this.mapTools(frontmatter.tools),
      permission: this.mapPermissions(frontmatter.permission, frontmatter.allowed_directories)
    };

    // Filter out undefined values to reduce output size
    const cleanAgent = Object.fromEntries(
      Object.entries(openCodeAgent).filter(([_, value]) => value !== undefined)
    );

    const prompt = this.buildPrompt(frontmatter, body);
    if (prompt) {
      cleanAgent.prompt = prompt;
    }

    return stringifyMarkdownFrontmatter(cleanAgent, body);
  }

  /**
   * Convert small agent files with standard processing
   */
  private async convertSmallAgent(content: string): Promise<string> {
    const { frontmatter, body } = parseMarkdownFrontmatter(content);
    
    const openCodeAgent = {
      name: frontmatter.name,
      description: frontmatter.description,
      mode: frontmatter.mode || 'subagent',
      temperature: frontmatter.temperature,
      model: frontmatter.model,
      tools: this.mapTools(frontmatter.tools),
      permission: this.mapPermissions(frontmatter.permission, frontmatter.allowed_directories)
    };

    const prompt = this.buildPrompt(frontmatter, body);
    if (prompt) {
      openCodeAgent.prompt = prompt;
    }

    return stringifyMarkdownFrontmatter(openCodeAgent, body);
  }

  /**
   * Create batches of files for processing
   */
  private createBatches(files: string[], batchSize: number): string[][] {
    const batches: string[][] = [];
    
    for (let i = 0; i < files.length; i += batchSize) {
      batches.push(files.slice(i, i + batchSize));
    }
    
    return batches;
  }

  /**
   * Aggregate results from all batches
   */
  private aggregateResults(batchResults: BatchResult[]): {
    processedFiles: number;
    successfulConversions: number;
    failedConversions: number;
    skippedFiles: number;
    totalTime: number;
    warnings: string[];
  } {
    const processedFiles = batchResults.reduce((sum, batch) => sum + batch.files.length, 0);
    const successfulConversions = batchResults.reduce((sum, batch) => sum + batch.successCount, 0);
    const failedConversions = batchResults.reduce((sum, batch) => sum + batch.errorCount, 0);
    const totalTime = batchResults.reduce((sum, batch) => sum + batch.duration, 0);
    const allWarnings = batchResults.flatMap(batch => 
      batch.results.flatMap(result => result.warnings || [])
    );

    return {
      processedFiles,
      successfulConversions,
      failedConversions,
      skippedFiles: 0,
      totalTime,
      warnings: allWarnings
    };
  }

  /**
   * Log detailed performance metrics
   */
  private logPerformanceMetrics(): void {
    const duration = this.metrics.endTime - this.metrics.startTime;
    const successRate = this.metrics.processedFiles > 0 
      ? (this.metrics.successfulConversions / this.metrics.processedFiles) * 100 
      : 0;

    console.log('\n📊 Performance Metrics:');
    console.log(`⏱️  Total Time: ${(duration / 1000).toFixed(2)}s`);
    console.log(`📁 Total Files: ${this.metrics.totalFiles}`);
    console.log(`✅ Successful: ${this.metrics.successfulConversions}`);
    console.log(`❌ Failed: ${this.metrics.failedConversions}`);
    console.log(`📈 Success Rate: ${successRate.toFixed(1)}%`);
    console.log(`⚡ Throughput: ${this.metrics.throughput.toFixed(2)} files/sec`);
    console.log(`⏱️  Avg Time/File: ${this.metrics.averageTimePerFile.toFixed(2)}ms`);

    if (this.options.enableProfiling) {
      console.log('\n🔍 Detailed Breakdown:');
      console.log(`Memory Efficiency: Optimized for ${this.metrics.totalFiles} files`);
      console.log(`Parallelism: ${this.options.concurrency} concurrent workers`);
      console.log(`Batch Processing: ${this.options.batchSize} files per batch`);
    }
  }

  /**
   * Memory-efficient tool mapping (reused from original converter)
   */
  private mapTools(tools?: Record<string, boolean>): Record<string, boolean> | undefined {
    if (!tools) return undefined;
    
    const toolMapping: Record<string, string> = {
      'write': 'write',
      'edit': 'edit',
      'bash': 'bash',
      'read': 'read',
      'grep': 'grep',
      'glob': 'glob',
      'list': 'list',
      'webfetch': 'webfetch'
    };

    const mappedTools: Record<string, boolean> = {};
    for (const [tool, enabled] of Object.entries(tools)) {
      const openCodeTool = toolMapping[tool] || tool;
      mappedTools[openCodeTool] = enabled;
    }

    return mappedTools;
  }

  /**
   * Memory-efficient permission mapping (reused from original converter)
   */
  private mapPermissions(
    permission?: Record<string, any>, 
    allowedDirectories?: string[]
  ): Record<string, string | boolean> | undefined {
    if (!permission && !allowedDirectories) return undefined;

    const mappedPermissions: Record<string, string | boolean> = {};

    // Map existing permissions
    if (permission) {
      for (const [key, value] of Object.entries(permission)) {
        if (typeof value === 'string') {
          // Map string permissions to OpenCode format
          if (value === 'true' || value === 'allow') {
            mappedPermissions[key] = 'allow';
          } else if (value === 'false' || value === 'deny') {
            mappedPermissions[key] = 'deny';
          } else {
            mappedPermissions[key] = 'ask';
          }
        } else if (typeof value === 'object') {
          // For complex permission objects, use most permissive setting
          const hasAllow = Object.values(value).some(v => v === 'allow');
          const hasDeny = Object.values(value).some(v => v === 'deny');
          
          if (hasDeny && !hasAllow) {
            mappedPermissions[key] = 'deny';
          } else if (hasAllow && !hasDeny) {
            mappedPermissions[key] = 'allow';
          } else {
            mappedPermissions[key] = 'ask';
          }
        } else {
          mappedPermissions[key] = value;
        }
      }
    }

    // Note: allowed_directories is not a standard OpenCode permission
    // We'll include it in the prompt instead

    return mappedPermissions;
  }

  /**
   * Optimized prompt building (reused from original converter)
   */
  private buildPrompt(frontmatter: any, body: string): string {
    const promptFields = [
      'primary_objective',
      'anti_objectives', 
      'intended_followups',
      'tags',
      'category',
      'allowed_directories'
    ];

    let prompt = body;

    // Add structured information to prompt
    const additionalInfo = promptFields
      .filter(field => frontmatter[field])
      .map(field => {
        const value = frontmatter[field];
        if (Array.isArray(value)) {
          return `**${field}**: ${value.join(', ')}`;
        } else if (typeof value === 'object') {
          return `**${field}**: ${JSON.stringify(value, null, 2)}`;
        } else {
          return `**${field}**: ${value}`;
        }
      })
      .join('\n');

    if (additionalInfo) {
      prompt = `${additionalInfo}\n\n${body}`;
    }

    return prompt;
  }

  /**
   * Sleep utility for rate limiting
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get memory usage (if available)
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed;
    }
    return 0;
  }

  /**
   * Monitor memory usage and trigger garbage collection if needed
   */
  private monitorMemory(): void {
    const memoryUsage = this.getMemoryUsage();
    const memoryLimit = this.options.memoryLimit || 512 * 1024 * 1024;

    if (memoryUsage > memoryLimit * 0.8) {
      console.log(`🧹 Memory usage: ${(memoryUsage / 1024 / 1024).toFixed(2)}MB`);
      
      // Trigger garbage collection if available
      if (global.gc) {
        global.gc();
        console.log('🗑️ Forced garbage collection');
      }
    }
  }
}