import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import crypto from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { buildAgentRegistry, categorizeAgents, suggestAgents } from './agent-registry.mjs';
import {
  spawnAgentTask,
  executeParallelAgents,
  executeSequentialAgents,
  createWorkflowOrchestrator,
  validateAgentExecution,
} from './agent-spawner.mjs';

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to find codeflow installation or use fallback paths
function findCodeflowPaths() {
  const codeflowRoot = path.resolve(__dirname, '..');

  // Try current working directory first (for cross-repo usage)
  const cwd = process.cwd();
  const cwdCommandDir = path.join(cwd, '.opencode', 'command');
  const cwdClaudeCommandDir = path.join(cwd, '.claude', 'commands');

  // Fallback to codeflow installation
  const codeflowCommandDir = path.join(codeflowRoot, 'command');

  return {
    // Priority order: .opencode/command, .claude/commands, then codeflow/command
    commandDirs: [cwdCommandDir, cwdClaudeCommandDir, codeflowCommandDir],
    codeflowRoot,
  };
}

const paths = findCodeflowPaths();

// Global agent registry - initialized once on server startup
let globalAgentRegistry = null;
let agentCategories = null;
let workflowOrchestrator = null;

function toSlug(filePath) {
  const base = path.basename(filePath).replace(/\.[^.]+$/, '');
  return base.replace(/[^a-zA-Z0-9]+/g, '_');
}

function toUniqueId(prefix, filePath) {
  const slug = toSlug(filePath);
  // Use cross-platform crypto for hashing
  const hash = crypto.createHash('sha1').update(filePath).digest('hex').slice(0, 8);
  return `${prefix}.${slug}__${hash}`;
}

async function loadMarkdownFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'))
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
  const coreCommands = ['research', 'plan', 'execute', 'test', 'document', 'commit', 'review'];

  for (const filePath of commandFiles) {
    const base = path.basename(filePath, '.md');

    // Only include core workflow commands
    if (!coreCommands.includes(base)) {
      continue;
    }

    const slug = toSlug(filePath);
    tools.push({
      id: base, // Use simple name like "research", "plan", etc.
      type: 'command',
      slug,
      filePath,
      description: `Codeflow workflow: ${base}`,
    });
  }

  return tools;
}

function jsonSchemaObject(properties = {}, required = []) {
  return {
    type: 'object',
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

/**
 * Add agent context to command content
 */
function addAgentContext(commandContent, context) {
  const agentSection = ['## Available Agents', '', '### Agent Categories:'];

  for (const [category, agents] of Object.entries(context.agentCategories)) {
    if (agents.length > 0) {
      agentSection.push(`**${category}**: ${agents.join(', ')}`);
    }
  }

  agentSection.push('');
  agentSection.push('### Agent Functions Available:');
  agentSection.push('- `spawnAgent(agentId, task)` - Execute a single agent');
  agentSection.push('- `parallelAgents(agentIds, tasks)` - Execute multiple agents in parallel');
  agentSection.push('- `suggestAgents(taskDescription)` - Get agent recommendations');
  agentSection.push('- `executeResearchWorkflow(domain, query)` - Run research workflow');
  agentSection.push('- `executePlanningWorkflow(requirements, context)` - Run planning workflow');
  agentSection.push('');

  return commandContent + '\n\n' + agentSection.join('\n');
}

async function run() {
  console.log('Initializing codeflow MCP server...');

  // Initialize agent registry on startup
  try {
    console.log('Building agent registry...');
    globalAgentRegistry = await buildAgentRegistry();
    agentCategories = categorizeAgents(globalAgentRegistry);
    workflowOrchestrator = createWorkflowOrchestrator(globalAgentRegistry);
    console.log(`Agent registry initialized with ${globalAgentRegistry.size} agents`);
  } catch (error) {
    console.error('Failed to initialize agent registry:', error);
    // Continue without agents rather than failing completely
    globalAgentRegistry = new Map();
    agentCategories = {};
  }

  const server = new McpServer({ name: 'codeflow-tools', version: '0.2.1' });

  const transport = new StdioServerTransport();

  const toolEntries = await buildTools();
  const commandSlugToPath = new Map();

  // Register each core workflow command with agent context
  for (const entry of toolEntries) {
    server.registerTool(
      entry.id,
      {
        title: entry.id,
        description: entry.description + ' (Enhanced with agent orchestration capabilities)',
      },
      async (args = {}) => {
        const commandContent = await fs.readFile(entry.filePath, 'utf8');

        // Enhanced context with available agents
        const context = {
          availableAgents: Array.from(globalAgentRegistry.keys()),
          agentCategories,
          totalAgents: globalAgentRegistry.size,

          // Agent execution functions (for command reference)
          spawnAgent: (agentId, task) => spawnAgentTask(agentId, task, globalAgentRegistry),
          parallelAgents: (agentIds, tasks) =>
            executeParallelAgents(agentIds, tasks, globalAgentRegistry),
          sequentialAgents: (agentSpecs) =>
            executeSequentialAgents(agentSpecs, globalAgentRegistry),
          suggestAgents: (taskDescription) => suggestAgents(globalAgentRegistry, taskDescription),
          validateAgent: (agentId) => validateAgentExecution(agentId, globalAgentRegistry),

          // Workflow orchestrators
          executeResearchWorkflow: (domain, query) =>
            workflowOrchestrator.executeResearchWorkflow(domain, query),
          executePlanningWorkflow: (requirements, context) =>
            workflowOrchestrator.executePlanningWorkflow(requirements, context),
        };

        // Add agent context information to command content
        const enhancedContent = addAgentContext(commandContent, context);

        return {
          content: [{ type: 'text', text: enhancedContent }],
        };
      }
    );

    // Track for parameterized access
    commandSlugToPath.set(entry.slug, entry.filePath);
  }

  // Parameterized command getter with agent context
  server.registerTool(
    'get_command',
    {
      title: 'get_command',
      description: 'Return command markdown by base name with agent orchestration context.',
    },
    async (args = {}) => {
      const name = (args.name || '').toString().trim();
      if (!name) {
        return { content: [{ type: 'text', text: "Error: 'name' is required" }] };
      }
      const slug = name.replace(/[^a-zA-Z0-9]+/g, '_');
      const filePath = commandSlugToPath.get(slug);
      if (!filePath) {
        const availableCommands = Array.from(commandSlugToPath.keys()).join(', ');
        return {
          content: [
            {
              type: 'text',
              text: `Command '${name}' not found. Available commands: ${availableCommands}`,
            },
          ],
        };
      }

      const commandContent = await fs.readFile(filePath, 'utf8');

      // Enhanced context with available agents
      const context = {
        availableAgents: Array.from(globalAgentRegistry.keys()),
        agentCategories,
        totalAgents: globalAgentRegistry.size,
      };

      // Add agent context information to command content
      const enhancedContent = addAgentContext(commandContent, context);

      return { content: [{ type: 'text', text: enhancedContent }] };
    }
  );

  console.log('Connecting MCP server transport...');
  await server.connect(transport);
  console.log('Codeflow MCP server running with enhanced agent capabilities');

  // Keep the process alive until the stdio stream closes or the process is interrupted.
  await new Promise((resolve) => {
    const onClose = () => {
      console.log('Shutting down codeflow MCP server...');
      resolve();
    };
    // Bun sometimes doesn't keep the event loop alive on stdio alone; explicitly wait.
    try {
      process.stdin.resume();
    } catch {}
    try {
      process.stdin.on('end', onClose);
      process.stdin.on('close', onClose);
    } catch {}
    try {
      process.on('SIGINT', onClose);
      process.on('SIGTERM', onClose);
    } catch {}
  });
}

run().catch((err) => {
  console.error('Codeflow MCP server failed:', err);
  process.exit(1);
});
