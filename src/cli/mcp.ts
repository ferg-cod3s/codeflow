import { spawn } from "node:child_process";
import { join } from "node:path";
import { existsSync } from "node:fs";
import { writeFile, readFile } from "node:fs/promises";

interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

function getClaudeDesktopConfigPath(): string {
  const platform = process.platform;
  const home = process.env.HOME || process.env.USERPROFILE || "";
  
  switch (platform) {
    case "darwin": // macOS
      return join(home, "Library/Application Support/Claude/claude_desktop_config.json");
    case "win32": // Windows
      return join(process.env.APPDATA || "", "Claude/claude_desktop_config.json");
    default: // Linux and others
      return join(home, ".config/Claude/claude_desktop_config.json");
  }
}

function getWarpConfigPath(): string {
  const platform = process.platform;
  const home = process.env.HOME || process.env.USERPROFILE || "";
  
  switch (platform) {
    case "darwin": // macOS
      return join(home, ".warp", "mcp_config.json");
    case "win32": // Windows
      return join(process.env.APPDATA || "", "Warp", "mcp_config.json");
    default: // Linux and others
      return join(home, ".config", "warp", "mcp_config.json");
  }
}

function getCursorConfigPath(): string {
  const platform = process.platform;
  const home = process.env.HOME || process.env.USERPROFILE || "";
  
  switch (platform) {
    case "darwin": // macOS
      return join(home, "Library", "Application Support", "Cursor", "mcp_config.json");
    case "win32": // Windows
      return join(process.env.APPDATA || "", "Cursor", "mcp_config.json");
    default: // Linux and others
      return join(home, ".config", "cursor", "mcp_config.json");
  }
}

// OpenCode doesn't use MCP configuration - it uses .opencode/command/ directory

async function loadClaudeConfig(): Promise<any> {
  const configPath = getClaudeDesktopConfigPath();
  if (!existsSync(configPath)) {
    return { mcpServers: {} };
  }
  
  try {
    const content = await readFile(configPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️  Could not parse Claude Desktop config: ${error}`);
    return { mcpServers: {} };
  }
}

async function saveClaudeConfig(config: any): Promise<void> {
  const configPath = getClaudeDesktopConfigPath();
  const configDir = join(configPath, "..");
  
  // Create directory if it doesn't exist
  if (!existsSync(configDir)) {
    await import("node:fs/promises").then(fs => fs.mkdir(configDir, { recursive: true }));
  }
  
  await writeFile(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Updated Claude Desktop config: ${configPath}`);
}

async function loadWarpConfig(): Promise<any> {
  const configPath = getWarpConfigPath();
  if (!existsSync(configPath)) {
    return { mcpServers: {} };
  }
  
  try {
    const content = await readFile(configPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️  Could not parse Warp config: ${error}`);
    return { mcpServers: {} };
  }
}

async function saveWarpConfig(config: any): Promise<void> {
  const configPath = getWarpConfigPath();
  const configDir = join(configPath, "..");
  
  // Create directory if it doesn't exist
  if (!existsSync(configDir)) {
    await import("node:fs/promises").then(fs => fs.mkdir(configDir, { recursive: true }));
  }
  
  await writeFile(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Updated Warp config: ${configPath}`);
}

async function loadCursorConfig(): Promise<any> {
  const configPath = getCursorConfigPath();
  if (!existsSync(configPath)) {
    return { mcpServers: {} };
  }
  
  try {
    const content = await readFile(configPath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.warn(`⚠️  Could not parse Cursor config: ${error}`);
    return { mcpServers: {} };
  }
}

async function saveCursorConfig(config: any): Promise<void> {
  const configPath = getCursorConfigPath();
  const configDir = join(configPath, "..");
  
  // Create directory if it doesn't exist
  if (!existsSync(configDir)) {
    await import("node:fs/promises").then(fs => fs.mkdir(configDir, { recursive: true }));
  }
  
  await writeFile(configPath, JSON.stringify(config, null, 2));
  console.log(`✅ Updated Cursor config: ${configPath}`);
}

// OpenCode helper functions removed - OpenCode uses .opencode/command/ directory

export async function mcpServer(action: string, options: { background?: boolean, port?: number } = {}) {
  const codeflowDir = join(import.meta.dir, "../..");
  const serverPath = join(codeflowDir, "mcp/codeflow-server.mjs");
  
  if (!existsSync(serverPath)) {
    console.error(`❌ MCP server not found: ${serverPath}`);
    process.exit(1);
  }
  
  switch (action) {
    case "start":
      console.log("🚀 Starting Codeflow MCP Server...");
      console.log(`📁 Working directory: ${process.cwd()}`);
      console.log(`🔧 Server path: ${serverPath}`);
      
      const serverProcess = spawn("bun", ["run", serverPath], {
        stdio: options.background ? "ignore" : "inherit",
        detached: options.background,
        env: {
          ...process.env,
          CODEFLOW_PORT: options.port?.toString()
        }
      });
      
      if (options.background) {
        serverProcess.unref();
        console.log(`✅ MCP Server started in background (PID: ${serverProcess.pid})`);
        console.log("   Use 'codeflow mcp stop' to stop the server");
      } else {
        console.log("🔗 MCP Server running (Ctrl+C to stop)");
        
        // Handle graceful shutdown
        process.on('SIGINT', () => {
          console.log("\n⏹️  Stopping MCP Server...");
          serverProcess.kill('SIGTERM');
          process.exit(0);
        });
        
        serverProcess.on('close', (code) => {
          if (code === 0) {
            console.log("✅ MCP Server stopped");
          } else {
            console.log(`❌ MCP Server exited with code ${code}`);
          }
          process.exit(code || 0);
        });
      }
      break;
      
    case "stop":
      // Find and stop background MCP server processes
      const { execSync } = await import("node:child_process");
      try {
        if (process.platform === "win32") {
          execSync('taskkill /f /im bun.exe /fi "WINDOWTITLE eq codeflow-server*"');
        } else {
          execSync("pkill -f 'codeflow-server.mjs'");
        }
        console.log("✅ Stopped MCP Server");
      } catch (error) {
        console.log("⚠️  No running MCP Server found");
      }
      break;
      
    case "restart":
      console.log("🔄 Restarting Codeflow MCP Server...");
      
      // Stop existing server
      const { execSync: restartExecSync } = await import("node:child_process");
      try {
        if (process.platform === "win32") {
          restartExecSync('taskkill /f /im bun.exe /fi "WINDOWTITLE eq codeflow-server*"');
        } else {
          restartExecSync("pkill -f 'codeflow-server.mjs'");
        }
        console.log("⏹️  Stopped existing MCP Server");
      } catch (error) {
        console.log("ℹ️  No existing MCP Server found");
      }
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Start server in background by default
      console.log("🚀 Starting MCP Server...");
      const restartServerProcess = spawn("bun", ["run", serverPath], {
        stdio: "ignore",
        detached: true,
        env: {
          ...process.env,
          CODEFLOW_PORT: options.port?.toString()
        }
      });
      
      restartServerProcess.unref();
      console.log(`✅ MCP Server restarted in background (PID: ${restartServerProcess.pid})`);
      console.log("🔄 MCP clients will now have access to updated agents");
      break;
      
    case "status":
      // Check if MCP server is running
      const { execSync: statusExecSync } = await import("node:child_process");
      try {
        if (process.platform === "win32") {
          const output = statusExecSync('tasklist /fi "IMAGENAME eq bun.exe" /fo csv', { encoding: "utf-8" });
          const isRunning = output.includes("codeflow-server");
          console.log(isRunning ? "✅ MCP Server is running" : "❌ MCP Server is not running");
        } else {
          statusExecSync("pgrep -f 'codeflow-server.mjs'", { stdio: "ignore" });
          console.log("✅ MCP Server is running");
        }
      } catch {
        console.log("❌ MCP Server is not running");
      }
      
      // Also check Claude Desktop config
      const config = await loadClaudeConfig();
      const hasCodeflowServer = config.mcpServers && config.mcpServers["codeflow-tools"];
      console.log(hasCodeflowServer ? 
        "✅ Claude Desktop is configured for codeflow" : 
        "❌ Claude Desktop is not configured for codeflow"
      );
      break;
      
    default:
      console.error(`❌ Unknown MCP action: ${action}`);
      console.error("Available actions: start, stop, restart, status");
      process.exit(1);
  }
}

export async function mcpConfigure(client: string, options: { remove?: boolean } = {}) {
  const codeflowDir = join(import.meta.dir, "../..");
  const serverPath = join(codeflowDir, "mcp/codeflow-server.mjs");
  
  switch (client) {
    case "claude-desktop":
    case "claude":
      const config = await loadClaudeConfig();
      
      if (options.remove) {
        if (config.mcpServers && config.mcpServers["codeflow-tools"]) {
          delete config.mcpServers["codeflow-tools"];
          await saveClaudeConfig(config);
          console.log("✅ Removed codeflow from Claude Desktop configuration");
          console.log("🔄 Restart Claude Desktop for changes to take effect");
        } else {
          console.log("ℹ️  Codeflow is not configured in Claude Desktop");
        }
        return;
      }
      
      // Add/update configuration
      if (!config.mcpServers) {
        config.mcpServers = {};
      }
      
      config.mcpServers["codeflow-tools"] = {
        command: "bun",
        args: ["run", serverPath],
        env: {}
      };
      
      await saveClaudeConfig(config);
      console.log("✅ Configured Claude Desktop for codeflow MCP integration");
      console.log("🔄 Restart Claude Desktop for changes to take effect");
      console.log("");
      console.log("📋 Next steps:");
      console.log("  1. Restart Claude Desktop");
      console.log("  2. Navigate to your project directory");
      console.log("  3. Start using tools: research, plan, execute, etc.");
      break;
      
    case "warp":
      const warpConfig = await loadWarpConfig();
      
      if (options.remove) {
        if (warpConfig.mcpServers && warpConfig.mcpServers["codeflow-tools"]) {
          delete warpConfig.mcpServers["codeflow-tools"];
          await saveWarpConfig(warpConfig);
          console.log("✅ Removed codeflow from Warp configuration");
          console.log("🔄 Restart Warp or reload settings for changes to take effect");
        } else {
          console.log("ℹ️  Codeflow is not configured in Warp");
        }
        return;
      }
      
      // Add/update configuration
      if (!warpConfig.mcpServers) {
        warpConfig.mcpServers = {};
      }
      
      warpConfig.mcpServers["codeflow-tools"] = {
        name: "Codeflow Tools",
        command: "bun",
        args: ["run", serverPath],
        env: {},
        description: "Codeflow workflow automation tools"
      };
      
      await saveWarpConfig(warpConfig);
      console.log("✅ Configured Warp for codeflow MCP integration");
      console.log("📁 Config saved to: " + getWarpConfigPath());
      console.log("");
      console.log("📋 Next steps:");
      console.log("  1. Open Warp Settings → AI → Tools (MCP)");
      console.log("  2. Click 'Reload' or restart Warp");
      console.log("  3. Navigate to your project directory");
      console.log("  4. Use Warp AI with codeflow tools");
      console.log("");
      console.log("💡 Alternatively, add manually in Warp Settings:");
      console.log("   Name: codeflow-tools");
      console.log("   Command: bun");
      console.log("   Args: run " + serverPath);
      break;
      
    case "cursor":
      const cursorConfig = await loadCursorConfig();
      
      if (options.remove) {
        if (cursorConfig.mcpServers && cursorConfig.mcpServers["codeflow-tools"]) {
          delete cursorConfig.mcpServers["codeflow-tools"];
          await saveCursorConfig(cursorConfig);
          console.log("✅ Removed codeflow from Cursor configuration");
          console.log("🔄 Restart Cursor for changes to take effect");
        } else {
          console.log("ℹ️  Codeflow is not configured in Cursor");
        }
        return;
      }
      
      // Add/update configuration
      if (!cursorConfig.mcpServers) {
        cursorConfig.mcpServers = {};
      }
      
      cursorConfig.mcpServers["codeflow-tools"] = {
        command: "bun",
        args: ["run", serverPath],
        env: {}
      };
      
      await saveCursorConfig(cursorConfig);
      console.log("✅ Configured Cursor for codeflow MCP integration");
      console.log("📁 Config saved to: " + getCursorConfigPath());
      console.log("");
      console.log("📋 Next steps:");
      console.log("  1. Restart Cursor");
      console.log("  2. Navigate to your project directory");
      console.log("  3. Use Cursor AI features with codeflow tools");
      console.log("");
      console.log("💡 Note: Cursor also supports running commands directly via its AI assistant");
      break;
      
    // OpenCode doesn't use MCP config - it uses .opencode/command/ directory
    // Setup should be done via: codeflow setup . --type opencode
      
    default:
      console.error(`❌ Unknown MCP client: ${client}`);
      console.error("Available clients: claude-desktop, warp, cursor");
      console.error("Note: OpenCode uses .opencode/command/ directory, not MCP. Use 'codeflow setup . --type opencode'");
      process.exit(1);
  }
}

export async function mcpList(): Promise<void> {
  console.log("📋 Available MCP Commands:\n");
  
  // Show server management
  console.log("🔧 Server Management:");
  console.log("  codeflow mcp start              Start MCP server");
  console.log("  codeflow mcp start --background  Start in background");
  console.log("  codeflow mcp stop               Stop background server");
  console.log("  codeflow mcp status             Check server status");
  console.log("");
  
  // Show configuration
  console.log("⚙️  Client Configuration:");
  console.log("  codeflow mcp configure claude-desktop    Configure Claude Desktop");
  console.log("  codeflow mcp configure claude --remove   Remove from Claude Desktop");
  console.log("  codeflow mcp configure warp              Configure Warp Terminal");
  console.log("  codeflow mcp configure warp --remove     Remove from Warp Terminal");
  console.log("  codeflow mcp configure cursor            Configure Cursor IDE");
  console.log("  codeflow mcp configure cursor --remove   Remove from Cursor");
  console.log("");
  console.log("📝 Note: OpenCode and Claude use different setups:");
  console.log("  • OpenCode: Use 'codeflow setup . --type opencode' (creates .opencode/command/)");
  console.log("  • Claude.ai: Use 'codeflow setup . --type claude-code' (creates .claude/commands/)");
  console.log("");
  
  // Show available tools
  console.log("🛠️  Available MCP Tools:");
  const tools = [
    "research    - Comprehensive codebase and documentation analysis",
    "plan        - Create detailed implementation plans", 
    "execute     - Implement plans with verification",
    "test        - Generate comprehensive test suites",
    "document    - Create user guides and API documentation",
    "commit      - Create structured git commits",
    "review      - Validate implementations against plans",
    "get_command - Get command documentation by name"
  ];
  
  tools.forEach(tool => console.log(`  ${tool}`));
  console.log("");
  
  // Show usage example
  console.log("💡 Usage Example:");
  console.log("  # Start server from your project directory");
  console.log("  cd ~/my-project");
  console.log("  codeflow mcp start");
  console.log("  ");
  console.log("  # In Claude Desktop:");
  console.log("  Use tool: research");
  console.log("  Input: \"Analyze authentication system for OAuth integration\"");
}