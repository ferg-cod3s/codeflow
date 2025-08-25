import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import crypto from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to find agentic installation or use fallback paths
function findAgenticPaths() {
  const agenticRoot = path.resolve(__dirname, "..");
  
  // Try current working directory first (for cross-repo usage)
  const cwd = process.cwd();
  const cwdCommandDir = path.join(cwd, ".opencode", "command");
  const cwdClaudeCommandDir = path.join(cwd, ".claude", "commands");
  
  // Fallback to agentic installation
  const agenticCommandDir = path.join(agenticRoot, "command");
  
  return {
    // Priority order: .opencode/command, .claude/commands, then agentic/command
    commandDirs: [cwdCommandDir, cwdClaudeCommandDir, agenticCommandDir],
    agenticRoot
  };
}

const paths = findAgenticPaths();

function toSlug(filePath) {
  const base = path.basename(filePath).replace(/\.[^.]+$/, "");
  return base.replace(/[^a-zA-Z0-9]+/g, "_");
}

function toUniqueId(prefix, filePath) {
  const slug = toSlug(filePath);
  // Use cross-platform crypto for hashing
  const hash = crypto.createHash("sha1").update(filePath).digest("hex").slice(0, 8);
  return `${prefix}.${slug}__${hash}`;
}

async function loadMarkdownFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
      .map((e) => path.join(dir, e.name));
  } catch (err) {
    return [];
  }
}

async function buildTools() {
  const tools = [];

  // Only load workflow commands - agents are internal implementation details
  // Try each command directory in priority order
  let commandFiles = [];
  for (const dir of paths.commandDirs) {
    const files = await loadMarkdownFiles(dir);
    if (files.length > 0) {
      commandFiles = files;
      break; // Use first directory that has commands
    }
  }

  // Define the core 7 workflow commands we want to expose
  const coreCommands = [
    'research', 'plan', 'execute', 'test', 'document', 'commit', 'review'
  ];

  for (const filePath of commandFiles) {
    const base = path.basename(filePath, '.md');
    
    // Only include core workflow commands
    if (!coreCommands.includes(base)) {
      continue;
    }
    
    const slug = toSlug(filePath);
    tools.push({
      id: base, // Use simple name like "research", "plan", etc.
      type: "command",
      slug,
      filePath,
      description: `Agentic workflow: ${base}`,
    });
  }

  return tools;
}

function jsonSchemaObject(properties = {}, required = []) {
  return {
    type: "object",
    properties,
    required,
    additionalProperties: false,
  };
}

function toolSpecFromEntry(entry) {
  return {
    name: entry.id,
    description: `${entry.description}. Returns the markdown body.`,
    inputSchema: jsonSchemaObject({}),
  };
}

async function run() {
  const server = new McpServer({ name: "agentic-tools", version: "0.1.0" });

  const transport = new StdioServerTransport();

  const toolEntries = await buildTools();
  const commandSlugToPath = new Map();

  // Register each core workflow command
  for (const entry of toolEntries) {
    server.registerTool(
      entry.id,
      {
        title: entry.id,
        description: entry.description,
      },
      async () => {
        const text = await fs.readFile(entry.filePath, "utf8");
        return {
          content: [{ type: "text", text }],
        };
      }
    );

    // Track for parameterized access
    commandSlugToPath.set(entry.slug, entry.filePath);
  }

  // Parameterized command getter (keep this with prefix for clarity)
  server.registerTool(
    "get_command",
    {
      title: "get_command",
      description: "Return command markdown by base name (e.g., 'research', 'plan', 'execute').",
    },
    async (args = {}) => {
      const name = (args.name || "").toString().trim();
      if (!name) {
        return { content: [{ type: "text", text: "Error: 'name' is required" }] };
      }
      const slug = name.replace(/[^a-zA-Z0-9]+/g, "_");
      const filePath = commandSlugToPath.get(slug);
      if (!filePath) {
        const availableCommands = Array.from(commandSlugToPath.keys()).join(', ');
        return { 
          content: [{ 
            type: "text", 
            text: `Command '${name}' not found. Available commands: ${availableCommands}` 
          }] 
        };
      }
      const text = await fs.readFile(filePath, "utf8");
      return { content: [{ type: "text", text }] };
    }
  );

  await server.connect(transport);
  // Keep the process alive until the stdio stream closes or the process is interrupted.
  await new Promise((resolve) => {
    const onClose = () => resolve();
    // Bun sometimes doesn't keep the event loop alive on stdio alone; explicitly wait.
    try { process.stdin.resume(); } catch {}
    try {
      process.stdin.on("end", onClose);
      process.stdin.on("close", onClose);
    } catch {}
    try {
      process.on("SIGINT", onClose);
      process.on("SIGTERM", onClose);
    } catch {}
  });
}

run().catch((err) => {
  console.error("Agentic MCP server failed:", err);
  process.exit(1);
});
