import fs from 'node:fs/promises';
import path from 'node:path';
import url from 'node:url';
import crypto from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
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

function _toUniqueId(prefix, filePath) {
  const slug = toSlug(filePath);
  // Use cross-platform crypto for hashing
  const hash = crypto.createHash('sha1').update(filePath).digest('hex').slice(0, 8);
  return `${prefix}.${slug}__${hash}`;
}

/**
 * Check if an agent has access to a requested file path
 */
async function checkAgentFileAccess(agentName, requestedPath) {
  if (!globalAgentRegistry) {
    throw new Error('Agent registry not initialized');
  }

  const agent = globalAgentRegistry.get(agentName);
  if (!agent) {
    throw new Error(
      `Agent '${agentName}' not found in registry. Available agents: ${Array.from(globalAgentRegistry.keys()).join(', ')}`
    );
  }

  const allowedDirs = agent.allowedDirectories || [];
  if (allowedDirs.length === 0) {
    // If no allowed directories specified, deny access
    throw new Error(
      `PERMISSION_DENIED: Agent '${agentName}' has no allowed directories configured. Please check agent configuration.`
    );
  }

  // Check if requested path is within allowed directories
  const isAllowed = allowedDirs.some((dir) => {
    try {
      const resolvedDir = path.resolve(dir);
      const resolvedPath = path.resolve(requestedPath);
      return resolvedPath.startsWith(resolvedDir);
    } catch {
      // If path resolution fails, deny access
      return false;
    }
  });

  if (!isAllowed) {
    const allowedDirsList = allowedDirs.map((dir) => `  - ${dir}`).join('\n');
    throw new Error(
      `PERMISSION_DENIED: Access denied for agent '${agentName}' to path '${requestedPath}'.\n\nAllowed directories:\n${allowedDirsList}\n\nThe requested path is not within any of the agent's allowed directories.`
    );
  }

  return true;
}

async function loadMarkdownFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.md'))
      .map((e) => path.join(dir, e.name));
  } catch (_err) {
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

function _toolSpecFromEntry(entry) {
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
  let qaIssues = [];
  try {
    console.log('Building agent registry...');
    const registryResult = await buildAgentRegistry();
    globalAgentRegistry = registryResult.agents;
    qaIssues = registryResult.qaIssues;
    agentCategories = categorizeAgents(globalAgentRegistry);
    workflowOrchestrator = createWorkflowOrchestrator(globalAgentRegistry);
    console.log(`Agent registry initialized with ${globalAgentRegistry.size} agents`);
  } catch (error) {
    console.error('Failed to initialize agent registry:', error);
    // Continue without agents rather than failing completely
    globalAgentRegistry = new Map();
    agentCategories = {};
    qaIssues = [
      {
        severity: 'error',
        type: 'registry_failure',
        agentId: null,
        file: null,
        message: `Registry initialization failed: ${error.message}`,
        remediation: 'Check agent files and registry configuration',
      },
    ];
  }

  const server = new McpServer({ name: 'codeflow-tools', version: '0.2.1' });

  const transport = new StdioServerTransport();

  const toolEntries = await buildTools();
  const commandSlugToPath = new Map();

  // Register agent file access validation tool
  server.registerTool(
    'validate_agent_file_access',
    {
      title: 'validate_agent_file_access',
      description:
        'Validate if an agent has access to a specific file path based on its allowed directories',
    },
    async (args = {}) => {
      const agentName = (args.agentName || '').toString().trim();
      const filePath = (args.filePath || '').toString().trim();

      if (!agentName || !filePath) {
        return {
          content: [{ type: 'text', text: "Error: 'agentName' and 'filePath' are required" }],
        };
      }

      try {
        await checkAgentFileAccess(agentName, filePath);
        return {
          content: [{ type: 'text', text: `✅ Agent '${agentName}' has access to '${filePath}'` }],
        };
      } catch (error) {
        return {
          content: [{ type: 'text', text: `❌ ${error.message}` }],
        };
      }
    }
  );

  // Register registry QA tool
  server.registerTool(
    'codeflow.registry.qa',
    {
      title: 'codeflow.registry.qa',
      description:
        'Get comprehensive QA report for the agent registry including validation issues, duplicates, and conflicts',
    },
    async (args = {}) => {
      const includeDetails = args.includeDetails === true;

      const counts = {
        total: qaIssues.length,
        errors: qaIssues.filter((i) => i.severity === 'error').length,
        warnings: qaIssues.filter((i) => i.severity === 'warning').length,
      };

      const summary = `Registry QA Report: ${counts.total} issues (${counts.errors} errors, ${counts.warnings} warnings)`;

      if (!includeDetails) {
        return {
          content: [
            { type: 'text', text: `${summary}\n\nUse includeDetails=true for full report.` },
          ],
        };
      }

      const issuesByType = {};
      qaIssues.forEach((issue) => {
        if (!issuesByType[issue.type]) {
          issuesByType[issue.type] = [];
        }
        issuesByType[issue.type].push(issue);
      });

      let details = `${summary}\n\nIssues by type:\n`;
      for (const [type, issues] of Object.entries(issuesByType)) {
        details += `- ${type}: ${issues.length} issues\n`;
      }

      if (qaIssues.length > 0) {
        details += `\nTop issues:\n`;
        qaIssues.slice(0, 10).forEach((issue, index) => {
          details += `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.type}: ${issue.message}\n`;
          if (issue.agentId) details += `   Agent: ${issue.agentId}\n`;
          if (issue.file) details += `   File: ${issue.file}\n`;
          if (issue.remediation) details += `   Fix: ${issue.remediation}\n`;
          details += '\n';
        });
      }

      return {
        content: [
          { type: 'text', text: details },
          { type: 'json', value: { summary, counts, issues: qaIssues } },
        ],
      };
    }
  );

  // Register each core workflow command with agent context
  for (const entry of toolEntries) {
    server.registerTool(
      entry.id,
      {
        title: entry.id,
        description: entry.description + ' (Enhanced with agent orchestration capabilities)',
      },
      async (_args = {}) => {
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
    } catch {} // Ignore stdin setup errors
    try {
      process.stdin.on('end', onClose);
      process.stdin.on('close', onClose);
    } catch {} // Ignore stdin event setup errors
    try {
      process.on('SIGINT', onClose);
      process.on('SIGTERM', onClose);
    } catch {} // Ignore signal setup errors
  });
}

run().catch((err) => {
  console.error('Codeflow MCP server failed:', err);
  process.exit(1);
});
