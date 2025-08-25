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

export async function mcpServer(action: string, options: { background?: boolean, port?: number } = {}) {
  const agenticDir = join(import.meta.dir, "../..");
  const serverPath = join(agenticDir, "mcp/agentic-server.mjs");
  
  if (!existsSync(serverPath)) {
    console.error(`❌ MCP server not found: ${serverPath}`);
    process.exit(1);
  }
  
  switch (action) {
    case "start":
      console.log("🚀 Starting Agentic MCP Server...");
      console.log(`📁 Working directory: ${process.cwd()}`);
      console.log(`🔧 Server path: ${serverPath}`);
      
      const serverProcess = spawn("bun", ["run", serverPath], {
        stdio: options.background ? "ignore" : "inherit",
        detached: options.background,
        env: {
          ...process.env,
          AGENTIC_PORT: options.port?.toString()
        }
      });
      
      if (options.background) {
        serverProcess.unref();
        console.log(`✅ MCP Server started in background (PID: ${serverProcess.pid})`);
        console.log("   Use 'agentic mcp stop' to stop the server");
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
          execSync('taskkill /f /im bun.exe /fi "WINDOWTITLE eq agentic-server*"');
        } else {
          execSync("pkill -f 'agentic-server.mjs'");
        }
        console.log("✅ Stopped MCP Server");
      } catch (error) {
        console.log("⚠️  No running MCP Server found");
      }
      break;
      
    case "status":
      // Check if MCP server is running
      try {
        if (process.platform === "win32") {
          const output = execSync('tasklist /fi "IMAGENAME eq bun.exe" /fo csv', { encoding: "utf-8" });
          const isRunning = output.includes("agentic-server");
          console.log(isRunning ? "✅ MCP Server is running" : "❌ MCP Server is not running");
        } else {
          execSync("pgrep -f 'agentic-server.mjs'", { stdio: "ignore" });
          console.log("✅ MCP Server is running");
        }
      } catch {
        console.log("❌ MCP Server is not running");
      }
      
      // Also check Claude Desktop config
      const config = await loadClaudeConfig();
      const hasAgenticServer = config.mcpServers && config.mcpServers["agentic-tools"];
      console.log(hasAgenticServer ? 
        "✅ Claude Desktop is configured for agentic" : 
        "❌ Claude Desktop is not configured for agentic"
      );
      break;
      
    default:
      console.error(`❌ Unknown MCP action: ${action}`);
      console.error("Available actions: start, stop, status");
      process.exit(1);
  }
}

export async function mcpConfigure(client: string, options: { remove?: boolean } = {}) {
  const agenticDir = join(import.meta.dir, "../..");
  const serverPath = join(agenticDir, "mcp/agentic-server.mjs");
  
  switch (client) {
    case "claude-desktop":
    case "claude":
      const config = await loadClaudeConfig();
      
      if (options.remove) {
        if (config.mcpServers && config.mcpServers["agentic-tools"]) {
          delete config.mcpServers["agentic-tools"];
          await saveClaudeConfig(config);
          console.log("✅ Removed agentic from Claude Desktop configuration");
          console.log("🔄 Restart Claude Desktop for changes to take effect");
        } else {
          console.log("ℹ️  Agentic is not configured in Claude Desktop");
        }
        return;
      }
      
      // Add/update configuration
      if (!config.mcpServers) {
        config.mcpServers = {};
      }
      
      config.mcpServers["agentic-tools"] = {
        command: "bun",
        args: ["run", serverPath],
        env: {}
      };
      
      await saveClaudeConfig(config);
      console.log("✅ Configured Claude Desktop for agentic MCP integration");
      console.log("🔄 Restart Claude Desktop for changes to take effect");
      console.log("");
      console.log("📋 Next steps:");
      console.log("  1. Restart Claude Desktop");
      console.log("  2. Navigate to your project directory");
      console.log("  3. Start using tools: research, plan, execute, etc.");
      break;
      
    default:
      console.error(`❌ Unknown MCP client: ${client}`);
      console.error("Available clients: claude-desktop");
      process.exit(1);
  }
}

export async function mcpList(): Promise<void> {
  console.log("📋 Available MCP Commands:\n");
  
  // Show server management
  console.log("🔧 Server Management:");
  console.log("  agentic mcp start              Start MCP server");
  console.log("  agentic mcp start --background  Start in background");
  console.log("  agentic mcp stop               Stop background server");
  console.log("  agentic mcp status             Check server status");
  console.log("");
  
  // Show configuration
  console.log("⚙️  Client Configuration:");
  console.log("  agentic mcp configure claude-desktop    Configure Claude Desktop");
  console.log("  agentic mcp configure claude --remove   Remove from Claude Desktop");
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
  console.log("  agentic mcp start");
  console.log("  ");
  console.log("  # In Claude Desktop:");
  console.log("  Use tool: research");
  console.log("  Input: \"Analyze authentication system for OAuth integration\"");
}