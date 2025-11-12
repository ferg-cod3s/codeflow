import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { existsSync } from 'node:fs';
import crypto from 'node:crypto';
import YAML from 'yaml';

/**
 * Internal Agent Registry for MCP Server
 *
 * Loads and registers agents from priority directories without exposing them as MCP tools.
 * Agents are used internally by commands to orchestrate complex workflows.
 */

/**
 * Normalize permissions for MCP internal use (convert strings to booleans)
 */
function normalizePermissionsForMCP(permissions) {
  if (!permissions) return undefined;

  const normalized = {};
  for (const [key, value] of Object.entries(permissions)) {
    if (typeof value === 'string') {
      // Convert OpenCode string format to boolean for MCP use
      normalized[key] = value === 'allow';
    } else {
      // Already boolean or other format
      normalized[key] = Boolean(value);
    }
  }
  return normalized;
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content) {
  const lines = content.split('\n');
  const yamlStart = lines.findIndex((line) => line.trim() === '---');
  const yamlEnd = lines.findIndex((line, index) => index > yamlStart && line.trim() === '---');

  if (yamlStart === -1 || yamlEnd === -1) {
    throw new Error('Invalid frontmatter: Missing --- delimiters');
  }

  const yamlContent = lines.slice(yamlStart + 1, yamlEnd).join('\n');
  const bodyContent = lines
    .slice(yamlEnd + 1)
    .join('\n')
    .trim();

  try {
    const frontmatter = YAML.parse(yamlContent);

    // Validate required fields
    if (!frontmatter.description && !frontmatter.name) {
      throw new Error('Missing required field: description or name');
    }

    // Handle tools: undefined case
    if (frontmatter.tools === 'undefined' || frontmatter.tools === undefined) {
      frontmatter.tools = {};
    }

    return {
      frontmatter,
      content: bodyContent,
    };
  } catch (error) {
    throw new Error(`YAML parsing error: ${error.message}`);
  }
}

/**
 * Parse an agent file and return agent object
 */
async function parseAgentFile(filePath, format) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, content: body } = parseFrontmatter(content);

    // Enhanced validation with detailed error messages
    const errors = [];
    const warnings = [];

    // Required fields validation
    if (!frontmatter.description && !frontmatter.name) {
      errors.push(`Missing required field 'description' or 'name' in ${path.basename(filePath)}`);
    }

    // Only warn about missing model for OpenCode format - Claude Code agents don't need models
    if (!frontmatter.model && format === 'opencode') {
      warnings.push(`Missing 'model' field in ${path.basename(filePath)}, model will be undefined`);
    }

    // Tools validation - tools is now authoritative
    if (frontmatter.tools === undefined || frontmatter.tools === null) {
      frontmatter.tools = {};
      warnings.push(
        `Missing 'tools' field in ${path.basename(filePath)}, defaulting to empty object`
      );
    }

    // Validate tools format based on agent format
    if (frontmatter.tools) {
      if (format === 'claude-code') {
        // Claude Code format: tools should be a string
        if (typeof frontmatter.tools !== 'string') {
          errors.push(
            `Invalid tools configuration in ${path.basename(filePath)}: Claude Code format expects string, got ${typeof frontmatter.tools}`
          );
        }
      } else {
        // Base and OpenCode formats: tools should be an object
        if (typeof frontmatter.tools !== 'object' || Array.isArray(frontmatter.tools)) {
          errors.push(
            `Invalid tools configuration in ${path.basename(filePath)}: expected object, got ${typeof frontmatter.tools}`
          );
        } else {
          // Validate filesystem tools configuration
          if (frontmatter.tools.filesystem) {
            const fsTools = frontmatter.tools.filesystem;
            if (typeof fsTools !== 'object') {
              errors.push(
                `Invalid filesystem tools in ${path.basename(filePath)}: expected object`
              );
            } else {
              // If write is enabled, allowed_directories must be present
              if (fsTools.write === true) {
                if (
                  !frontmatter.allowed_directories ||
                  frontmatter.allowed_directories.length === 0
                ) {
                  errors.push(
                    `Filesystem write enabled but no allowed_directories specified in ${path.basename(filePath)}`
                  );
                }
              }
              // Validate allowed_directories format
              if (frontmatter.allowed_directories) {
                if (!Array.isArray(frontmatter.allowed_directories)) {
                  errors.push(
                    `Invalid allowed_directories in ${path.basename(filePath)}: expected array, got ${typeof frontmatter.allowed_directories}`
                  );
                } else {
                  // Check for relative paths within repo
                  frontmatter.allowed_directories.forEach((dir, index) => {
                    if (typeof dir !== 'string') {
                      errors.push(
                        `Invalid allowed_directories[${index}] in ${path.basename(filePath)}: expected string, got ${typeof dir}`
                      );
                    }
                  });
                }
              }
            }
          }
        }
      }
    }

    // Mode validation
    if (frontmatter.mode && !['subagent', 'primary', 'all'].includes(frontmatter.mode)) {
      errors.push(
        `Invalid mode '${frontmatter.mode}' in ${path.basename(filePath)}: expected 'subagent', 'primary', or 'all'`
      );
    }

    // Temperature validation
    if (frontmatter.temperature !== undefined) {
      if (
        typeof frontmatter.temperature !== 'number' ||
        frontmatter.temperature < 0 ||
        frontmatter.temperature > 2
      ) {
        errors.push(
          `Invalid temperature '${frontmatter.temperature}' in ${path.basename(filePath)}: expected number between 0-2`
        );
      }
    }

    if (errors.length > 0) {
      console.error(
        `❌ Validation errors in ${filePath}:\n${errors.map((e) => `  - ${e}`).join('\n')}`
      );
      throw new Error(`Validation failed for ${filePath}: ${errors.length} errors`);
    }

    if (warnings.length > 0) {
      console.warn(
        `⚠️ Validation warnings in ${filePath}:\n${warnings.map((w) => `  - ${w}`).join('\n')}`
      );
    }

    const name = path.basename(filePath, '.md');

    // Derive permission summary from tools (tools is authoritative)
    let permissionSummary = 'none';
    if (frontmatter.tools) {
      const scopes = [];
      if (typeof frontmatter.tools === 'object') {
        if (frontmatter.tools.filesystem) {
          const fs = frontmatter.tools.filesystem;
          if (fs.read) scopes.push('fs:read');
          if (fs.write) scopes.push('fs:write');
        }
        if (frontmatter.tools.http && frontmatter.tools.http.enabled) {
          scopes.push('http');
        }
        if (frontmatter.tools.bash) scopes.push('bash');
        if (frontmatter.tools.edit) scopes.push('edit');
        if (frontmatter.tools.webfetch) scopes.push('webfetch');
      } else if (typeof frontmatter.tools === 'string') {
        // Claude Code format
        const toolsList = frontmatter.tools.split(',').map((t) => t.trim());
        if (
          toolsList.includes('read') ||
          toolsList.includes('grep') ||
          toolsList.includes('glob') ||
          toolsList.includes('list')
        ) {
          scopes.push('fs:read');
        }
        if (toolsList.includes('edit')) scopes.push('fs:write');
        if (toolsList.includes('bash')) scopes.push('bash');
        if (toolsList.includes('webfetch')) scopes.push('webfetch');
      }
      permissionSummary = scopes.length > 0 ? scopes.join('; ') : 'none';
    }

    // Normalize permissions for internal MCP use (convert strings to booleans)
    // If no permission field exists but tools field exists, convert tools to permissions
    let permissionToNormalize = frontmatter.permission;
    if (!permissionToNormalize && frontmatter.tools) {
      // Convert tools object to permission format
      permissionToNormalize = {};
      if (typeof frontmatter.tools === 'object') {
        // Object format: { filesystem: { read: true }, bash: true, ... }
        if (frontmatter.tools.filesystem) {
          permissionToNormalize.read = frontmatter.tools.filesystem.read;
          permissionToNormalize.edit = frontmatter.tools.filesystem.write;
        }
        permissionToNormalize.bash = frontmatter.tools.bash;
        permissionToNormalize.webfetch = frontmatter.tools.webfetch;
        if (frontmatter.tools.http) {
          permissionToNormalize.webfetch = frontmatter.tools.http.enabled;
        }
      } else if (typeof frontmatter.tools === 'string') {
        // Comma-separated string format: "read, grep, glob, list"
        const toolsList = frontmatter.tools.split(',').map((t) => t.trim());
        permissionToNormalize.read = toolsList.some((t) =>
          ['read', 'grep', 'glob', 'list'].includes(t)
        );
        permissionToNormalize.edit = toolsList.includes('edit');
        permissionToNormalize.bash = toolsList.includes('bash');
        permissionToNormalize.webfetch = toolsList.includes('webfetch');
      }
    }

    const normalizedPermissions = normalizePermissionsForMCP(permissionToNormalize);

    const agent = {
      id: name,
      name,
      format,
      description: frontmatter.description || frontmatter.name || '',
      model: frontmatter.model,
      temperature: frontmatter.temperature || 0.3,
      tools: frontmatter.tools || {},
      mode: frontmatter.mode || 'subagent',
      allowedDirectories: frontmatter.allowed_directories || [],
      permission: normalizedPermissions,
      permissionSummary,
      context: body,
      filePath,
      frontmatter,
    };

    // Log permission configuration for debugging
    if (frontmatter.permission) {
      console.log(
        `🔐 Agent '${name}' permissions: edit=${frontmatter.permission.edit}, bash=${frontmatter.permission.bash}, webfetch=${frontmatter.permission.webfetch}`
      );
    }
    if (agent.allowedDirectories.length > 0) {
      console.log(`📁 Agent '${name}' allowed directories: ${agent.allowedDirectories.join(', ')}`);
    }

    return agent;
  } catch (error) {
    console.error(`❌ Failed to parse agent file ${filePath}: ${error.message}`);
    throw error;
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
      .filter(
        (e) => e.isFile() && e.name.toLowerCase().endsWith('.md') && !e.name.startsWith('README')
      )
      .map((e) => path.join(directory, e.name));

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
 * Normalize agent core fields for duplicate detection and hashing
 */
function normalizeAgentForHashing(agent) {
  return {
    model: agent.model,
    tools: agent.tools || {},
    allowed_directories: agent.allowedDirectories || [],
    inputs: agent.inputs || {},
    outputs: agent.outputs || {},
  };
}

/**
 * Generate hash for normalized agent data
 */
function hashAgentData(normalizedData) {
  const dataString = JSON.stringify(normalizedData, Object.keys(normalizedData).sort());
  return crypto.createHash('sha256').update(dataString).digest('hex');
}

/**
 * Build the complete agent registry from all priority directories
 *
 * Priority order (later directories override earlier ones):
 * 1. Canonical global base agents (base-agents/**)
 * 2. Runtime OpenCode agents (.opencode/agent/)
 * 3. Legacy agents (deprecated/**) - only if CODEFLOW_INCLUDE_LEGACY=1
 * 4. Global user agents
 * 5. Project-specific agents
 */
async function buildAgentRegistry() {
  const agents = new Map();
  const cwd = process.cwd();
  const codeflowRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
  const includeLegacy = process.env.CODEFLOW_INCLUDE_LEGACY === '1';

  // Define agent directories in priority order (lower priority first)
  const agentDirs = [
    // Canonical global base agents (lowest priority)
    { dir: path.join(codeflowRoot, 'base-agents'), format: 'base', category: 'canonical' },
    { dir: path.join(codeflowRoot, '.opencode', 'agent'), format: 'opencode', category: 'canonical' },

    // Legacy agents (conditionally included)
    ...(includeLegacy
      ? [
          {
            dir: path.join(codeflowRoot, 'deprecated', 'claude-agents'),
            format: 'claude-code',
            category: 'legacy',
          },
          {
            dir: path.join(codeflowRoot, 'deprecated', 'opencode-agents'),
            format: 'opencode',
            category: 'legacy',
          },
        ]
      : []),

    // Global user agents (medium priority)
    { dir: path.join(os.homedir(), '.codeflow', 'agents'), format: 'base', category: 'user' },
    { dir: path.join(os.homedir(), '.claude', 'agents'), format: 'claude-code', category: 'user' },
    {
      dir: path.join(os.homedir(), '.config', 'opencode', 'agent'),
      format: 'opencode',
      category: 'user',
    },

    // Project-specific agents (highest priority)
    { dir: path.join(cwd, '.claude', 'agents'), format: 'claude-code', category: 'project' },
    {
      dir: path.join(cwd, '.config', 'opencode', 'agent'),
      format: 'opencode',
      category: 'project',
    },
    { dir: path.join(cwd, '.opencode', 'agent'), format: 'opencode', category: 'project' },
  ];

  let totalAgents = 0;
  let failedAgents = 0;
  let duplicateWarnings = 0;
  let canonicalConflicts = 0;

  // Track agent hashes for duplicate detection
  const agentHashes = new Map(); // agentId -> { hash, filePath, category }
  const qaIssues = [];

  for (const { dir, format, category } of agentDirs) {
    const agentFiles = await loadAgentFiles(dir, format);

    for (const agentFile of agentFiles) {
      try {
        const normalizedData = normalizeAgentForHashing(agentFile);
        const hash = hashAgentData(normalizedData);
        const existing = agentHashes.get(agentFile.id);

        if (existing) {
          // Duplicate found - handle per policy
          if (category === 'canonical' && existing.category === 'canonical') {
            // Canonical conflict - fail
            if (existing.hash !== hash) {
              console.error(`❌ Canonical conflict for agent '${agentFile.id}':`);
              console.error(
                `   Existing: ${existing.filePath} (hash: ${existing.hash.slice(0, 8)}...)`
              );
              console.error(`   New: ${agentFile.filePath} (hash: ${hash.slice(0, 8)}...)`);
              qaIssues.push({
                severity: 'error',
                type: 'duplicate_conflict',
                agentId: agentFile.id,
                file: agentFile.filePath,
                message: `Canonical agent conflict: different definitions found`,
                remediation: 'Resolve conflicting agent definitions in canonical directories',
              });
              canonicalConflicts++;
              failedAgents++;
              continue;
            }
          } else if (category === 'legacy' || existing.category === 'legacy') {
            // Legacy duplicate - warn and prefer canonical
            console.warn(`⚠️ Legacy duplicate for agent '${agentFile.id}':`);
            console.warn(`   Canonical: ${existing.filePath}`);
            console.warn(`   Legacy: ${agentFile.filePath}`);
            qaIssues.push({
              severity: 'warning',
              type: 'duplicate_legacy',
              agentId: agentFile.id,
              file: agentFile.filePath,
              message: `Legacy duplicate found, using canonical version`,
              remediation: 'Remove or migrate legacy agent definition',
            });
            duplicateWarnings++;
            // Skip legacy version, keep canonical
            continue;
          }
        } else {
          // First occurrence
          agentHashes.set(agentFile.id, { hash, filePath: agentFile.filePath, category });
        }

        agents.set(agentFile.id, agentFile);
        totalAgents++;
      } catch (error) {
        console.warn(`Failed to register agent ${agentFile.id}: ${error.message}`);
        qaIssues.push({
          severity: 'error',
          type: 'parse_error',
          agentId: agentFile.id,
          file: agentFile.filePath,
          message: `Failed to parse agent: ${error.message}`,
          remediation: 'Fix agent file format and frontmatter',
        });
        failedAgents++;
      }
    }
  }

  console.log(
    `Agent registry built: ${totalAgents} agents loaded${failedAgents > 0 ? `, ${failedAgents} failed` : ''}${duplicateWarnings > 0 ? `, ${duplicateWarnings} legacy duplicates` : ''}${canonicalConflicts > 0 ? `, ${canonicalConflicts} canonical conflicts` : ''}`
  );

  if (canonicalConflicts > 0) {
    throw new Error(
      `Registry build failed: ${canonicalConflicts} canonical agent conflicts detected`
    );
  }

  // Return both agents and QA data
  return { agents, qaIssues };
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
    specialized: [],
  };

  for (const [id] of registry) {
    if (id.includes('codebase-')) {
      categories.codebase.push(id);
    } else if (id.includes('thoughts-') || id.includes('web-search-')) {
      categories.research.push(id);
    } else if (id.includes('operations-')) {
      categories.operations.push(id);
    } else if (id.includes('development-')) {
      categories.development.push(id);
    } else if (id.includes('quality-testing-')) {
      categories.testing.push(id);
    } else if (id.includes('business-analytics-')) {
      categories.business.push(id);
    } else if (id.includes('design-ux-')) {
      categories.design.push(id);
    } else if (id.includes('product-strategy-')) {
      categories.business.push(id);
    } else if (id.includes('ai-integration') || id.includes('programmatic-seo')) {
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
    {
      keywords: ['find', 'locate', 'where', 'search'],
      agents: ['codebase-locator', 'research-locator'],
    },
    {
      keywords: ['analyze', 'understand', 'how', 'explain'],
      agents: ['codebase-analyzer', 'research-analyzer'],
    },
    { keywords: ['pattern', 'similar', 'example'], agents: ['codebase-pattern-finder'] },
    { keywords: ['research', 'investigate', 'web'], agents: ['web-search-researcher'] },
    {
      keywords: ['database', 'migration', 'schema'],
      agents: ['development-migrations-specialist', 'database-expert'],
    },
    {
      keywords: ['performance', 'slow', 'optimize'],
      agents: ['quality-testing-performance-tester'],
    },
    { keywords: ['security', 'vulnerability', 'audit'], agents: ['security-scanner'] },
    { keywords: ['incident', 'outage', 'emergency'], agents: ['operations-incident-commander'] },
    { keywords: ['seo', 'content', 'programmatic'], agents: ['programmatic-seo-engineer'] },
    { keywords: ['localization', 'i18n', 'l10n'], agents: ['content-localization-coordinator'] },
  ];

  for (const { keywords, agents } of patterns) {
    if (keywords.some((keyword) => task.includes(keyword))) {
      for (const agentId of agents) {
        if (registry.has(agentId) && !suggestions.includes(agentId)) {
          suggestions.push(agentId);
        }
      }
    }
  }

  return suggestions.slice(0, 5); // Limit to top 5 suggestions
}

export { buildAgentRegistry, categorizeAgents, suggestAgents, parseAgentFile, loadAgentFiles };
