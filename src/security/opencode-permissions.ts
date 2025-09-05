import { join } from 'node:path';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { setFilePermissions, setDirectoryPermissions } from './validation';

export interface OpenCodePermissionConfig {
  osPermissions: {
    directories: number;
    agentFiles: number;
    commandFiles: number;
  };
  runtimePermissions: {
    primary: {
      edit: 'allow' | 'ask' | 'deny';
      bash: 'allow' | 'ask' | 'deny';
      webfetch: 'allow' | 'ask' | 'deny';
    };
    subagent: {
      edit: 'ask' | 'deny';
      bash: 'ask' | 'deny';
      webfetch: 'allow';
    };
  };
  defaultAllowedDirectories: string[];
  repositories?: {
    [repoPath: string]: Partial<OpenCodePermissionConfig>;
  };
}

export const DEFAULT_OPENCODE_PERMISSIONS: OpenCodePermissionConfig = {
  osPermissions: {
    directories: 0o755,
    agentFiles: 0o644,
    commandFiles: 0o755,
  },
  runtimePermissions: {
    primary: {
      edit: 'allow',
      bash: 'allow',
      webfetch: 'allow',
    },
    subagent: {
      edit: 'ask',
      bash: 'ask',
      webfetch: 'allow',
    },
  },
  defaultAllowedDirectories: [
    process.cwd(),
    join(process.cwd(), 'src'),
    join(process.cwd(), 'tests'),
    join(process.cwd(), 'docs'),
    join(process.cwd(), 'thoughts'),
    join(process.cwd(), 'packages', '*', 'src'),
    join(process.cwd(), 'packages', '*', 'tests'),
  ],
};

/**
 * Normalize permission format between tools: and permission: formats
 */
function normalizePermissionFormat(frontmatter: any): any {
  // If agent uses tools: format, convert to permission: format
  if (frontmatter.tools && typeof frontmatter.tools === 'object') {
    const permissions = {
      edit: booleanToPermissionString(frontmatter.tools.edit || false),
      bash: booleanToPermissionString(frontmatter.tools.bash || false),
      webfetch: booleanToPermissionString(frontmatter.tools.webfetch !== false), // Default to true if not explicitly false
    };

    // Create normalized frontmatter with both formats for compatibility
    return {
      ...frontmatter,
      permission: permissions,
    };
  }

  // If agent already uses permission: format, ensure it's properly structured
  if (frontmatter.permission && typeof frontmatter.permission === 'object') {
    return frontmatter;
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

// Deprecated: No longer load .opencode/permissions.json. All permissions must be set in agent file frontmatter.
export async function loadRepositoryOpenCodeConfig(
  _repoPath: string
): Promise<OpenCodePermissionConfig> {
  return DEFAULT_OPENCODE_PERMISSIONS;
}

export async function applyOpenCodePermissionsToDirectory(
  dirPath: string,
  config: OpenCodePermissionConfig
): Promise<void> {
  // Set directory permissions
  await setDirectoryPermissions(dirPath, config.osPermissions.directories);

  // Process all files in directory
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);

    if (entry.isDirectory()) {
      await setDirectoryPermissions(fullPath, config.osPermissions.directories);
    } else if (entry.name.endsWith('.md')) {
      // Determine if it's an agent or command file
      const isCommand = entry.name.includes('command') || fullPath.includes('/command/');
      const fileMode = isCommand
        ? config.osPermissions.commandFiles
        : config.osPermissions.agentFiles;

      await setFilePermissions(fullPath, fileMode);

      // Update OpenCode agent frontmatter with permissions
      if (!isCommand) {
        await updateOpenCodeAgentPermissions(fullPath, config);
      }
    }
  }
}

async function updateOpenCodeAgentPermissions(
  agentPath: string,
  config: OpenCodePermissionConfig
): Promise<void> {
  const content = await readFile(agentPath, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

  if (frontmatterMatch) {
    // Parse existing frontmatter using the same logic as agent-parser
    const { frontmatter } = parseFrontmatterFromContent(content);

    // Normalize permission format
    const normalizedFrontmatter = normalizePermissionFormat(frontmatter);

    // Determine agent type for default permissions
    const agentType = normalizedFrontmatter.mode === 'primary' ? 'primary' : 'subagent';

    // Add allowed_directories if not present
    if (!normalizedFrontmatter.allowed_directories) {
      normalizedFrontmatter.allowed_directories = config.defaultAllowedDirectories;
    }

    // Add permission field if not present (should be added by normalizePermissionFormat)
    if (!normalizedFrontmatter.permission) {
      const runtimePerms = config.runtimePermissions[agentType];
      normalizedFrontmatter.permission = {
        edit: runtimePerms.edit,
        bash: runtimePerms.bash,
        webfetch: runtimePerms.webfetch,
      };
    }

    // Serialize back to content
    const updatedContent = serializeFrontmatter(content, normalizedFrontmatter);
    await writeFile(agentPath, updatedContent);
  }
}

/**
 * Parse frontmatter from content (simplified version for permissions)
 */
function parseFrontmatterFromContent(content: string): { frontmatter: any; body: string } {
  const lines = content.split('\n');

  // Find frontmatter boundaries
  if (lines[0] !== '---') {
    throw new Error('File does not start with YAML frontmatter');
  }

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

  // Simple frontmatter parsing
  const frontmatter: any = {};
  let inSection = false;
  let sectionName = '';
  let sectionIndent = 0;

  for (const line of frontmatterLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.includes(':') && !inSection) {
      const [key, value] = trimmed.split(':').map((s) => s.trim());
      if (value === '') {
        // Start of section
        inSection = true;
        sectionName = key;
        sectionIndent = line.indexOf(key);
        frontmatter[key] = key === 'allowed_directories' ? [] : {};
      } else {
        // Simple key-value
        frontmatter[key] = parseValue(value);
      }
    } else if (inSection) {
      const indent = line.length - line.trimStart().length;
      if (indent <= sectionIndent && trimmed !== '') {
        inSection = false;
      } else if (sectionName === 'tools' && trimmed.includes(':')) {
        const [key, value] = trimmed.split(':').map((s) => s.trim());
        frontmatter.tools[key] = parseValue(value);
      } else if (sectionName === 'permission' && trimmed.includes(':')) {
        const [key, value] = trimmed.split(':').map((s) => s.trim());
        frontmatter.permission[key] = parseValue(value);
      } else if (sectionName === 'allowed_directories' && trimmed.startsWith('- ')) {
        frontmatter.allowed_directories.push(trimmed.substring(2).trim());
      }
    }
  }

  return {
    frontmatter,
    body: bodyLines.join('\n').trim(),
  };
}

/**
 * Parse YAML value
 */
function parseValue(value: string): any {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!isNaN(Number(value)) && value !== '') return Number(value);
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  return value;
}

/**
 * Serialize frontmatter back to content
 */
function serializeFrontmatter(originalContent: string, frontmatter: any): string {
  const lines = ['---'];

  // Serialize frontmatter
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
    } else if (key === 'allowed_directories' && Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const dir of value) {
        lines.push(`  - ${dir}`);
      }
    } else if (typeof value === 'string' && value.includes('\n')) {
      lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
    } else {
      lines.push(`${key}: ${value}`);
    }
  }

  lines.push('---');
  lines.push('');

  // Find original body
  const bodyMatch = originalContent.match(/\n---\n([\s\S]*)$/);
  if (bodyMatch) {
    lines.push(bodyMatch[1].trim());
  }

  return lines.join('\n');
}
