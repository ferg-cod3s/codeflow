import { basename } from 'node:path';
import { globalPerformanceMonitor, globalFileReader } from '../optimization/performance.ts';
import { YamlProcessor } from '../yaml/yaml-processor.js';

/**
 * Common interface for parsed entities (agents and commands)
 */
export interface ParsedEntity {
  name: string;
  format: string;
  frontmatter: Record<string, any>;
  content: string;
  filePath: string;
}

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
  permission?: Record<string, any>; // OpenCode permission object (singular)
  permissions?: {
    opencode?: Record<string, any>;
    claude?: Record<string, any>;
  };

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
// Model is configured at Claude Desktop application level, not in individual agents
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
export interface Agent extends ParsedEntity {
  format: 'base' | 'claude-code' | 'opencode' | 'cursor' | 'cursor';
  frontmatter: BaseAgent | ClaudeCodeAgent | OpenCodeAgent;
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
 * Detect agent format from content using YamlProcessor
 */
function detectFormatFromContent(content: string): 'base' | 'claude-code' | 'opencode' {
  const processor = new YamlProcessor();
  const result = processor.parse(content);

  if (!result.success) {
    return 'base'; // Safe fallback
  }

  const frontmatter = result.data.frontmatter;

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
}

/**
 * Flatten nested permission objects to simple allow/deny strings
 * Example: wildcard allow with specific denies -> "allow" (use most permissive value)
 */
function flattenNestedPermission(permission: any): 'allow' | 'ask' | 'deny' {
  if (typeof permission === 'string') {
    return permission as 'allow' | 'ask' | 'deny';
  }

  if (typeof permission === 'object' && permission !== null) {
    // For OpenCode, we need to flatten to a single value
    // Strategy: Use the wildcard "*" value if present, otherwise use "allow" if any rule allows
    if ('*' in permission) {
      return permission['*'] as 'allow' | 'ask' | 'deny';
    }

    // Check if any rule allows access
    const values = Object.values(permission);
    if (values.includes('allow')) {
      return 'allow';
    }
    if (values.includes('ask')) {
      return 'ask';
    }
    return 'deny';
  }

  return 'deny'; // Safe default
}

/**
 * Normalize permission format between tools: and permission: formats
 */
export function normalizePermissionFormat(frontmatter: any): any {
  // If agent uses both tools: and permission: formats, merge them intelligently
  if (
    frontmatter.tools &&
    typeof frontmatter.tools === 'object' &&
    frontmatter.permission &&
    typeof frontmatter.permission === 'object'
  ) {
    // Flatten nested permission objects for OpenCode compatibility
    const permissions = {
      read: flattenNestedPermission(
        frontmatter.permission.read || booleanToPermissionString(frontmatter.tools.read || false)
      ),
      write: flattenNestedPermission(
        frontmatter.permission.write || booleanToPermissionString(frontmatter.tools.write || false)
      ),
      edit: flattenNestedPermission(
        frontmatter.permission.edit || booleanToPermissionString(frontmatter.tools.edit || false)
      ),
      bash: flattenNestedPermission(
        frontmatter.permission.bash || booleanToPermissionString(frontmatter.tools.bash || false)
      ),
      webfetch: flattenNestedPermission(
        frontmatter.permission.webfetch ||
          booleanToPermissionString(frontmatter.tools.webfetch !== false)
      ),
    };

    // Remove individual permission fields and tools to avoid duplication
    const {
      _edit,
      _bash,
      _patch,
      _read,
      _grep,
      _glob,
      _list,
      _webfetch,
      _write,
      _tools,
      ...cleanFrontmatter
    } = frontmatter;

    return {
      ...cleanFrontmatter,
      permission: permissions,
    };
  }

  // If agent uses tools: format only, convert to permission: format
  if (frontmatter.tools && typeof frontmatter.tools === 'object') {
    const permissions = {
      read: booleanToPermissionString(frontmatter.tools.read || false),
      write: booleanToPermissionString(frontmatter.tools.write || false),
      edit: booleanToPermissionString(frontmatter.tools.edit || false),
      bash: booleanToPermissionString(frontmatter.tools.bash || false),
      webfetch: booleanToPermissionString(frontmatter.tools.webfetch !== false),
    };

    // Remove individual permission fields to avoid duplication
    const {
      _edit,
      _bash,
      _patch,
      _read,
      _grep,
      _glob,
      _list,
      _webfetch,
      _write,
      ...cleanFrontmatter
    } = frontmatter;

    // Create normalized frontmatter with permission block
    return {
      ...cleanFrontmatter,
      permission: permissions,
    };
  }

  // If agent already uses permission: format, flatten nested permissions and remove individual permission fields
  if (frontmatter.permission && typeof frontmatter.permission === 'object') {
    // Flatten nested permission structures for OpenCode compatibility
    const flattenedPermissions: Record<string, 'allow' | 'ask' | 'deny'> = {};
    for (const [key, value] of Object.entries(frontmatter.permission)) {
      flattenedPermissions[key] = flattenNestedPermission(value);
    }

    // Remove individual permission fields that might exist alongside the permission block
    const {
      _edit,
      _bash,
      _patch,
      _read,
      _grep,
      _glob,
      _list,
      _webfetch,
      _write,
      ...cleanFrontmatter
    } = frontmatter;

    return {
      ...cleanFrontmatter,
      permission: flattenedPermissions,
    };
  }

  // If no permission format found, return as-is (for Claude Code and other formats that don't use permissions)
  return frontmatter;
}

/**
 * Convert boolean permission values to OpenCode string format
 */
function booleanToPermissionString(value: boolean): 'allow' | 'ask' | 'deny' {
  return value ? 'allow' : 'deny';
}

/**
 * Parse YAML frontmatter from markdown content using YamlProcessor
 */
function parseFrontmatter(content: string): { frontmatter: any; body: string } {
  const processor = new YamlProcessor();
  const result = processor.parse(content);

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return {
    frontmatter: result.data.frontmatter,
    body: result.data.body,
  };
}

/**
 * Parse an agent file from any format
 */
export async function parseAgentFile(
  filePath: string,
  format: 'base' | 'claude-code' | 'opencode' | 'cursor'
): Promise<Agent> {
  const parseCache = globalPerformanceMonitor.getParseCache();

  // Check cache first
  const cacheKey = `${filePath}:${format}`;
  const cached = await parseCache.get(cacheKey);
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
  const content = await globalFileReader.readFile(filePath);

  try {
    const { frontmatter, body } = parseFrontmatter(content);

    // Validate required fields
    if (!frontmatter.description) {
      throw new Error('Agent must have a description field');
    }

    // Ensure name is in frontmatter for validation
    if (!frontmatter.name) {
      frontmatter.name = basename(filePath, '.md');
    }

    // Normalize permission format only for OpenCode format
    // Base, Claude Code, and Cursor formats should preserve original tools/permission fields
    const normalizedFrontmatter =
      format === 'opencode' ? normalizePermissionFormat(frontmatter) : frontmatter;

    // Check if this is a command by mode field
    const _isCommand = normalizedFrontmatter.mode === 'command';

    const entity: Agent | Command = {
      name: basename(filePath, '.md'),
      format,
      frontmatter: normalizedFrontmatter,
      content: body,
      filePath,
    };

    // Cache successful parse
    await parseCache.set(cacheKey, entity);

    const parseTime = performance.now() - parseStart;
    globalPerformanceMonitor.updateMetrics({ agentParseTime: parseTime });

    return entity;
  } catch (error: any) {
    // For malformed YAML, try to parse what we can using fallback parsing
    try {
      const fallbackResult = parseWithFallback(content);
      if (fallbackResult.success) {
        const frontmatter = fallbackResult.data!.frontmatter;

        // Validate required fields even in fallback parsing
        if (!frontmatter.description) {
          throw new Error('Agent must have a description field');
        }

        // Check if this is a command in fallback parsing too
        const _isCommand = frontmatter.mode === 'command';

        const entity: Agent | Command = {
          name: frontmatter.name || basename(filePath, '.md'),
          format,
          frontmatter: frontmatter as any,
          content: fallbackResult.data!.body,
          filePath,
        };

        return entity;
      }
    } catch {
      // Fallback also failed, cache the error
      const parseError: ParseError = {
        message: `Failed to parse agent file ${filePath}: ${error.message}`,
        filePath,
      };
      await parseCache.setError(filePath, parseError);
      throw new Error(parseError.message);
    }

    // If we get here, both YAML parsing and fallback failed
    const parseError: ParseError = {
      message: `Failed to parse agent file ${filePath}: ${error.message}`,
      filePath,
    };
    await parseCache.setError(filePath, parseError);
    throw new Error(parseError.message);
  }
}

/**
 * Fallback parser for malformed YAML - tries to extract what it can
 */
function parseWithFallback(content: string): {
  success: boolean;
  data?: { frontmatter: any; body: string };
} {
  try {
    // Try to extract basic frontmatter using regex
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      return { success: false };
    }

    const frontmatterText = frontmatterMatch[1];
    const body = frontmatterMatch[2] || '';

    // Parse frontmatter line by line, ignoring malformed lines
    const frontmatter: any = {};
    const lines = frontmatterText.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Try to parse key-value pairs
      const colonIndex = trimmed.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmed.slice(0, colonIndex).trim();
        const value = trimmed.slice(colonIndex + 1).trim();

        // Only set if key is valid and we can parse the value
        if (key && value) {
          try {
            // Try to parse as JSON, fallback to string
            frontmatter[key] = JSON.parse(value);
          } catch {
            frontmatter[key] = value;
          }
        }
      }
    }

    return { success: true, data: { frontmatter, body } };
  } catch {
    return { success: false };
  }
}

/**
 * Parse all agents from a directory (including subdirectories for MCP and Claude agents)
 */
export async function parseAgentsFromDirectory(
  directory: string,
  format: 'base' | 'claude-code' | 'opencode' | 'cursor' | 'cursor' | 'auto'
): Promise<{ agents: (Agent | Command)[]; errors: ParseError[] }> {
  const { readdir } = await import('node:fs/promises');
  const { join } = await import('node:path');
  const { existsSync } = await import('node:fs');

  const agents: (Agent | Command)[] = [];
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
          let actualFormat = format as 'base' | 'claude-code' | 'opencode' | 'cursor';
          if (format === 'auto') {
            // Auto-detect format from file content
            const content = await globalFileReader.readFile(itemPath);
            actualFormat = detectFormatFromContent(content);
          }

          // Check if this is likely a command file
          const content = await globalFileReader.readFile(itemPath);
          const { frontmatter } = parseFrontmatter(content);
          const isLikelyCommand =
            // Check if it's in a command directory
            itemPath.includes('/command/') ||
            // Check for command-specific fields
            frontmatter.inputs ||
            frontmatter.outputs ||
            frontmatter.cache_strategy ||
            frontmatter.success_signals ||
            frontmatter.failure_modes ||
            frontmatter.command_schema_version ||
            frontmatter.mode === 'command';

          let entity: Agent | Command;
          if (isLikelyCommand && (actualFormat === 'base' || actualFormat === 'opencode')) {
            entity = await parseCommandFile(itemPath, actualFormat);
          } else {
            entity = await parseAgentFile(itemPath, actualFormat);
          }

          agents.push(entity);
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
 * Serialize agent back to markdown format using YamlProcessor
 */
export function serializeAgent(agent: Agent): string {
  const processor = new YamlProcessor();
  const result = processor.serialize(agent);

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
}

// Command-related interfaces and types

/**
 * Base command format - the single source of truth for all commands
 */
export interface BaseCommand {
  name: string;
  description: string;
  mode?: 'command';
  version?: string;
  inputs?: CommandInput[];
  outputs?: CommandOutput[];
  cache_strategy?: CacheStrategy;
  success_signals?: string[];
  failure_modes?: string[];
  // Legacy fields that may appear in command files
  usage?: string;
  examples?: string;
  constraints?: string;
  intended_followups?: string[];
}

/**
 * OpenCode command format
 */
export interface OpenCodeCommand extends Omit<BaseCommand, 'mode'> {
  mode: 'command';
}

/**
 * Command input specification
 */
export interface CommandInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description?: string;
  default?: any;
}

/**
 * Command output specification
 */
export interface CommandOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'structured';
  format?: string;
  description?: string;
}

/**
 * Cache strategy for commands
 */
export interface CacheStrategy {
  type: 'content_based' | 'time_based' | 'none';
  ttl?: number;
  max_size?: number;
}

/**
 * Generic command interface that can represent any format
 */
export interface Command extends ParsedEntity {
  format: 'base' | 'opencode';
  frontmatter: BaseCommand | OpenCodeCommand;
}

/**
 * Parse a command file from any format
 */
export async function parseCommandFile(
  filePath: string,
  format: 'base' | 'opencode'
): Promise<Command> {
  // Note: Commands are not cached due to different frontmatter types from agents

  const parseStart = performance.now();
  const content = await globalFileReader.readFile(filePath);

  try {
    const { frontmatter, body } = parseFrontmatter(content);

    // Validate required fields for commands
    if (!frontmatter.description) {
      throw new Error('Command must have a description field');
    }

    // Ensure name is in frontmatter for validation
    if (!frontmatter.name) {
      frontmatter.name = basename(filePath, '.md');
    }

    // Set mode to 'command' if not specified
    if (!frontmatter.mode) {
      frontmatter.mode = 'command';
    }

    const command: Command = {
      name: basename(filePath, '.md'),
      format,
      frontmatter,
      content: body,
      filePath,
    };

    // Commands are not cached (different frontmatter types from agents)

    const parseTime = performance.now() - parseStart;
    globalPerformanceMonitor.updateMetrics({ agentParseTime: parseTime });

    return command;
  } catch (error: any) {
    // For malformed YAML, try to parse what we can using fallback parsing
    try {
      const fallbackResult = parseWithFallback(content);
      if (fallbackResult.success) {
        const frontmatter = fallbackResult.data!.frontmatter;

        // Validate required fields even in fallback parsing
        if (!frontmatter.description) {
          throw new Error('Command must have a description field');
        }

        // Set mode to 'command' if not specified
        if (!frontmatter.mode) {
          frontmatter.mode = 'command';
        }

        const command: Command = {
          name: frontmatter.name || basename(filePath, '.md'),
          format,
          frontmatter: frontmatter as any,
          content: fallbackResult.data!.body,
          filePath,
        };

        return command;
      }
    } catch {
      // Fallback also failed
      throw new Error(`Failed to parse command file ${filePath}: ${error.message}`);
    }

    // If we get here, both YAML parsing and fallback failed
    throw new Error(`Failed to parse command file ${filePath}: ${error.message}`);
  }
}

/**
 * Serialize command back to markdown format using YamlProcessor
 */
export function serializeCommand(command: Command): string {
  const processor = new YamlProcessor();
  const result = processor.serialize(command);

  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
}
