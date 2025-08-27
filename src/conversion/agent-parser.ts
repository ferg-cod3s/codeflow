import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { globalPerformanceMonitor, globalFileReader } from "../optimization/performance.js";

/**
 * Base agent format used in /agent/ directory
 */
export interface BaseAgent {
  description: string;
  mode?: 'subagent' | 'primary';
  model?: string;
  temperature?: number;
  tools?: Record<string, boolean>;
  [key: string]: any; // Allow additional properties
}

/**
 * Claude Code agent format used in /claude-agents/ directory
 * Currently identical to BaseAgent but may diverge in future
 */
export interface ClaudeCodeAgent extends BaseAgent {
  // Claude Code specific properties (if any)
}

/**
 * OpenCode agent format used in /opencode-agents/ directory
 * May have additional properties for OpenCode-specific functionality
 */
export interface OpenCodeAgent extends BaseAgent {
  usage?: string;
  do_not_use_when?: string;
  escalation?: string;
  examples?: string;
  prompts?: string;
  constraints?: string;
}

/**
 * Generic agent interface that can represent any format
 */
export interface Agent {
  name: string;
  format: 'base' | 'claude-code' | 'opencode';
  frontmatter: BaseAgent | ClaudeCodeAgent | OpenCodeAgent;
  content: string;
  filePath: string;
}

/**
 * Parse error interface
 */
export interface ParseError {
  message: string;
  filePath: string;
  line?: number;
}

/**
 * Parse YAML frontmatter from markdown content
 */
function parseFrontmatter(content: string): { frontmatter: any; body: string } {
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
  const frontmatter: any = {};
  let currentKey = '';
  let currentValue: any = '';
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
 * Parse an agent file from any format
 */
export async function parseAgentFile(filePath: string, format: 'base' | 'claude-code' | 'opencode'): Promise<Agent> {
  const parseCache = globalPerformanceMonitor.getParseCache();
  
  // Check cache first
  const cached = await parseCache.get(filePath);
  if (cached) {
    if ('frontmatter' in cached) {
      // Cached successful parse
      return cached;
    } else {
      // Cached error
      throw new Error(cached.message);
    }
  }

  const parseStart = performance.now();
  
  try {
    const content = await globalFileReader.readFile(filePath);
    const { frontmatter, body } = parseFrontmatter(content);
    
    // Validate required fields
    if (!frontmatter.description) {
      throw new Error('Agent must have a description field');
    }
    
    const agent: Agent = {
      name: basename(filePath, '.md'),
      format,
      frontmatter,
      content: body,
      filePath
    };

    // Cache successful parse
    await parseCache.set(filePath, agent);
    
    const parseTime = performance.now() - parseStart;
    globalPerformanceMonitor.updateMetrics({ agentParseTime: parseTime });
    
    return agent;
  } catch (error: any) {
    const parseError: ParseError = {
      message: `Failed to parse agent file ${filePath}: ${error.message}`,
      filePath
    };
    
    // Cache the error
    await parseCache.setError(filePath, parseError);
    
    throw new Error(parseError.message);
  }
}

/**
 * Parse all agents from a directory
 */
export async function parseAgentsFromDirectory(
  directory: string, 
  format: 'base' | 'claude-code' | 'opencode'
): Promise<{ agents: Agent[]; errors: ParseError[] }> {
  const { readdir } = await import("node:fs/promises");
  const { join } = await import("node:path");
  const { existsSync } = await import("node:fs");
  
  const agents: Agent[] = [];
  const errors: ParseError[] = [];
  
  if (!existsSync(directory)) {
    return { agents, errors };
  }
  
  try {
    const files = await readdir(directory);
    const mdFiles = files.filter(f => f.endsWith('.md') && !f.startsWith('README'));
    
    for (const file of mdFiles) {
      const filePath = join(directory, file);
      try {
        const agent = await parseAgentFile(filePath, format);
        agents.push(agent);
      } catch (error: any) {
        errors.push({
          message: error.message,
          filePath
        });
      }
    }
  } catch (error: any) {
    errors.push({
      message: `Failed to read directory ${directory}: ${error.message}`,
      filePath: directory
    });
  }
  
  return { agents, errors };
}

/**
 * Serialize agent back to markdown format
 */
export function serializeAgent(agent: Agent): string {
  const lines = ['---'];
  
  // Serialize frontmatter
  const frontmatter = agent.frontmatter;
  for (const [key, value] of Object.entries(frontmatter)) {
    if (key === 'tools' && typeof value === 'object') {
      lines.push(`${key}:`);
      for (const [toolKey, toolValue] of Object.entries(value as Record<string, any>)) {
        lines.push(`  ${toolKey}: ${toolValue}`);
      }
    } else {
      lines.push(`${key}: ${value}`);
    }
  }
  
  lines.push('---');
  lines.push('');
  lines.push(agent.content);
  
  return lines.join('\n');
}