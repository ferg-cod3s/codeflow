import { watch, FSWatcher } from 'node:fs';
import { join, relative, basename, dirname } from 'node:path';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { syncGlobalAgents } from '../cli/sync';
import { parseAgentFile } from '../conversion/agent-parser';
import { FormatConverter } from '../conversion/format-converter';
import { globalPerformanceMonitor } from '../optimization/performance.js';

export interface WatchConfig {
  /** Root directory containing the codeflow installation */
  codeflowRoot: string;
  /** Debounce delay in milliseconds */
  debounceMs?: number;
  /** Whether to watch global directories */
  watchGlobal?: boolean;
  /** Project directories to watch */
  projectDirs?: string[];
  /** Whether to automatically convert formats */
  autoConvert?: boolean;
  /** Callback for file change events */
  onChange?: (event: FileChangeEvent) => void | Promise<void>;
}

export interface FileChangeEvent {
  type: 'create' | 'modify' | 'delete';
  filePath: string;
  relativePath: string;
  directory: 'agent' | 'command' | 'claude-agents' | 'opencode-agents';
  isAgent: boolean;
  isCommand: boolean;
}

export class FileWatcher {
  private watchers: FSWatcher[] = [];
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private config: Required<WatchConfig>;
  private converter = new FormatConverter();

  constructor(config: WatchConfig) {
    this.config = {
      debounceMs: 500,
      watchGlobal: false,
      projectDirs: [],
      autoConvert: true,
      onChange: async () => {},
      ...config,
    };
  }

  async start(): Promise<void> {
    console.log('🔍 Starting file system watcher...');

    // Watch core codeflow directories
    await this.watchCodeflowDirectories();

    // Watch project directories if specified
    for (const projectDir of this.config.projectDirs) {
      await this.watchProjectDirectories(projectDir);
    }

    console.log(`📡 Watching ${this.watchers.length} directories for changes`);
  }

  async stop(): Promise<void> {
    console.log('🛑 Stopping file system watcher...');

    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();

    // Close all watchers
    for (const watcher of this.watchers) {
      watcher.close();
    }
    this.watchers = [];

    console.log('✅ File watcher stopped');
  }

  private async watchCodeflowDirectories(): Promise<void> {
    const watchDirs = [
      { path: join(this.config.codeflowRoot, 'agent'), name: 'agent' },
      { path: join(this.config.codeflowRoot, 'command'), name: 'command' },
      { path: join(this.config.codeflowRoot, 'claude-agents'), name: 'claude-agents' },
      { path: join(this.config.codeflowRoot, 'opencode-agents'), name: 'opencode-agents' },
    ] as const;

    for (const dir of watchDirs) {
      if (existsSync(dir.path)) {
        await this.watchDirectory(dir.path, dir.name);
      }
    }
  }

  private async watchProjectDirectories(projectDir: string): Promise<void> {
    const projectWatchDirs = [
      { path: join(projectDir, '.opencode', 'agent'), name: 'opencode-agents' },
      { path: join(projectDir, '.opencode', 'command'), name: 'command' },
      { path: join(projectDir, '.claude', 'commands'), name: 'command' },
      { path: join(projectDir, '.claude', 'agents'), name: 'claude-agents' },
    ] as const;

    for (const dir of projectWatchDirs) {
      if (existsSync(dir.path)) {
        await this.watchDirectory(dir.path, dir.name);
      }
    }
  }

  private async watchDirectory(dirPath: string, dirName: string): Promise<void> {
    try {
      const watcher = watch(dirPath, { recursive: true }, (eventType, filename) => {
        if (filename) {
          this.handleFileChange(eventType, join(dirPath, filename), dirName as any);
        }
      });

      watcher.on('error', (error) => {
        console.error(`❌ Watcher error for ${dirPath}:`, error);
      });

      this.watchers.push(watcher);
      console.log(`  📂 Watching ${relative(this.config.codeflowRoot, dirPath)}`);
    } catch (error: any) {
      console.error(`❌ Failed to watch ${dirPath}:`, error.message);
    }
  }

  private handleFileChange(
    eventType: string,
    filePath: string,
    directory: FileChangeEvent['directory']
  ): void {
    const changeStart = performance.now();

    // Only watch .md files
    if (!filePath.endsWith('.md')) {
      return;
    }

    // Skip README and other non-agent/command files
    const filename = basename(filePath);
    if (filename.startsWith('README') || filename.startsWith('.')) {
      return;
    }

    const relativePath = relative(this.config.codeflowRoot, filePath);
    const isAgent = ['agent', 'claude-agents', 'opencode-agents'].includes(directory);
    const isCommand = directory === 'command';

    const event: FileChangeEvent = {
      type:
        eventType === 'change'
          ? existsSync(filePath)
            ? 'modify'
            : 'delete'
          : existsSync(filePath)
            ? 'create'
            : 'delete',
      filePath,
      relativePath,
      directory,
      isAgent,
      isCommand,
    };

    // Track file watch latency
    const watchLatency = performance.now() - changeStart;
    globalPerformanceMonitor.updateMetrics({ fileWatchLatency: watchLatency });

    // Use sync batcher for performance optimization
    const syncBatcher = globalPerformanceMonitor.getSyncBatcher();
    syncBatcher.add(filePath);

    // Also debounce for traditional handling
    this.debounceFileChange(event);
  }

  private debounceFileChange(event: FileChangeEvent): void {
    const key = event.filePath;

    // Clear existing timer
    if (this.debounceTimers.has(key)) {
      clearTimeout(this.debounceTimers.get(key)!);
    }

    // Set new timer with enhanced error handling
    const timer = setTimeout(async () => {
      this.debounceTimers.delete(key);
      try {
        await this.onFileChange(event);
      } catch (error) {
        console.error(
          `❌ Error in debounced file change handler for ${event.relativePath}:`,
          error
        );
        // Retry once after a delay for transient errors
        setTimeout(async () => {
          try {
            console.log(`🔄 Retrying file change processing for ${event.relativePath}`);
            await this.onFileChange(event);
            console.log(`✅ Retry successful for ${event.relativePath}`);
          } catch (retryError) {
            console.error(`❌ Retry also failed for ${event.relativePath}:`, retryError);
            // Could add more sophisticated error recovery here
            // For example, exponential backoff or circuit breaker pattern
          }
        }, 2000); // Wait 2 seconds before retry
      }
    }, this.config.debounceMs);

    this.debounceTimers.set(key, timer);
  }

  async onFileChange(event: FileChangeEvent): Promise<void> {
    console.log(`📝 ${event.type.toUpperCase()} ${event.relativePath}`);

    try {
      // Call custom onChange handler
      await this.config.onChange(event);

      // Handle agent changes
      if (event.isAgent && this.config.autoConvert) {
        await this.handleAgentChange(event);
      }

      // Handle command changes
      if (event.isCommand) {
        await this.handleCommandChange(event);
      }
    } catch (error: any) {
      console.error(`❌ Failed to process ${event.type} for ${event.relativePath}:`, error.message);
    }
  }

  private async handleAgentChange(event: FileChangeEvent): Promise<void> {
    if (event.type === 'delete') {
      console.log(`  ⚠️  Agent deleted: ${basename(event.filePath, '.md')}`);
      // TODO: Remove from global directories
      return;
    }

    try {
      // Determine format from directory path
      let format: 'base' | 'claude-code' | 'opencode' = 'base';
      if (event.directory.includes('claude-agents')) {
        format = 'claude-code';
      } else if (event.directory.includes('opencode-agents')) {
        format = 'opencode';
      }

      // Parse the agent file
      const agent = await parseAgentFile(event.filePath, format);

      if (!agent) {
        console.log(`  ⚠️  Could not parse agent: ${event.relativePath}`);
        return;
      }

      console.log(`  🤖 Processing agent: ${agent.name} (${agent.format} format)`);

      // Trigger global sync for this agent type
      await this.syncAgentFormats(event.directory);
    } catch (error: any) {
      console.error(`  ❌ Failed to process agent change: ${error.message}`);
    }
  }

  private async handleCommandChange(event: FileChangeEvent): Promise<void> {
    if (event.type === 'delete') {
      console.log(`  ⚠️  Command deleted: ${basename(event.filePath, '.md')}`);
      return;
    }

    console.log(`  📋 Command updated: ${basename(event.filePath, '.md')}`);
    // Commands are typically handled by the existing pull/sync mechanisms
    // This could trigger project-specific syncing in the future
  }

  private async syncAgentFormats(sourceDirectory: FileChangeEvent['directory']): Promise<void> {
    try {
      // Determine which format to sync based on source
      let targetFormat: 'all' | 'base' | 'claude-code' | 'opencode';

      switch (sourceDirectory) {
        case 'agent':
          targetFormat = 'all'; // Base format syncs to all
          break;
        case 'claude-agents':
          targetFormat = 'claude-code';
          break;
        case 'opencode-agents':
          targetFormat = 'opencode';
          break;
        default:
          console.log(`  ⚠️  Unknown source directory: ${sourceDirectory}, skipping sync`);
          return;
      }

      console.log(`  🔄 Syncing ${targetFormat} agents to global directories...`);

      try {
        await syncGlobalAgents({
          format: targetFormat,
          validate: true,
          dryRun: false,
        });

        console.log(`  ✅ Sync completed for ${targetFormat} format`);
      } catch (error) {
        console.error(`  ❌ Sync failed for ${targetFormat} format: ${(error as Error).message}`);

        // Add more context for debugging
        if ((error as Error).message?.includes('AGENT_MANIFEST.json')) {
          console.error(`    💡 Suggestion: Run 'codeflow setup' to initialize the project`);
        } else if (
          (error as Error).message?.includes('permission') ||
          (error as Error).message?.includes('access')
        ) {
          console.error(`    💡 Suggestion: Check file permissions and directory access`);
        } else if (
          (error as Error).message?.includes('YAML') ||
          (error as Error).message?.includes('parse')
        ) {
          console.error(`    💡 Suggestion: Validate agent YAML syntax before syncing`);
        }
      }
    } catch (error: any) {
      console.error(`  ❌ Failed to sync agent formats: ${error.message}`);

      // Add more context for debugging
      if (error.message?.includes('AGENT_MANIFEST.json')) {
        console.error(`    💡 Suggestion: Run 'codeflow setup' to initialize the project`);
      } else if (error.message?.includes('permission') || error.message?.includes('access')) {
        console.error(`    💡 Suggestion: Check file permissions and directory access`);
      } else if (error.message?.includes('YAML') || error.message?.includes('parse')) {
        console.error(`    💡 Suggestion: Validate agent YAML syntax before syncing`);
      }
    }
  }

  /**
   * Get current watch status
   */
  getStatus(): {
    isRunning: boolean;
    watchedDirectories: number;
    pendingChanges: number;
  } {
    return {
      isRunning: this.watchers.length > 0,
      watchedDirectories: this.watchers.length,
      pendingChanges: this.debounceTimers.size,
    };
  }

  /**
   * Manually trigger sync for all watched directories
   */
  async triggerFullSync(): Promise<void> {
    console.log('🔄 Triggering full sync of all agents...');

    await syncGlobalAgents({
      format: 'all',
      includeSpecialized: true,
      includeWorkflow: true,
      validate: true,
    });

    console.log('✅ Full sync complete');
  }
}
