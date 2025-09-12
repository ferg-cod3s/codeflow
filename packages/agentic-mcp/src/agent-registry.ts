#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { existsSync } from 'node:fs';

/**
 * Internal Agent Registry for NPM MCP Server
 *
 * Privacy-safe agent registry that loads built-in templates and project-specific agents
 * without exposing sensitive information or personal data.
 */

export interface Agent {
  id: string;
  name: string;
  format: 'base' | 'claude-code' | 'opencode';
  description: string;
  model?: string;
  temperature?: number;
  tools?: Record<string, boolean>;
  mode?: 'subagent' | 'primary';
  context: string;
  filePath?: string;
  frontmatter?: any;
}

export interface AgentCategories {
  codebase: string[];
  research: string[];
  planning: string[];
  development: string[];
  testing: string[];
  operations: string[];
  business: string[];
  design: string[];
  specialized: string[];
}

/**
 * Built-in agent templates - generic and privacy-safe
 */
const BUILT_IN_AGENT_TEMPLATES: Partial<Agent>[] = [
  {
    id: 'codebase-locator',
    name: 'Codebase Locator',
    description: 'Finds and locates specific files, components, or code patterns within a codebase',
    model: 'github-copilot/gpt-4.1',
    temperature: 0.1,
    mode: 'subagent',
    format: 'base',
    context: `You are a specialized codebase locator agent. Your role is to help find specific files, components, functions, or patterns within codebases.

## Capabilities

- Search for specific functions, classes, or components
- Locate configuration files and documentation
- Find code patterns and architectural elements
- Identify related files and dependencies
- Discover test files and examples

## Guidelines

- Use available search tools to scan the codebase systematically
- Look for multiple variations of naming patterns
- Consider different file extensions and locations
- Check both source and test directories
- Provide specific file paths and line numbers when possible

## Output Format

Return findings as:
- **Files Found**: List of relevant file paths
- **Key Locations**: Specific functions/components with line numbers
- **Related Items**: Connected files or dependencies
- **Search Strategy**: Methods used to locate items`,
  },
  {
    id: 'codebase-analyzer',
    name: 'Codebase Analyzer',
    description: 'Analyzes and explains how specific code components work and their relationships',
    model: 'github-copilot/gpt-4.1',
    temperature: 0.2,
    mode: 'subagent',
    format: 'base',
    context: `You are a specialized codebase analyzer agent. Your role is to analyze and explain how code components work.

## Capabilities

- Explain code functionality and logic flow
- Analyze component relationships and dependencies
- Identify design patterns and architectural decisions
- Review code quality and potential issues
- Document API interfaces and data structures

## Guidelines

- Read and understand code before explaining
- Focus on the "how" and "why" of implementations
- Identify key algorithms and data flows
- Note important dependencies and interactions
- Explain complex logic in clear terms

## Output Format

Structure analysis as:
- **Purpose**: What the code does and why
- **Implementation**: How it works (key algorithms/patterns)
- **Dependencies**: What it relies on
- **Interface**: Public APIs and data structures
- **Notes**: Important details or potential concerns`,
  },
  {
    id: 'web-search-researcher',
    name: 'Web Search Researcher',
    description: 'Conducts targeted web research to gather information on specific topics',
    model: 'github-copilot/gpt-4.1',
    temperature: 0.3,
    mode: 'subagent',
    format: 'base',
    context: `You are a specialized web research agent. Your role is to conduct targeted research on specific topics using web search capabilities.

## Capabilities

- Research technical topics and best practices
- Find documentation and tutorials
- Investigate specific tools and libraries
- Discover solutions to common problems
- Gather information on industry standards

## Guidelines

- Use precise search terms and queries
- Focus on authoritative and recent sources
- Cross-reference information from multiple sources
- Prioritize official documentation and reputable sites
- Summarize findings clearly and concisely

## Output Format

Present research as:
- **Summary**: Key findings and insights
- **Sources**: Authoritative references found
- **Best Practices**: Recommended approaches
- **Examples**: Practical implementations or usage
- **Further Reading**: Additional resources for deeper understanding`,
  },
];

/**
 * Parse YAML frontmatter from markdown content (privacy-safe)
 */
function parseFrontmatterSafe(content: string): { frontmatter: any; body: string } {
  const lines = content.split('\n');

  if (lines[0] !== '---') {
    return { frontmatter: {}, body: content };
  }

  let frontmatterEndIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      frontmatterEndIndex = i;
      break;
    }
  }

  if (frontmatterEndIndex === -1) {
    return { frontmatter: {}, body: content };
  }

  const frontmatterLines = lines.slice(1, frontmatterEndIndex);
  const bodyLines = lines.slice(frontmatterEndIndex + 1);

  // Simple YAML parsing for basic agent properties
  const frontmatter: any = {};

  for (const line of frontmatterLines) {
    const trimmedLine = line.trim();
    if (trimmedLine === '' || !trimmedLine.includes(':')) continue;

    const colonIndex = trimmedLine.indexOf(':');
    const key = trimmedLine.substring(0, colonIndex).trim();
    let value = trimmedLine.substring(colonIndex + 1).trim();

    // Only parse safe, non-sensitive fields
    if (['description', 'model', 'temperature', 'mode'].includes(key)) {
      if (value === 'true' || value === 'false') {
        frontmatter[key] = value === 'true';
      } else if (!isNaN(Number(value)) && value !== '' && !value.includes('/')) {
        frontmatter[key] = Number(value);
      } else {
        frontmatter[key] = value.replace(/['"]/g, '');
      }
    }
  }

  return {
    frontmatter,
    body: bodyLines.join('\n').trim(),
  };
}

/**
 * Load built-in agent templates
 */
export function loadBuiltInAgents(): Map<string, Agent> {
  const agents = new Map<string, Agent>();

  for (const template of BUILT_IN_AGENT_TEMPLATES) {
    const agent: Agent = {
      id: template.id!,
      name: template.name!,
      format: template.format!,
      description: template.description!,
      model: template.model || 'model-not-specified',
      temperature: template.temperature || 0.3,
      tools: template.tools || {},
      mode: template.mode || 'subagent',
      context: template.context!,
    };

    agents.set(agent.id, agent);
  }

  return agents;
}

/**
 * Load project-specific agents (privacy-safe)
 */
export async function loadProjectAgents(): Promise<Map<string, Agent>> {
  const agents = new Map<string, Agent>();
  const cwd = process.cwd();

  // Only check project-specific locations to avoid accessing personal data
  const projectDirs = [path.join(cwd, '.opencode', 'agent'), path.join(cwd, '.claude', 'agents')];

  for (const dir of projectDirs) {
    if (!existsSync(dir)) continue;

    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const mdFiles = entries
        .filter(
          (e) => e.isFile() && e.name.toLowerCase().endsWith('.md') && !e.name.startsWith('README')
        )
        .map((e) => path.join(dir, e.name));

      for (const filePath of mdFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const { frontmatter, body } = parseFrontmatterSafe(content);

          if (!frontmatter.description) continue;

          const name = path.basename(filePath, '.md');
          const format = dir.includes('.opencode') ? 'opencode' : 'claude-code';

          const agent: Agent = {
            id: name,
            name: frontmatter.name || name,
            format: format as 'opencode' | 'claude-code',
            description: frontmatter.description,
            model: frontmatter.model || 'model-not-specified',
            temperature: frontmatter.temperature || 0.3,
            tools: frontmatter.tools || {},
            mode: frontmatter.mode || 'subagent',
            context: body,
            filePath,
          };

          agents.set(agent.id, agent);
        } catch (error) {
          // Skip invalid agent files silently
          console.warn(`Skipping invalid agent file: ${filePath}`);
        }
      }
    } catch (error) {
      // Directory access issues - skip silently
    }
  }

  return agents;
}

/**
 * Build complete agent registry (privacy-safe)
 */
export async function buildSafeAgentRegistry(): Promise<Map<string, Agent>> {
  const agents = new Map<string, Agent>();

  // Start with built-in templates
  const builtInAgents = loadBuiltInAgents();
  for (const [id, agent] of builtInAgents) {
    agents.set(id, agent);
  }

  // Override with project-specific agents
  const projectAgents = await loadProjectAgents();
  for (const [id, agent] of projectAgents) {
    agents.set(id, agent);
  }

  return agents;
}

/**
 * Categorize agents by domain
 */
export function categorizeAgents(registry: Map<string, Agent>): AgentCategories {
  const categories: AgentCategories = {
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
    } else if (id.includes('planning') || id.includes('orchestrator')) {
      categories.planning.push(id);
    } else if (id.includes('development_')) {
      categories.development.push(id);
    } else if (id.includes('testing') || id.includes('quality-')) {
      categories.testing.push(id);
    } else if (id.includes('operations_')) {
      categories.operations.push(id);
    } else if (id.includes('business-') || id.includes('analytics')) {
      categories.business.push(id);
    } else if (id.includes('design-') || id.includes('ux-')) {
      categories.design.push(id);
    } else {
      categories.specialized.push(id);
    }
  }

  return categories;
}

/**
 * Suggest agents based on task description
 */
export function suggestAgents(registry: Map<string, Agent>, taskDescription: string): string[] {
  const task = taskDescription.toLowerCase();
  const suggestions: string[] = [];

  const patterns = [
    { keywords: ['find', 'locate', 'where', 'search'], agents: ['codebase-locator'] },
    { keywords: ['analyze', 'understand', 'how', 'explain'], agents: ['codebase-analyzer'] },
    { keywords: ['research', 'investigate', 'web'], agents: ['web-search-researcher'] },
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

  return suggestions.slice(0, 3); // Limit suggestions
}
