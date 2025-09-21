import { readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { mkdir, copyFile, stat } from 'fs/promises';
import path, { basename } from 'path';
import os from 'os';
import { findAgentManifest } from '../utils/manifest-discovery.js';
/**
 * Canonical Agent Synchronization System
 *
 * Synchronizes agents from canonical sources to project and global directories,
 * ensuring consistency while allowing project-specific overrides.
 */

export interface SyncOptions {
  projectPath?: string;
  target: 'project' | 'global' | 'all';
  sourceFormat: 'base' | 'claude-code' | 'opencode';
  dryRun: boolean;
  force: boolean;
}

export interface SyncResult {
  synced: Array<{ from: string; to: string; agent: string }>;
  skipped: Array<{ agent: string; target: string; reason: string }>;
  errors: Array<EnhancedSyncError>;
}

// Enhanced error reporting
export enum SyncErrorType {
  VALIDATION = 'validation',
  CONVERSION = 'conversion',
  SERIALIZATION = 'serialization',
  FILE_SYSTEM = 'filesystem',
  PARSING = 'parsing',
}

export interface EnhancedSyncError {
  agent: string;
  type: SyncErrorType;
  message: string;
  filePath?: string;
  line?: number;
  suggestion?: string;
}

// Sync health monitoring
export interface SyncHealth {
  lastSyncTime: Date;
  totalAgents: number;
  syncedAgents: number;
  failedAgents: number;
  averageSyncTime: number;
  errorRate: number;
  lastError?: string;
}

export class CanonicalSyncer {
  private syncHealth: SyncHealth = {
    lastSyncTime: new Date(0), // Initialize to epoch
    totalAgents: 0,
    syncedAgents: 0,
    failedAgents: 0,
    averageSyncTime: 0,
    errorRate: 0,
  };

  /**
   * Load the agent manifest
   */
  private async loadManifest(): Promise<any> {
    try {
      const discovery = await findAgentManifest();
      return JSON.parse(await readFile(discovery.path, 'utf-8'));
    } catch (error) {
      throw new Error(
        `AGENT_MANIFEST.json not found. ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Sync agents and commands from canonical sources with atomic operations
   */
  async syncFromCanonical(options: SyncOptions): Promise<SyncResult> {
    const syncStartTime = performance.now();
    const manifest = await this.loadManifest();
    const result: SyncResult = { synced: [], skipped: [], errors: [] };
    const tempFiles: string[] = [];

    // Update health tracking
    this.syncHealth.totalAgents = manifest.canonical_agents?.length || 0;

    try {
      // Phase 1: Validate all agents first
      const validAgents = await this.validateAllAgents(
        manifest.canonical_agents || [],
        options,
        result
      );

      // Only proceed if no validation errors (unless force is true)
      if (result.errors.length > 0 && !options.force) {
        throw new Error(
          `${result.errors.length} agents failed validation. Use --force to override.`
        );
      }

      // Phase 2: Convert and write all valid agents to temp files
      for (const agent of validAgents) {
        const tempFilesForAgent = await this.convertAndWriteToTemp(agent, options);
        tempFiles.push(...tempFilesForAgent);
      }

      // Phase 3: Sync commands if target includes global
      if (options.target === 'global' || options.target === 'all' || options.target === 'project') {
        const commandTempFiles = await this.syncCommands(options);
        tempFiles.push(...commandTempFiles);
      }

      // Phase 4: Commit all temp files to final locations
      await this.commitSync(tempFiles, result);

      // Update health metrics on success
      const syncEndTime = performance.now();
      const syncDuration = syncEndTime - syncStartTime;

      this.updateSyncHealth(result, syncDuration);
    } catch (error) {
      // Update health metrics on failure
      this.syncHealth.failedAgents += 1;
      this.syncHealth.lastError = (error as Error).message;
      this.syncHealth.errorRate = this.calculateErrorRate();

      // Rollback: Clean up any temp files
      await this.rollbackSync(tempFiles);
      throw error;
    }

    return result;
  }

  /**
   * Validate all agents before sync
   */
  private async validateAllAgents(
    agents: any[],
    options: SyncOptions,
    result: SyncResult
  ): Promise<any[]> {
    const validAgents: any[] = [];

    for (const agent of agents) {
      const sourceFile = agent.sources[options.sourceFormat];
      try {
        if (!sourceFile || !existsSync(sourceFile)) {
          result.errors.push({
            agent: agent.name,
            type: SyncErrorType.FILE_SYSTEM,
            message: `Source file not found: ${sourceFile}`,
            filePath: sourceFile,
            suggestion: 'Check that the agent file exists in the source directory',
          });
          continue;
        }

        // Pre-sync validation: parse and validate agent
        const { parseAgentFile } = await import('../conversion/agent-parser.js');
        const sourceAgent = await parseAgentFile(sourceFile, options.sourceFormat as any);

        const { ValidationEngine } = await import('../yaml/validation-engine.js');
        const validator = new ValidationEngine();
        const validationResult = validator.validate(sourceAgent);

        if (!validationResult.valid) {
          const errorMessages = validationResult.errors.map((e) => e.message).join('; ');
          result.errors.push({
            agent: agent.name,
            type: SyncErrorType.VALIDATION,
            message: `Validation failed: ${errorMessages}`,
            filePath: sourceFile,
            suggestion: 'Fix the validation errors in the agent file before syncing',
          });
          continue;
        }

        validAgents.push({ agent, sourceFile, sourceAgent });
      } catch (error) {
        result.errors.push({
          agent: agent.name,
          type: SyncErrorType.PARSING,
          message: `Failed to parse/validate agent: ${(error as Error).message}`,
          filePath: sourceFile,
          suggestion: 'Check the YAML syntax and required fields in the agent file',
        });
      }
    }

    return validAgents;
  }

  /**
   * Convert agent and write to temporary files for all target paths
   */
  private async convertAndWriteToTemp(
    agentData: { agent: any; sourceFile: string; sourceAgent: any },
    options: SyncOptions
  ): Promise<string[]> {
    const { agent, sourceFile } = agentData;
    const targetPaths = this.getTargetPaths(agent.name, options.target);
    const tempFiles: string[] = [];

    // Create temp file for each target path
    for (const targetPath of targetPaths) {
      const tempPath = `${targetPath}.tmp`;

      await this.syncFile(
        sourceFile,
        tempPath,
        options.sourceFormat,
        this.detectTargetFormat(targetPath),
        agent.name
      );

      tempFiles.push(tempPath);
    }

    return tempFiles;
  }

  /**
   * Commit temp files to final locations
   */
  private async commitSync(tempFiles: string[], result: SyncResult): Promise<void> {
    for (const tempFile of tempFiles) {
      const finalPath = tempFile.replace('.tmp', '');
      await copyFile(tempFile, finalPath);

      // Clean up temp file
      await import('node:fs/promises').then((fs) => fs.unlink(tempFile));

      result.synced.push({
        from: tempFile.replace('.tmp', ''), // Original source
        to: finalPath,
        agent: basename(finalPath, '.md'),
      });
    }
  }

  /**
   * Rollback: Clean up temp files on error
   */
  private async rollbackSync(tempFiles: string[]): Promise<void> {
    for (const tempFile of tempFiles) {
      try {
        await import('node:fs/promises').then((fs) => fs.unlink(tempFile));
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  /**
   * Update sync health metrics after successful sync
   */
  private updateSyncHealth(result: SyncResult, duration: number): void {
    this.syncHealth.lastSyncTime = new Date();
    this.syncHealth.syncedAgents = result.synced.length;
    this.syncHealth.failedAgents = result.errors.length;

    // Update average sync time (exponential moving average)
    const alpha = 0.1; // Smoothing factor
    this.syncHealth.averageSyncTime =
      this.syncHealth.averageSyncTime === 0
        ? duration
        : this.syncHealth.averageSyncTime * (1 - alpha) + duration * alpha;

    this.syncHealth.errorRate = this.calculateErrorRate();
    this.syncHealth.lastError = undefined; // Clear last error on success
  }

  /**
   * Calculate error rate based on recent sync history
   */
  private calculateErrorRate(): number {
    if (this.syncHealth.totalAgents === 0) return 0;
    return this.syncHealth.failedAgents / this.syncHealth.totalAgents;
  }

  /**
   * Get current sync health status
   */
  getSyncHealth(): SyncHealth {
    return { ...this.syncHealth };
  }

  /**
   * Get sync health summary for reporting
   */
  getSyncHealthSummary(): {
    status: 'healthy' | 'warning' | 'critical';
    message: string;
    metrics: Partial<SyncHealth>;
  } {
    const health = this.syncHealth;
    const errorRatePercent = (health.errorRate * 100).toFixed(1);

    let status: 'healthy' | 'warning' | 'critical';
    let message: string;

    if (health.errorRate > 0.5) {
      status = 'critical';
      message = `Critical: ${errorRatePercent}% sync failure rate`;
    } else if (health.errorRate > 0.2) {
      status = 'warning';
      message = `Warning: ${errorRatePercent}% sync failure rate`;
    } else {
      status = 'healthy';
      message = `Healthy: ${errorRatePercent}% sync failure rate`;
    }

    if (health.lastError) {
      message += ` - Last error: ${health.lastError}`;
    }

    return {
      status,
      message,
      metrics: {
        lastSyncTime: health.lastSyncTime,
        totalAgents: health.totalAgents,
        syncedAgents: health.syncedAgents,
        failedAgents: health.failedAgents,
        averageSyncTime: Math.round(health.averageSyncTime),
        errorRate: health.errorRate,
      },
    };
  }

  /**
   * Get target paths for an agent
   */
  private getTargetPaths(agentName: string, target: string): string[] {
    const paths = [];

    if (target === 'project' || target === 'all') {
      // Project-specific locations
      paths.push(path.join(process.cwd(), '.claude', 'agents', `${agentName}.md`));
      paths.push(path.join(process.cwd(), '.opencode', 'agent', `${agentName}.md`));
    }

    if (target === 'global' || target === 'all') {
      // Global locations
      const homeDir = os.homedir();
      paths.push(path.join(homeDir, '.claude', 'agents', `${agentName}.md`));
      paths.push(path.join(homeDir, '.config', 'opencode', 'agent', `${agentName}.md`));
    }

    return paths;
  }

  /**
   * Sync a single file
   */
  private async syncFile(
    sourcePath: string,
    targetPath: string,
    sourceFormat: string,
    targetFormat: string,
    agentName: string
  ) {
    // Ensure target directory exists
    const targetDir = path.dirname(targetPath);
    await mkdir(targetDir, { recursive: true });

    if (sourceFormat === targetFormat) {
      // Direct copy
      await copyFile(sourcePath, targetPath);
    } else {
      // Format conversion required
      const { FormatConverter } = await import('../conversion/format-converter.js');
      const { parseAgentFile } = await import('../conversion/agent-parser.js');

      const sourceAgent = await parseAgentFile(sourcePath, sourceFormat as any);
      const converter = new FormatConverter();
      const convertedAgent = converter.convert(sourceAgent, targetFormat as any);

      // Use proper YAML serialization with YamlProcessor
      const { YamlProcessor } = await import('../yaml/yaml-processor.js');
      const processor = new YamlProcessor();
      const yamlResult = processor.serialize(convertedAgent);

      if (!yamlResult.success) {
        throw new Error(`YAML serialization failed for ${agentName}: ${yamlResult.error.message}`);
      }

      const content = yamlResult.data;
      await Bun.write(targetPath, content);
    }
  }

  /**
   * Determine if a file should be synced
   */
  private async shouldSyncFile(
    sourcePath: string,
    targetPath: string,
    force: boolean
  ): Promise<boolean> {
    if (force) return true;

    try {
      const [sourceStats, targetStats] = await Promise.all([stat(sourcePath), stat(targetPath)]);

      // Only sync if source is newer or sizes differ significantly
      return (
        sourceStats.mtime > targetStats.mtime || Math.abs(sourceStats.size - targetStats.size) > 100
      );
    } catch (error) {
      // Target doesn't exist, should sync
      return true;
    }
  }

  /**
   * Detect target format from path
   */
  private detectTargetFormat(targetPath: string): string {
    if (targetPath.includes('.claude/')) return 'claude-code';
    if (targetPath.includes('.opencode/') || targetPath.includes('.config/opencode/'))
      return 'opencode';
    return 'base';
  }

  /**
   * Sync commands to global directories
   */
  private async syncCommands(options: SyncOptions): Promise<string[]> {
    const tempFiles: string[] = [];
    const codeflowRoot = path.join(process.cwd());
    const sourceCommandDir = path.join(codeflowRoot, 'command');

    if (!existsSync(sourceCommandDir)) {
      return tempFiles; // No commands to sync
    }

    try {
      const files = await readdir(sourceCommandDir);
      const mdFiles = files.filter((f: string) => f.endsWith('.md'));

      for (const file of mdFiles) {
        const sourceFile = path.join(sourceCommandDir, file);
        // Determine target paths based on sync target
        const targetPaths: string[] = [];

        if (options.target === 'global' || options.target === 'all') {
          targetPaths.push(
            path.join(os.homedir(), '.claude', 'commands', file),
            path.join(os.homedir(), '.config', 'opencode', 'command', file)
          );
        }

        if (options.target === 'project' || options.target === 'all') {
          const projectPath = options.projectPath || process.cwd();
          targetPaths.push(
            path.join(projectPath, '.claude', 'commands', file),
            path.join(projectPath, '.opencode', 'command', file)
          );
        }

        for (const targetPath of targetPaths) {
          const tempPath = `${targetPath}.tmp`;

          try {
            // Ensure target directory exists
            const targetDir = path.dirname(targetPath);
            await mkdir(targetDir, { recursive: true });

            // Copy command file directly (no format conversion needed for commands)
            await copyFile(sourceFile, tempPath);
            tempFiles.push(tempPath);
          } catch (error) {
            console.error(`Failed to sync command ${file}: ${(error as Error).message}`);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to sync commands: ${(error as Error).message}`);
    }

    return tempFiles;
  }

  /**
   * Sync all agents to project directories
   */
  async syncToProject(
    sourceFormat: 'base' | 'claude-code' | 'opencode' = 'base',
    force = false
  ): Promise<SyncResult> {
    return this.syncFromCanonical({
      target: 'project',
      sourceFormat,
      dryRun: false,
      force,
    });
  }

  /**
   * Sync all agents to global directories
   */
  async syncToGlobal(
    sourceFormat: 'base' | 'claude-code' | 'opencode' = 'base',
    force = false
  ): Promise<SyncResult> {
    return this.syncFromCanonical({
      target: 'global',
      sourceFormat,
      dryRun: false,
      force,
    });
  }

  /**
   * Dry run sync to see what would be changed
   */
  async dryRun(
    target: 'project' | 'global' | 'all',
    sourceFormat: 'base' | 'claude-code' | 'opencode' = 'base'
  ): Promise<SyncResult> {
    return this.syncFromCanonical({
      target,
      sourceFormat,
      dryRun: true,
      force: false,
    });
  }
}
