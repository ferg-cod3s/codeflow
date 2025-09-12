import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { existsSync } from 'node:fs';

/**
 * MCP-Specific Agent Registry
 *
 * Separate agent registry for MCP server with its own format and directory structure.
 * This allows MCP to have different YAML frontmatter and organization than Claude Code or OpenCode.
 */

/**
 * Parse YAML frontmatter from markdown content (MCP format)
 */
function parseMcpFrontmatter(content) {
  const lines = content.split('\n');

  // Check if file starts with frontmatter delimiter
  if (lines[0] !== '---') {
    throw new Error('File does not start with YAML frontmatter');
  }

  // Find end of frontmatter
  let frontmatterEndIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      frontmatterEndIndex = i;
      break;
    }
  }

  if (frontmatterEndIndex === -1) {
    throw new Error('Could not find end of YAML frontmatter');
  }

  // Extract frontmatter and body
  const frontmatterLines = lines.slice(1, frontmatterEndIndex);
  const bodyLines = lines.slice(frontmatterEndIndex + 1);

  // Parse YAML frontmatter manually (simple key-value pairs)
  const frontmatter = {};
  let currentKey = '';
  let currentValue = '';
  let inTools = false;
  let toolsIndentLevel = 0;

  for (let i = 0; i < frontmatterLines.length; i++) {
    const line = frontmatterLines[i];
    const trimmedLine = line.trim();

    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      continue; // Skip empty lines and comments
    }

    // Handle tools section specially
    if (line.startsWith('tools:')) {
      inTools = true;
      toolsIndentLevel = line.length - line.trimLeft().length;
      frontmatter.tools = {};
      continue;
    }

    if (inTools) {
      const currentIndent = line.length - line.trimLeft().length;
      if (currentIndent <= toolsIndentLevel && line.includes(':')) {
        inTools = false;
      } else if (line.includes(':')) {
        const [key, value] = line.split(':').map((s) => s.trim());
        if (key && value) {
          frontmatter.tools[key] = value === 'true';
        }
        continue;
      }
    }

    if (!inTools && line.includes(':')) {
      const colonIndex = line.indexOf(':');
      currentKey = line.substring(0, colonIndex).trim();
      currentValue = line.substring(colonIndex + 1).trim();

      // Handle multi-line values starting with |
      if (currentValue === '|') {
        currentValue = '';
        // Collect following indented lines
        for (let j = i + 1; j < frontmatterLines.length; j++) {
          const nextLine = frontmatterLines[j];
          if (nextLine.trim() === '' || nextLine.startsWith('  ')) {
            currentValue += (currentValue ? '\n' : '') + nextLine.substring(2);
            i = j; // Skip processed lines
          } else {
            break;
          }
        }
      }

      frontmatter[currentKey] = currentValue;
    }
  }

  return {
    frontmatter,
    body: bodyLines.join('\n').trim(),
  };
}

/**
 * Parse MCP agent file
 */
async function parseMcpAgentFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, body } = parseMcpFrontmatter(content);

    // Validate required fields
    if (!frontmatter.description) {
      throw new Error('Agent must have a description field');
    }

    const name = path.basename(filePath, '.md');

    return {
      id: name,
      name,
      format: 'mcp',
      description: frontmatter.description,
      model: frontmatter.model,
      temperature: frontmatter.temperature || 0.3,
      tools: frontmatter.tools || {},
      mode: frontmatter.mode || 'subagent',
      category: frontmatter.category || 'general',
      tags: frontmatter.tags || [],
      context: body,
      filePath,
      frontmatter,
    };
  } catch (error) {
    console.warn(`Failed to parse MCP agent file ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Load MCP agent files from a directory (supports subdirectories)
 */
async function loadMcpAgentFiles(directory) {
  const agents = [];

  if (!existsSync(directory)) {
    return agents;
  }

  async function loadFromDir(dir, categoryPrefix = '') {
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Recursively load from subdirectories
          const subCategory = categoryPrefix ? `${categoryPrefix}/${entry.name}` : entry.name;
          const subAgents = await loadFromDir(fullPath, subCategory);
          agents.push(...subAgents);
        } else if (
          entry.isFile() &&
          entry.name.toLowerCase().endsWith('.md') &&
          !entry.name.startsWith('README')
        ) {
          const agent = await parseMcpAgentFile(fullPath);
          if (agent) {
            // Add category based on directory structure
            if (categoryPrefix) {
              agent.category = categoryPrefix;
            }
            agents.push(agent);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to load MCP agents from directory ${dir}: ${error.message}`);
    }
  }

  await loadFromDir(directory);
  return agents;
}

/**
 * Build the MCP agent registry from priority directories
 *
 * Priority order (later directories override earlier ones):
 * 1. Codeflow MCP agents
 * 2. Global user MCP agents
 * 3. Project-specific MCP agents
 */
async function buildMcpAgentRegistry() {
  const agents = new Map();
  const cwd = process.cwd();
  const codeflowRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

  // Define MCP agent directories in priority order (lower priority first)
  const mcpAgentDirs = [
    // Codeflow MCP agents (lowest priority)
    { dir: path.join(codeflowRoot, 'codeflow-agents'), label: 'Codeflow Agents' },

    // Global user MCP agents (medium priority)
    { dir: path.join(os.homedir(), '.codeflow', 'agents'), label: 'Global User MCP Agents' },

    // Project-specific MCP agents (highest priority)
    { dir: path.join(cwd, '.codeflow', 'agents'), label: 'Project MCP Agents' },
  ];

  let totalAgents = 0;
  let failedAgents = 0;

  for (const { dir, label } of mcpAgentDirs) {
    const agentFiles = await loadMcpAgentFiles(dir);

    for (const agent of agentFiles) {
      try {
        agents.set(agent.id, agent);
        totalAgents++;
      } catch (error) {
        console.warn(`Failed to register MCP agent ${agent.id}: ${error.message}`);
        failedAgents++;
      }
    }

    if (agentFiles.length > 0) {
      console.log(`Loaded ${agentFiles.length} MCP agents from ${label}`);
    }
  }

  console.log(`MCP Agent Registry: ${totalAgents} total agents loaded, ${failedAgents} failed`);
  return agents;
}

/**
 * Categorize MCP agents by their category field
 */
function categorizeMcpAgents(agents) {
  const categories = new Map();

  for (const [id, agent] of agents) {
    const category = agent.category || 'general';
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category).push(agent);
  }

  return categories;
}

/**
 * Suggest relevant MCP agents based on task description
 */
function suggestMcpAgents(agents, taskDescription, maxSuggestions = 5) {
  const suggestions = [];
  const taskLower = taskDescription.toLowerCase();

  for (const [id, agent] of agents) {
    let score = 0;

    // Score based on description relevance
    if (agent.description.toLowerCase().includes(taskLower)) {
      score += 10;
    }

    // Score based on category relevance
    if (agent.category && taskLower.includes(agent.category)) {
      score += 5;
    }

    // Score based on tags
    for (const tag of agent.tags) {
      if (taskLower.includes(tag.toLowerCase())) {
        score += 3;
      }
    }

    if (score > 0) {
      suggestions.push({ agent, score });
    }
  }

  // Sort by score and return top suggestions
  return suggestions
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSuggestions)
    .map((s) => s.agent);
}

export {
  buildMcpAgentRegistry,
  categorizeMcpAgents,
  suggestMcpAgents,
  parseMcpAgentFile,
  loadMcpAgentFiles,
};
