import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { existsSync } from "node:fs";

/**
 * Internal Agent Registry for MCP Server
 * 
 * Loads and registers agents from priority directories without exposing them as MCP tools.
 * Agents are used internally by commands to orchestrate complex workflows.
 */

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content) {
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
    
    if (trimmedLine === '') continue;
    
    // Handle tools section specially
    if (trimmedLine === 'tools:') {
      inTools = true;
      frontmatter.tools = {};
      toolsIndentLevel = line.indexOf('tools:');
      continue;
    }
    
    if (inTools) {
      const indentLevel = line.length - line.trimLeft().length;
      
      // Exit tools section if we're back to the same or lesser indentation
      if (indentLevel <= toolsIndentLevel && trimmedLine !== '') {
        inTools = false;
      } else if (trimmedLine.includes(':')) {
        const [key, value] = trimmedLine.split(':').map(s => s.trim());
        frontmatter.tools[key] = value === 'true' ? true : value === 'false' ? false : value;
        continue;
      }
    }
    
    if (!inTools && trimmedLine.includes(':')) {
      const colonIndex = trimmedLine.indexOf(':');
      const key = trimmedLine.substring(0, colonIndex).trim();
      let value = trimmedLine.substring(colonIndex + 1).trim();
      
      // Handle different value types
      if (value === 'true' || value === 'false') {
        frontmatter[key] = value === 'true';
      } else if (!isNaN(Number(value)) && value !== '' && !value.includes('/')) {
        // Don't convert model names like "github-copilot/gpt-5" to numbers
        frontmatter[key] = Number(value);
      } else if (value.startsWith('"') && value.endsWith('"')) {
        frontmatter[key] = value.slice(1, -1);
      } else if (key === 'temperature' && !isNaN(Number(value)) && value !== '') {
        // Explicitly handle temperature as number
        frontmatter[key] = Number(value);
      } else {
        frontmatter[key] = value;
      }
    }
  }
  
  return {
    frontmatter,
    body: bodyLines.join('\n').trim()
  };
}

/**
 * Parse an agent file and return agent object
 */
async function parseAgentFile(filePath, format) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, body } = parseFrontmatter(content);
    
    // Validate required fields
    if (!frontmatter.description) {
      throw new Error('Agent must have a description field');
    }
    
    const name = path.basename(filePath, '.md');
    
    return {
      id: name,
      name,
      format,
      description: frontmatter.description,
      model: frontmatter.model || 'claude-3-5-sonnet-20241022',
      temperature: frontmatter.temperature || 0.3,
      tools: frontmatter.tools || {},
      mode: frontmatter.mode || 'subagent',
      context: body,
      filePath,
      frontmatter
    };
  } catch (error) {
    console.warn(`Failed to parse agent file ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Load agent files from a directory
 */
async function loadAgentFiles(directory, format = 'base') {
  const agents = [];
  
  if (!existsSync(directory)) {
    return agents;
  }
  
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    const mdFiles = entries
      .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.md') && !e.name.startsWith('README'))
      .map(e => path.join(directory, e.name));
    
    for (const filePath of mdFiles) {
      const agent = await parseAgentFile(filePath, format);
      if (agent) {
        agents.push(agent);
      }
    }
  } catch (error) {
    console.warn(`Failed to load agents from directory ${directory}: ${error.message}`);
  }
  
  return agents;
}

/**
 * Build the complete agent registry from all priority directories
 * 
 * Priority order (later directories override earlier ones):
 * 1. Global codeflow agents
 * 2. Global user agents  
 * 3. Project-specific Claude agents
 * 4. Project-specific OpenCode agents
 */
async function buildAgentRegistry() {
  const agents = new Map();
  const cwd = process.cwd();
  const codeflowRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
  
  // Define agent directories in priority order (lower priority first)
  const agentDirs = [
    // Global codeflow agents (lowest priority)
    { dir: path.join(codeflowRoot, "agent"), format: 'base' },
    { dir: path.join(codeflowRoot, "claude-agents"), format: 'claude-code' },
    { dir: path.join(codeflowRoot, "opencode-agents"), format: 'opencode' },
    
    // Global user agents (medium priority)
    { dir: path.join(os.homedir(), ".claude", "agents"), format: 'claude-code' },
    { dir: path.join(os.homedir(), ".config", "opencode", "agent"), format: 'opencode' },
    
    // Project-specific agents (highest priority)
    { dir: path.join(cwd, ".claude", "agents"), format: 'claude-code' },
    { dir: path.join(cwd, ".config", "opencode", "agent"), format: 'opencode' }
  ];
  
  let totalAgents = 0;
  let failedAgents = 0;
  
  for (const { dir, format } of agentDirs) {
    const agentFiles = await loadAgentFiles(dir, format);
    
    for (const agent of agentFiles) {
      try {
        agents.set(agent.id, agent);
        totalAgents++;
      } catch (error) {
        console.warn(`Failed to register agent ${agent.id}: ${error.message}`);
        failedAgents++;
      }
    }
  }
  
  console.log(`Agent registry built: ${totalAgents} agents loaded${failedAgents > 0 ? `, ${failedAgents} failed` : ''}`);
  
  return agents;
}

/**
 * Get available agent IDs by category
 */
function categorizeAgents(registry) {
  const categories = {
    codebase: [],
    research: [],
    planning: [],
    development: [],
    testing: [],
    operations: [],
    business: [],
    design: [],
    specialized: []
  };
  
  for (const [id, agent] of registry) {
    if (id.includes('codebase-')) {
      categories.codebase.push(id);
    } else if (id.includes('thoughts-') || id.includes('web-search-')) {
      categories.research.push(id);
    } else if (id.includes('operations_')) {
      categories.operations.push(id);
    } else if (id.includes('development_')) {
      categories.development.push(id);
    } else if (id.includes('quality-testing_')) {
      categories.testing.push(id);
    } else if (id.includes('business-analytics_')) {
      categories.business.push(id);
    } else if (id.includes('design-ux_')) {
      categories.design.push(id);
    } else if (id.includes('product-strategy_')) {
      categories.business.push(id);
    } else if (id.includes('ai-integration') || id.includes('programmatic_seo')) {
      categories.specialized.push(id);
    } else {
      categories.development.push(id);
    }
  }
  
  return categories;
}

/**
 * Get agent suggestions based on task description
 */
function suggestAgents(registry, taskDescription) {
  const task = taskDescription.toLowerCase();
  const suggestions = [];
  
  // Common patterns for agent selection
  const patterns = [
    { keywords: ['find', 'locate', 'where', 'search'], agents: ['codebase-locator', 'thoughts-locator'] },
    { keywords: ['analyze', 'understand', 'how', 'explain'], agents: ['codebase-analyzer', 'thoughts-analyzer'] },
    { keywords: ['pattern', 'similar', 'example'], agents: ['codebase-pattern-finder'] },
    { keywords: ['research', 'investigate', 'web'], agents: ['web-search-researcher'] },
    { keywords: ['database', 'migration', 'schema'], agents: ['development_migrations_specialist', 'database-expert'] },
    { keywords: ['performance', 'slow', 'optimize'], agents: ['quality-testing_performance_tester'] },
    { keywords: ['security', 'vulnerability', 'audit'], agents: ['security-scanner'] },
    { keywords: ['incident', 'outage', 'emergency'], agents: ['operations_incident_commander'] },
    { keywords: ['seo', 'content', 'programmatic'], agents: ['programmatic_seo_engineer'] },
    { keywords: ['localization', 'i18n', 'l10n'], agents: ['content_localization_coordinator'] }
  ];
  
  for (const { keywords, agents } of patterns) {
    if (keywords.some(keyword => task.includes(keyword))) {
      for (const agentId of agents) {
        if (registry.has(agentId) && !suggestions.includes(agentId)) {
          suggestions.push(agentId);
        }
      }
    }
  }
  
  return suggestions.slice(0, 5); // Limit to top 5 suggestions
}

export {
  buildAgentRegistry,
  categorizeAgents,
  suggestAgents,
  parseAgentFile,
  loadAgentFiles
};