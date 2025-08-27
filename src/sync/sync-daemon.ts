import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { homedir, tmpdir } from "node:os";
import { FileWatcher, WatchConfig, FileChangeEvent } from "./file-watcher";
import { syncGlobalAgents, checkGlobalSync } from "../cli/sync";

export interface SyncDaemonOptions {
  /** Whether to watch global directories */
  watchGlobal?: boolean;
  /** Project directories to watch */
  watchProjects?: string[];
  /** Whether to automatically convert formats */
  autoConvert?: boolean;
  /** How often to check sync status (minutes) */
  healthCheckInterval?: number;
  /** PID file location */
  pidFile?: string;
  /** Log file location */
  logFile?: string;
}

export interface DaemonStatus {
  isRunning: boolean;
  pid?: number;
  startTime?: Date;
  watchedDirectories: number;
  pendingChanges: number;
  lastSync?: Date;
  errorCount: number;
}

export class SyncDaemon {
  private fileWatcher?: FileWatcher;
  private options: Required<SyncDaemonOptions>;
  private startTime?: Date;
  private healthCheckTimer?: NodeJS.Timeout;
  private errorCount = 0;
  private lastSync?: Date;
  private isRunning = false;

  constructor(codeflowRoot: string, options: SyncDaemonOptions = {}) {
    this.options = {
      watchGlobal: false,
      watchProjects: [],
      autoConvert: true,
      healthCheckInterval: 15, // 15 minutes
      pidFile: join(tmpdir(), "codeflow-sync-daemon.pid"),
      logFile: join(homedir(), ".claude", "codeflow-sync.log"),
      ...options
    };

    // Setup file watcher configuration
    const watchConfig: WatchConfig = {
      codeflowRoot,
      debounceMs: 500,
      watchGlobal: this.options.watchGlobal,
      projectDirs: this.options.watchProjects,
      autoConvert: this.options.autoConvert,
      onChange: this.handleFileChange.bind(this)
    };

    this.fileWatcher = new FileWatcher(watchConfig);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error("Sync daemon is already running");
    }

    try {
      // Check if another instance is running
      await this.checkExistingInstance();

      console.log("🚀 Starting codeflow sync daemon...");
      this.logToFile("Starting codeflow sync daemon");

      // Record start time and PID
      this.startTime = new Date();
      await this.writePidFile();

      // Start file watcher
      await this.fileWatcher!.start();

      // Start health check timer
      this.startHealthCheck();

      // Perform initial sync check
      await this.performInitialSync();

      this.isRunning = true;
      console.log("✅ Codeflow sync daemon started successfully");
      this.logToFile("Sync daemon started successfully");

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error: any) {
      console.error("❌ Failed to start sync daemon:", error.message);
      this.logToFile(`Failed to start sync daemon: ${error.message}`);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log("⚠️  Sync daemon is not running");
      return;
    }

    console.log("🛑 Stopping codeflow sync daemon...");
    this.logToFile("Stopping sync daemon");

    try {
      // Stop health check
      if (this.healthCheckTimer) {
        clearInterval(this.healthCheckTimer);
        this.healthCheckTimer = undefined;
      }

      // Stop file watcher
      if (this.fileWatcher) {
        await this.fileWatcher.stop();
      }

      // Remove PID file
      await this.removePidFile();

      this.isRunning = false;
      console.log("✅ Codeflow sync daemon stopped");
      this.logToFile("Sync daemon stopped");

    } catch (error: any) {
      console.error("❌ Error stopping sync daemon:", error.message);
      this.logToFile(`Error stopping sync daemon: ${error.message}`);
      throw error;
    }
  }

  async status(): Promise<DaemonStatus> {
    const watcherStatus = this.fileWatcher?.getStatus() || {
      isRunning: false,
      watchedDirectories: 0,
      pendingChanges: 0
    };

    return {
      isRunning: this.isRunning,
      pid: this.isRunning ? process.pid : undefined,
      startTime: this.startTime,
      watchedDirectories: watcherStatus.watchedDirectories,
      pendingChanges: watcherStatus.pendingChanges,
      lastSync: this.lastSync,
      errorCount: this.errorCount
    };
  }

  async restart(): Promise<void> {
    console.log("🔄 Restarting codeflow sync daemon...");
    
    if (this.isRunning) {
      await this.stop();
      // Wait a moment before restarting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    await this.start();
  }

  private async handleFileChange(event: FileChangeEvent): Promise<void> {
    try {
      this.logToFile(`File change detected: ${event.type} ${event.relativePath}`);
      
      // Update last sync time
      this.lastSync = new Date();

      // Reset error count on successful handling
      if (this.errorCount > 0) {
        this.errorCount = 0;
        this.logToFile("Error count reset after successful file change handling");
      }

    } catch (error: any) {
      this.errorCount++;
      const errorMsg = `Error handling file change ${event.relativePath}: ${error.message}`;
      console.error("❌", errorMsg);
      this.logToFile(errorMsg);

      // If too many errors, consider restarting
      if (this.errorCount > 10) {
        this.logToFile("Too many errors detected, attempting restart");
        try {
          await this.restart();
        } catch (restartError: any) {
          this.logToFile(`Restart failed: ${restartError.message}`);
        }
      }
    }
  }

  private async performInitialSync(): Promise<void> {
    try {
      console.log("🔍 Checking sync status...");
      
      const syncStatus = await checkGlobalSync();
      
      if (syncStatus.needsSync) {
        console.log("📋 Global agents need syncing, performing initial sync...");
        this.logToFile("Performing initial global sync");
        
        await syncGlobalAgents({
          format: 'all',
          includeSpecialized: true,
          includeWorkflow: true,
          validate: true
        });

        this.lastSync = new Date();
        console.log("✅ Initial sync complete");
        this.logToFile("Initial sync completed successfully");
      } else {
        console.log("✅ Global agents are up to date");
        this.logToFile("Global agents are up to date");
      }

    } catch (error: any) {
      const errorMsg = `Initial sync failed: ${error.message}`;
      console.error("❌", errorMsg);
      this.logToFile(errorMsg);
      // Don't throw - let daemon continue running
    }
  }

  private startHealthCheck(): void {
    const intervalMs = this.options.healthCheckInterval * 60 * 1000; // Convert to milliseconds
    
    this.healthCheckTimer = setInterval(async () => {
      try {
        this.logToFile("Performing health check");
        
        // Check if file watcher is still running
        const watcherStatus = this.fileWatcher?.getStatus();
        
        if (!watcherStatus?.isRunning) {
          this.logToFile("File watcher is not running, attempting to restart");
          await this.fileWatcher?.start();
        }

        // Perform periodic sync check
        const syncStatus = await checkGlobalSync();
        if (syncStatus.needsSync) {
          this.logToFile("Periodic sync check found differences, syncing");
          await this.fileWatcher?.triggerFullSync();
          this.lastSync = new Date();
        }

        this.logToFile("Health check completed successfully");
        
      } catch (error: any) {
        this.errorCount++;
        const errorMsg = `Health check failed: ${error.message}`;
        console.error("❌", errorMsg);
        this.logToFile(errorMsg);
      }
    }, intervalMs);

    this.logToFile(`Health check started with ${this.options.healthCheckInterval} minute interval`);
  }

  private async checkExistingInstance(): Promise<void> {
    if (!existsSync(this.options.pidFile)) {
      return; // No existing instance
    }

    try {
      const pidContent = await readFile(this.options.pidFile, 'utf8');
      const existingPid = parseInt(pidContent.trim());

      if (!isNaN(existingPid)) {
        // Check if process is still running
        try {
          process.kill(existingPid, 0); // Signal 0 checks if process exists
          throw new Error(`Another sync daemon is already running (PID: ${existingPid})`);
        } catch (killError: any) {
          if (killError.code === 'ESRCH') {
            // Process doesn't exist, remove stale PID file
            await this.removePidFile();
          } else {
            throw killError;
          }
        }
      }
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return; // PID file was removed
      }
      if (error.message.includes('already running')) {
        throw error;
      }
      // Other errors reading PID file, try to continue
      console.warn(`⚠️  Warning: Could not read existing PID file: ${error.message}`);
    }
  }

  private async writePidFile(): Promise<void> {
    try {
      // Ensure directory exists
      await mkdir(join(this.options.pidFile, '..'), { recursive: true });
      await writeFile(this.options.pidFile, process.pid.toString());
    } catch (error: any) {
      console.warn(`⚠️  Warning: Could not write PID file: ${error.message}`);
    }
  }

  private async removePidFile(): Promise<void> {
    try {
      if (existsSync(this.options.pidFile)) {
        await import("node:fs/promises").then(fs => fs.unlink(this.options.pidFile));
      }
    } catch (error: any) {
      console.warn(`⚠️  Warning: Could not remove PID file: ${error.message}`);
    }
  }

  private async logToFile(message: string): Promise<void> {
    try {
      // Ensure log directory exists
      await mkdir(join(this.options.logFile, '..'), { recursive: true });
      
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}\n`;
      
      const fs = await import("node:fs/promises");
      await fs.appendFile(this.options.logFile, logEntry);
    } catch (error) {
      // Silently fail log writing to avoid recursive errors
    }
  }

  private setupGracefulShutdown(): void {
    const handleShutdown = async (signal: string) => {
      console.log(`\n📡 Received ${signal}, gracefully shutting down...`);
      this.logToFile(`Received ${signal}, shutting down gracefully`);
      
      try {
        await this.stop();
        process.exit(0);
      } catch (error: any) {
        console.error("❌ Error during graceful shutdown:", error.message);
        this.logToFile(`Error during graceful shutdown: ${error.message}`);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGHUP', () => handleShutdown('SIGHUP'));
  }
}

/**
 * Check if sync daemon is running
 */
export async function isDaemonRunning(pidFile?: string): Promise<{ running: boolean; pid?: number }> {
  const pidFilePath = pidFile || join(tmpdir(), "codeflow-sync-daemon.pid");
  
  if (!existsSync(pidFilePath)) {
    return { running: false };
  }

  try {
    const pidContent = await readFile(pidFilePath, 'utf8');
    const pid = parseInt(pidContent.trim());

    if (isNaN(pid)) {
      return { running: false };
    }

    // Check if process is running
    try {
      process.kill(pid, 0);
      return { running: true, pid };
    } catch (error: any) {
      if (error.code === 'ESRCH') {
        // Process doesn't exist, remove stale PID file
        await import("node:fs/promises").then(fs => fs.unlink(pidFilePath));
        return { running: false };
      }
      throw error;
    }
  } catch (error) {
    return { running: false };
  }
}

/**
 * Stop daemon by PID file
 */
export async function stopDaemon(pidFile?: string): Promise<void> {
  const daemonStatus = await isDaemonRunning(pidFile);
  
  if (!daemonStatus.running || !daemonStatus.pid) {
    throw new Error("Sync daemon is not running");
  }

  console.log(`🛑 Stopping sync daemon (PID: ${daemonStatus.pid})...`);
  
  try {
    process.kill(daemonStatus.pid, 'SIGTERM');
    
    // Wait for graceful shutdown
    let attempts = 0;
    while (attempts < 30) { // Wait up to 30 seconds
      await new Promise(resolve => setTimeout(resolve, 1000));
      const status = await isDaemonRunning(pidFile);
      if (!status.running) {
        console.log("✅ Sync daemon stopped gracefully");
        return;
      }
      attempts++;
    }

    // Force kill if graceful shutdown failed
    console.log("⚠️  Graceful shutdown timeout, forcing stop...");
    process.kill(daemonStatus.pid, 'SIGKILL');
    
    console.log("✅ Sync daemon force stopped");
    
  } catch (error: any) {
    if (error.code === 'ESRCH') {
      console.log("✅ Sync daemon was already stopped");
      return;
    }
    throw error;
  }
}