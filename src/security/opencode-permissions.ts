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
  ],
};

// Deprecated: No longer load .opencode/permissions.json. All permissions must be set in agent file frontmatter.
export async function loadRepositoryOpenCodeConfig(
  repoPath: string
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
    const frontmatter = frontmatterMatch[1];

    // Parse existing frontmatter
    const lines = frontmatter.split('\n');
    const agentType = frontmatter.includes('mode: primary') ? 'primary' : 'subagent';

    // Add/update permission fields
    const updatedLines = [...lines];

    // Add allowed_directories if not present
    if (!frontmatter.includes('allowed_directories:')) {
      updatedLines.push(`allowed_directories:`);
      config.defaultAllowedDirectories.forEach((dir) => {
        updatedLines.push(`  - ${dir}`);
      });
    }

    // Add permission field if not present
    if (!frontmatter.includes('permission:')) {
      const runtimePerms = config.runtimePermissions[agentType];
      updatedLines.push(`permission:`);
      updatedLines.push(`  edit: ${runtimePerms.edit}`);
      updatedLines.push(`  bash: ${runtimePerms.bash}`);
      updatedLines.push(`  webfetch: ${runtimePerms.webfetch}`);
    }

    // Write back updated content
    const updatedFrontmatter = updatedLines.join('\n');
    const updatedContent = content.replace(frontmatterMatch[0], `---\n${updatedFrontmatter}\n---`);
    await writeFile(agentPath, updatedContent);
  }
}
