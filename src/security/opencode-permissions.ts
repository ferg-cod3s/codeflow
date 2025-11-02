import { join } from 'node:path';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { setFilePermissions, setDirectoryPermissions } from './validation';
import { normalizePermissionFormat } from '../conversion/agent-parser.js';
import { YamlProcessor } from '../yaml/yaml-processor.js';

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
 * Parse frontmatter from content using YamlProcessor
 */
function parseFrontmatterFromContent(content: string): { frontmatter: any; body: string } {
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
 * Serialize frontmatter back to content using YamlProcessor
 */
function serializeFrontmatter(originalContent: string, frontmatter: any): string {
  const processor = new YamlProcessor();

  // Extract the body from the original content
  const bodyMatch = originalContent.match(/\n---\n([\s\S]*)$/);
  const body = bodyMatch ? bodyMatch[1].trim() : '';

  // Create a mock agent object for serialization
  const mockAgent = {
    name: frontmatter.name || 'temp-agent',
    format: 'opencode' as const,
    frontmatter,
    content: body,
    filePath: '/tmp/temp.md',
  };

  const result = processor.serialize(mockAgent);
  if (!result.success) {
    throw new Error(result.error.message);
  }

  return result.data;
}
