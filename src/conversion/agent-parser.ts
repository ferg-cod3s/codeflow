import { basename } from 'node:path';
import { globalPerformanceMonitor, globalFileReader } from '../optimization/performance';

/**
 * Base agent format - the single source of truth for all agents
 * This format contains all possible fields and gets converted to platform-specific formats
 */
export interface BaseAgent {
  name: string;
  description: string;
  mode?: 'subagent' | 'primary' | 'all'; // Align with OpenCode modes (no 'agent')
  temperature?: number;
  model?: string;
  tools?: Record<string, boolean>;

  // Custom extensions that can be preserved across formats
  category?: string;
  tags?: string[];
  allowed_directories?: string[];

  // Legacy fields that may appear in test data
  usage?: string;
  do_not_use_when?: string;
  escalation?: string;
  examples?: string;
  prompts?: string;
  constraints?: string;
  max_tokens?: number;
  enabled?: boolean;
  disabled?: boolean;

  // Claude Code specific fields (optional in base format)
  // Note: Claude Code uses comma-separated tools string, not object
}

// Claude Code format has different tools format (string vs object)
export interface ClaudeCodeAgent extends Omit<BaseAgent, 'tools'> {
  tools?: string; // Claude Code uses comma-separated string
}

// OpenCode format - custom codeflow format (extends official OpenCode spec)
export interface OpenCodeAgent {
  name: string; // Required in custom format
  description: string; // Required - official OpenCode spec
  mode?: 'primary' | 'subagent' | 'all'; // Official OpenCode modes (optional, defaults to 'all')
  model?: string; // Optional - official OpenCode spec
  temperature?: number; // Optional - official OpenCode spec
  category?: string; // Optional - custom extension
  tags?: string[]; // Optional - custom extension (array format)
  allowed_directories?: string[]; // Optional - custom extension
  tools?: Record<string, boolean>; // Optional - official OpenCode spec
  disable?: boolean; // Optional - official OpenCode spec
  prompt?: string; // Optional - official OpenCode spec
  permission?: Record<string, any>; // Optional - official OpenCode spec

  // Legacy fields for backwards compatibility with tests
  usage?: string;
  do_not_use_when?: string;
  escalation?: string;
  examples?: string;
  prompts?: string;
  constraints?: string;
  max_tokens?: number;
  enabled?: boolean;
  disabled?: boolean;
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
 * Detect agent format from content
 */
function detectFormatFromContent(content: string): 'base' | 'claude-code' | 'opencode' {
  if (!content.startsWith('---')) {
    return 'base'; // Default fallback
  }

  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) {
    return 'base';
  }

  try {
    const { frontmatter } = parseFrontmatter(content);

    // Official OpenCode format detection
    // - Must have description and mode fields (required by official spec)
    if (frontmatter.description && frontmatter.mode) {
      return 'opencode';
    }

    // Legacy custom OpenCode format detection (for backward compatibility)
    // - Has name, tags (array), and category fields
    if (
      frontmatter.name &&
      frontmatter.tags &&
      Array.isArray(frontmatter.tags) &&
      frontmatter.category
    ) {
      return 'opencode';
    }

    // Claude Code format detection
    // - Has role field but not OpenCode markers
    if (frontmatter.role && !frontmatter.mode) {
      return 'claude-code';
    }

    // Default to base format
    return 'base';
  } catch {
    return 'base'; // Safe fallback
  }
}

/**
 * Normalize permission format between tools: and permission: formats
 */
export function normalizePermissionFormat(frontmatter: any): any {
  // If agent uses tools: format, convert to permission: format
  if (frontmatter.tools && typeof frontmatter.tools === 'object') {
    const permissions = {
      edit: booleanToPermissionString(frontmatter.tools.edit || false),
      bash: booleanToPermissionString(frontmatter.tools.bash || false),
      webfetch: booleanToPermissionString(frontmatter.tools.webfetch !== false), // Default to true if not explicitly false
    };

    // Remove individual permission fields to avoid duplication
    const { edit, bash, patch, read, grep, glob, list, webfetch, write, ...cleanFrontmatter } =
      frontmatter;

    // Create normalized frontmatter with permission block
    return {
      ...cleanFrontmatter,
      permission: permissions,
    };
  }

  // If agent already uses permission: format, remove individual permission fields to avoid duplication
  if (frontmatter.permission && typeof frontmatter.permission === 'object') {
    // Remove individual permission fields that might exist alongside the permission block
    const { edit, bash, patch, read, grep, glob, list, webfetch, write, ...cleanFrontmatter } =
      frontmatter;
    return cleanFrontmatter;
  }

  // If no permission format found, add default permissions
  return {
    ...frontmatter,
    permission: {
      edit: 'deny',
      bash: 'deny',
      webfetch: 'allow',
    },
  };
}

/**
 * Convert boolean permission values to OpenCode string format
 */
function booleanToPermissionString(value: boolean): 'allow' | 'ask' | 'deny' {
  return value ? 'allow' : 'deny';
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
  let inTools = false;
  let toolsIndentLevel = 0;
  let inArray = false;
  let arrayKey = '';
  let arrayIndentLevel = 0;

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
      const indentLevel = line.length - line.trimStart().length;

      // Exit tools section if we're back to the same or lesser indentation
      if (indentLevel <= toolsIndentLevel && trimmedLine !== '') {
        inTools = false;
      } else if (trimmedLine.includes(':')) {
        const [key, value] = trimmedLine.split(':').map((s) => s.trim());
        frontmatter.tools[key] = value === 'true' ? true : value === 'false' ? false : value;
        continue;
      }
    }

    // Handle array parsing (YAML list syntax)
    if (inArray) {
      const indentLevel = line.length - line.trimStart().length;

      // Exit array section if we're back to the same or lesser indentation
      if (indentLevel <= arrayIndentLevel && trimmedLine !== '') {
        inArray = false;
        arrayKey = '';
      } else if (trimmedLine.startsWith('- ')) {
        // Add item to array
        const item = trimmedLine.substring(2).trim();
        if (!Array.isArray(frontmatter[arrayKey])) {
          frontmatter[arrayKey] = [];
        }
        frontmatter[arrayKey].push(item);
        continue;
      }
    }

    if (!inTools && !inArray && trimmedLine.includes(':')) {
      const colonIndex = trimmedLine.indexOf(':');
      const key = trimmedLine.substring(0, colonIndex).trim();
      let value = trimmedLine.substring(colonIndex + 1).trim();

      // Check if this starts an array (no value after colon)
      if (value === '') {
        inArray = true;
        arrayKey = key;
        arrayIndentLevel = line.indexOf(key + ':');
        frontmatter[key] = [];
        continue;
      }

      // Handle different value types
      if (value === 'true' || value === 'false') {
        frontmatter[key] = value === 'true';
      } else if (value === 'undefined' || value === 'null') {
        // Handle undefined and null values properly
        frontmatter[key] = value === 'undefined' ? undefined : null;
      } else if (value.startsWith('[') && value.endsWith(']')) {
        // Handle arrays like [tag1, tag2, tag3]
        const arrayContent = value.slice(1, -1).trim();
        if (arrayContent === '') {
          frontmatter[key] = [];
        } else {
          frontmatter[key] = arrayContent
            .split(',')
            .map((item) => item.trim().replace(/^["']|["']$/g, ''))
            .filter((item) => item.length > 0); // Remove empty items
        }
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

  // Normalize permission format for compatibility
  const normalizedFrontmatter = normalizePermissionFormat(frontmatter);

  return {
    frontmatter: normalizedFrontmatter,
    body: bodyLines.join('\n').trim(),
  };
}

/**
 * Parse an agent file from any format
 */
export async function parseAgentFile(
  filePath: string,
  format: 'base' | 'claude-code' | 'opencode'
): Promise<Agent> {
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

    // Ensure name is in frontmatter for validation
    if (!frontmatter.name) {
      frontmatter.name = basename(filePath, '.md');
    }

    const agent: Agent = {
      name: basename(filePath, '.md'),
      format,
      frontmatter,
      content: body,
      filePath,
    };

    // Cache successful parse
    await parseCache.set(filePath, agent);

    const parseTime = performance.now() - parseStart;
    globalPerformanceMonitor.updateMetrics({ agentParseTime: parseTime });

    return agent;
  } catch (error: any) {
    const parseError: ParseError = {
      message: `Failed to parse agent file ${filePath}: ${error.message}`,
      filePath,
    };

    // Cache the error
    await parseCache.setError(filePath, parseError);

    throw new Error(parseError.message);
  }
}

/**
 * Parse all agents from a directory (including subdirectories for MCP and Claude agents)
 */
export async function parseAgentsFromDirectory(
  directory: string,
  format: 'base' | 'claude-code' | 'opencode' | 'auto'
): Promise<{ agents: Agent[]; errors: ParseError[] }> {
  const { readdir } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const { existsSync } = await import('node:fs');

  const agents: Agent[] = [];
  const errors: ParseError[] = [];

  if (!existsSync(directory)) {
    return { agents, errors };
  }

  try {
    // Handle both subdirectories and flat directory structures for all formats
    const files = await readdir(directory);

    for (const item of files) {
      const itemPath = join(directory, item);
      const stat = await import('node:fs/promises').then((fs) => fs.stat(itemPath));

      if (stat.isDirectory()) {
        // This is a subdirectory, parse agents from it recursively
        try {
          const subdirAgents = await parseAgentsFromDirectory(itemPath, format);
          agents.push(...subdirAgents.agents);
          errors.push(...subdirAgents.errors);
        } catch (error: any) {
          errors.push({
            message: `Failed to parse subdirectory ${item}: ${error.message}`,
            filePath: itemPath,
          });
        }
      } else if (item.endsWith('.md') && !item.startsWith('README')) {
        // This is a markdown file, parse it
        try {
          let actualFormat: 'base' | 'claude-code' | 'opencode' = format as
            | 'base'
            | 'claude-code'
            | 'opencode';
          if (format === 'auto') {
            // Auto-detect format from file content
            const content = await globalFileReader.readFile(itemPath);
            actualFormat = detectFormatFromContent(content);
          }
          const agent = await parseAgentFile(itemPath, actualFormat);
          agents.push(agent);
        } catch (error: any) {
          errors.push({
            message: error.message,
            filePath: itemPath,
          });
        }
      }
    }
  } catch (error: any) {
    errors.push({
      message: `Failed to read directory ${directory}: ${error.message}`,
      filePath: directory,
    });
  }

  return { agents, errors };
}

/**
 * Check if a YAML value needs to be quoted
 */
function needsYamlQuoting(value: string): boolean {
  // Quote if contains colons, special YAML chars, starts with numbers/quotes, or is a reserved word
  return (
    /[:[\]{}|>@`#%&*!]/.test(value) ||
    /^[0-9"']/.test(value) ||
    /^(true|false|null|yes|no|on|off)$/i.test(value) ||
    value.includes('\n')
  );
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
    } else if (key === 'permission' && typeof value === 'object') {
      lines.push(`${key}:`);
      for (const [permKey, permValue] of Object.entries(value as Record<string, any>)) {
        lines.push(`  ${permKey}: ${permValue}`);
      }
    } else if (Array.isArray(value)) {
      // Handle arrays with YAML list syntax
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${item}`);
      }
    } else if (typeof value === 'string' && needsYamlQuoting(value)) {
      // Quote strings that need it for proper YAML syntax
      const escapedValue = value.replace(/"/g, '\\"');
      lines.push(`${key}: "${escapedValue}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push('---');
  lines.push('');
  lines.push(agent.content);

  return lines.join('\n');
}
