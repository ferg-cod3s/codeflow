import { join } from "node:path";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { homedir, tmpdir } from "node:os";
import { SyncDaemon, isDaemonRunning, stopDaemon } from "../sync/sync-daemon";

interface WatchStartOptions {
  global?: boolean;
  projects?: string;
  autoConvert?: boolean;
  healthCheck?: number;
  background?: boolean;
}

interface WatchStatusOptions {
  json?: boolean;
}

interface WatchLogsOptions {
  follow?: boolean;
  lines?: number;
  clear?: boolean;
}

/**
 * Start the file watching daemon
 */
export async function startWatch(
  codeflowRoot: string,
  options: WatchStartOptions = {}
): Promise<void> {
  const {
    global = false,
    projects,
    autoConvert = true,
    healthCheck = 15,
    background = true
  } = options;

  try {
    // Check if already running
    const status = await isDaemonRunning();
    if (status.running) {
      console.log(`⚠️  Sync daemon is already running (PID: ${status.pid})`);
      console.log("Use 'codeflow watch stop' to stop it first, or 'codeflow watch status' for details");
      return;
    }

    // Parse project directories
    let projectDirs: string[] = [];
    if (projects) {
      projectDirs = projects.split(',').map(p => p.trim()).filter(p => p);
      
      // Validate project directories exist
      for (const projectDir of projectDirs) {
        if (!existsSync(projectDir)) {
          console.error(`❌ Project directory not found: ${projectDir}`);
          return;
        }
      }
    }

    // Create daemon with options
    const daemon = new SyncDaemon(codeflowRoot, {
      watchGlobal: global,
      watchProjects: projectDirs,
      autoConvert,
      healthCheckInterval: healthCheck,
      pidFile: join(tmpdir(), "codeflow-sync-daemon.pid"),
      logFile: join(homedir(), ".claude", "codeflow-sync.log")
    });

    if (background) {
      console.log("🚀 Starting sync daemon in background...");
      
      // Run in background by spawning detached process
      const { spawn } = await import("node:child_process");
      
      const child = spawn(process.execPath, [
        import.meta.path,
        '--daemon',
        '--codeflow-root', codeflowRoot,
        global ? '--global' : '',
        projects ? `--projects=${projects}` : '',
        `--auto-convert=${autoConvert}`,
        `--health-check=${healthCheck}`
      ].filter(Boolean), {
        detached: true,
        stdio: 'ignore'
      });

      child.unref();
      
      console.log(`✅ Sync daemon started in background (PID: ${child.pid})`);
      console.log("Use 'codeflow watch status' to check status");
      console.log("Use 'codeflow watch logs' to view logs");
      
    } else {
      // Run in foreground
      console.log("🚀 Starting sync daemon in foreground...");
      console.log("Press Ctrl+C to stop");
      
      await daemon.start();
      
      // Keep process alive
      await new Promise(() => {}); // This will run until interrupted
    }

  } catch (error: any) {
    console.error("❌ Failed to start watch daemon:", error.message);
    process.exit(1);
  }
}

/**
 * Stop the file watching daemon
 */
export async function stopWatch(): Promise<void> {
  try {
    const status = await isDaemonRunning();
    
    if (!status.running) {
      console.log("ℹ️  Sync daemon is not running");
      return;
    }

    await stopDaemon();
    
  } catch (error: any) {
    console.error("❌ Failed to stop watch daemon:", error.message);
    process.exit(1);
  }
}

/**
 * Show the status of the file watching daemon
 */
export async function watchStatus(options: WatchStatusOptions = {}): Promise<void> {
  const { json = false } = options;

  try {
    const daemonStatus = await isDaemonRunning();
    
    if (!daemonStatus.running) {
      if (json) {
        console.log(JSON.stringify({ running: false }, null, 2));
      } else {
        console.log("📋 Codeflow Sync Daemon Status");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("Status: ❌ Not running");
        console.log("");
        console.log("Use 'codeflow watch start' to start the daemon");
      }
      return;
    }

    // Try to get detailed status (this would require IPC with the daemon)
    // For now, just show basic information from PID
    const logFile = join(homedir(), ".claude", "codeflow-sync.log");
    let lastLogEntry = "";
    let errorCount = 0;
    
    if (existsSync(logFile)) {
      try {
        const logContent = await readFile(logFile, 'utf8');
        const lines = logContent.trim().split('\n');
        lastLogEntry = lines[lines.length - 1] || "";
        
        // Count errors in recent entries
        const recentLines = lines.slice(-50); // Last 50 entries
        errorCount = recentLines.filter(line => 
          line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')
        ).length;
        
      } catch (e) {
        // Ignore log read errors
      }
    }

    const statusInfo = {
      running: true,
      pid: daemonStatus.pid,
      logFile,
      lastActivity: lastLogEntry ? lastLogEntry.match(/\[(.*?)\]/)?.[1] : undefined,
      recentErrors: errorCount
    };

    if (json) {
      console.log(JSON.stringify(statusInfo, null, 2));
    } else {
      console.log("📋 Codeflow Sync Daemon Status");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`Status: ✅ Running (PID: ${daemonStatus.pid})`);
      
      if (statusInfo.lastActivity) {
        console.log(`Last Activity: ${statusInfo.lastActivity}`);
      }
      
      if (errorCount > 0) {
        console.log(`Recent Errors: ⚠️  ${errorCount} error(s) in recent activity`);
      } else {
        console.log("Recent Errors: ✅ None");
      }
      
      console.log(`Log File: ${logFile}`);
      console.log("");
      console.log("Commands:");
      console.log("  codeflow watch logs     - View recent logs");
      console.log("  codeflow watch stop     - Stop the daemon");
      console.log("  codeflow watch restart  - Restart the daemon");
    }

  } catch (error: any) {
    console.error("❌ Failed to get daemon status:", error.message);
    process.exit(1);
  }
}

/**
 * Show logs from the file watching daemon
 */
export async function watchLogs(options: WatchLogsOptions = {}): Promise<void> {
  const { follow = false, lines = 50, clear = false } = options;

  const logFile = join(homedir(), ".claude", "codeflow-sync.log");

  if (clear) {
    try {
      await import("node:fs/promises").then(fs => fs.writeFile(logFile, ""));
      console.log("✅ Log file cleared");
      return;
    } catch (error: any) {
      console.error("❌ Failed to clear log file:", error.message);
      process.exit(1);
    }
  }

  if (!existsSync(logFile)) {
    console.log("📝 No log file found. Start the daemon to generate logs.");
    return;
  }

  try {
    if (follow) {
      console.log(`📝 Following logs (Ctrl+C to stop):`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      // Use tail -f equivalent
      const { spawn } = await import("node:child_process");
      const tailProcess = spawn('tail', ['-f', logFile], { stdio: 'inherit' });
      
      // Handle Ctrl+C
      process.on('SIGINT', () => {
        tailProcess.kill();
        console.log("\n📝 Stopped following logs");
        process.exit(0);
      });
      
      await new Promise((resolve) => {
        tailProcess.on('exit', resolve);
      });
      
    } else {
      // Show recent logs
      const content = await readFile(logFile, 'utf8');
      const allLines = content.trim().split('\n');
      const recentLines = allLines.slice(-lines);
      
      console.log(`📝 Recent logs (last ${Math.min(lines, recentLines.length)} entries):`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      for (const line of recentLines) {
        if (line.trim()) {
          // Color-code log levels
          if (line.toLowerCase().includes('error') || line.toLowerCase().includes('failed')) {
            console.log(`❌ ${line}`);
          } else if (line.toLowerCase().includes('warn')) {
            console.log(`⚠️  ${line}`);
          } else if (line.toLowerCase().includes('sync') || line.toLowerCase().includes('complete')) {
            console.log(`✅ ${line}`);
          } else {
            console.log(`ℹ️  ${line}`);
          }
        }
      }
      
      console.log("");
      console.log("Use 'codeflow watch logs --follow' to watch in real-time");
    }

  } catch (error: any) {
    console.error("❌ Failed to read log file:", error.message);
    process.exit(1);
  }
}

/**
 * Restart the file watching daemon
 */
export async function restartWatch(
  codeflowRoot: string,
  options: WatchStartOptions = {}
): Promise<void> {
  console.log("🔄 Restarting sync daemon...");
  
  try {
    // Stop if running
    const status = await isDaemonRunning();
    if (status.running) {
      console.log("🛑 Stopping current daemon...");
      await stopWatch();
      
      // Wait a moment
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Start with same options
    console.log("🚀 Starting daemon...");
    await startWatch(codeflowRoot, options);
    
  } catch (error: any) {
    console.error("❌ Failed to restart daemon:", error.message);
    process.exit(1);
  }
}

/**
 * Handle daemon mode when running as background process
 */
export async function runDaemonMode(): Promise<void> {
  // Parse command line arguments for daemon mode
  const args = process.argv.slice(2);
  const argsMap = new Map<string, string>();
  
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value = 'true'] = arg.slice(2).split('=');
      argsMap.set(key, value);
    }
  }

  if (!argsMap.has('daemon')) {
    return; // Not daemon mode
  }

  const codeflowRoot = argsMap.get('codeflow-root');
  if (!codeflowRoot) {
    console.error("❌ Daemon mode requires --codeflow-root parameter");
    process.exit(1);
  }

  const options = {
    watchGlobal: argsMap.has('global'),
    watchProjects: argsMap.get('projects')?.split(',').filter(p => p.trim()) || [],
    autoConvert: argsMap.get('auto-convert') === 'true',
    healthCheckInterval: parseInt(argsMap.get('health-check') || '15'),
    pidFile: join(tmpdir(), "codeflow-sync-daemon.pid"),
    logFile: join(homedir(), ".claude", "codeflow-sync.log")
  };

  // Create and start daemon
  const daemon = new SyncDaemon(codeflowRoot, options);
  await daemon.start();

  // Keep process alive
  await new Promise(() => {});
}

// Handle daemon mode if run directly
if (import.meta.main) {
  runDaemonMode().catch(error => {
    console.error("❌ Daemon failed:", error);
    process.exit(1);
  });
}