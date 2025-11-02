import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

interface ExportOptions {
  projectRoot?: string;
  format?: 'json' | 'yaml' | 'tar' | 'zip' | 'targz';
  output?: string;
  includeContent?: boolean;
  includeMetadata?: boolean;
  verbose?: boolean;
}

interface ExportedItem {
  name: string;
  type: 'agent' | 'command';
  platform: 'claude-code' | 'opencode' | 'base';
  path: string;
  content?: string;
  metadata?: {
    size: number;
    lastModified: Date;
  };
}

interface ExportResult {
  success: boolean;
  outputPath?: string;
  totalItems: number;
  errors: string[];
}

/**
 * Export agents and commands from a project
 */
export async function exportProject(
  options: ExportOptions = {}
): Promise<ExportResult> {
  const projectPath = options.projectRoot || process.cwd();
  const projectPathResolved = resolve(projectPath);
  const { format = 'json', output, includeContent = true, verbose = false } = options;

  console.log(`📤 Exporting Codeflow project: ${projectPathResolved}`);

  const exportedItems: ExportedItem[] = [];
  const errors: string[] = [];

  // Collect agents
  console.log('🤖 Collecting agents...');
  const agentDirs = ['.claude/agents', '.opencode/agent'];

  for (const dir of agentDirs) {
    const fullPath = join(projectPathResolved, dir);
    if (existsSync(fullPath)) {
      try {
        const files = readdirSync(fullPath).filter((f) => f.endsWith('.md'));

        for (const file of files) {
          const filePath = join(fullPath, file);
          try {
            const content = includeContent ? await readFile(filePath, 'utf-8') : undefined;
            const stats = require('fs').statSync(filePath);

            // Determine platform
            let platform: 'claude-code' | 'opencode' | 'base' = 'base';
            if (dir.includes('.claude')) {
              platform = 'claude-code';
            } else if (dir.includes('.opencode')) {
              platform = 'opencode';
            }

            exportedItems.push({
              name: file.replace('.md', ''),
              type: 'agent',
              platform,
              path: filePath,
              content,
              metadata: {
                size: stats.size,
                lastModified: stats.mtime,
              },
            });

            if (verbose) {
              console.log(`   Exported agent: ${file}`);
            }
          } catch (error) {
            errors.push(
              `Failed to export agent ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        errors.push(
          `Failed to read agent directory ${dir}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }

  // Collect commands
  console.log('💬 Collecting commands...');
  const commandDirs = ['.claude/commands', '.opencode/command'];

  for (const dir of commandDirs) {
    const fullPath = join(projectPathResolved, dir);
    if (existsSync(fullPath)) {
      try {
        const files = readdirSync(fullPath).filter((f) => f.endsWith('.md'));

        for (const file of files) {
          const filePath = join(fullPath, file);
          try {
            const content = includeContent ? await readFile(filePath, 'utf-8') : undefined;
            const stats = require('fs').statSync(filePath);

            // Determine platform
            let platform: 'claude-code' | 'opencode' | 'base' = 'base';
            if (dir.includes('.claude')) {
              platform = 'claude-code';
            } else if (dir.includes('.opencode')) {
              platform = 'opencode';
            }

            exportedItems.push({
              name: file.replace('.md', ''),
              type: 'command',
              platform,
              path: filePath,
              content,
              metadata: {
                size: stats.size,
                lastModified: stats.mtime,
              },
            });

            if (verbose) {
              console.log(`   Exported command: ${file}`);
            }
          } catch (error) {
            errors.push(
              `Failed to export command ${file}: ${error instanceof Error ? error.message : 'Unknown error'}`
            );
          }
        }
      } catch (error) {
        errors.push(
          `Failed to read command directory ${dir}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    }
  }

  console.log(`✅ Collected ${exportedItems.length} items`);

  if (errors.length > 0) {
    console.warn(`⚠️  ${errors.length} errors during export:`);
    errors.forEach((error) => console.warn(`   ${error}`));
  }

  // Generate output
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const defaultOutput = `codeflow-export-${timestamp}.${format}`;

  const outputPath = output ? resolve(output) : join(projectPathResolved, defaultOutput);

  try {
    let exportData: string;

    switch (format) {
      case 'json':
        exportData = JSON.stringify(
          {
            metadata: {
              exportedAt: new Date().toISOString(),
              projectPath: projectPathResolved,
              totalItems: exportedItems.length,
              includeContent,
            },
            items: exportedItems,
          },
          null,
          2
        );
        break;

      case 'yaml':
        // Simple YAML-like format
        exportData = `metadata:
  exportedAt: ${new Date().toISOString()}
  projectPath: ${projectPathResolved}
  totalItems: ${exportedItems.length}
  includeContent: ${includeContent}

items:
${exportedItems
  .map(
    (item) => `  - name: ${item.name}
    type: ${item.type}
    platform: ${item.platform}
    path: ${item.path}
    metadata:
      size: ${item.metadata?.size}
      lastModified: ${item.metadata?.lastModified.toISOString()}
${
  includeContent
    ? `    content: |
${item.content
  ?.split('\n')
  .map((line) => `      ${line}`)
  .join('\n')}`
    : ''
}`
  )
  .join('\n')}
`;
        break;

      case 'tar':
      case 'targz':
      case 'zip':
        // For now, export as JSON with appropriate extension
        // Full tar/zip support would require additional dependencies
        exportData = JSON.stringify(
          {
            metadata: {
              exportedAt: new Date().toISOString(),
              projectPath: projectPathResolved,
              totalItems: exportedItems.length,
              includeContent,
            },
            items: exportedItems,
          },
          null,
          2
        );
        break;

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    await writeFile(outputPath, exportData, 'utf-8');

    console.log(`\n✅ Export completed successfully!`);
    console.log(`📄 Exported to: ${outputPath}`);
    console.log(`📊 Summary:`);
    console.log(`   Total items: ${exportedItems.length}`);
    console.log(`   Agents: ${exportedItems.filter((i) => i.type === 'agent').length}`);
    console.log(`   Commands: ${exportedItems.filter((i) => i.type === 'command').length}`);
    console.log(`   File size: ${Math.round(Buffer.byteLength(exportData, 'utf8') / 1024)}KB`);

    if (includeContent) {
      console.log(`💡 Tip: Use --no-content to export metadata only (smaller file)`);
    }

    return {
      success: true,
      outputPath,
      totalItems: exportedItems.length,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to write export file: ${errorMessage}`);

    return {
      success: false,
      totalItems: exportedItems.length,
      errors: [...errors, errorMessage],
    };
  }
}
