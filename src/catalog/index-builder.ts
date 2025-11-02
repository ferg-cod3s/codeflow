import { readdir, readFile, writeFile } from 'fs/promises';
import { join, relative, dirname } from 'path';
import { existsSync } from 'fs';
import crypto from 'crypto';





export interface CatalogItem {
  id: string;
  kind: 'agent' | 'command' | 'template' | 'mcp';
  name: string;
  version: string;
  description: string;
  tags: string[];
  license: string;
  source: string;
  dependencies: string[];
  install_targets: string[];
  conversion_rules: {
    base_path: string;
    supports_all_formats?: boolean;
    supports_formats?: string[];
    lossy_fields?: string[];
  };
  provenance: {
    repo: string;
    path: string;
    sha?: string;
    license: string;
    attribution: string;
    import_date?: string;
  };
}

export interface CatalogIndex {
  version: string;
  updated: string;
  sources: Record<
    string,
    {
      name: string;
      description: string;
      url: string;
      type: string;
      adapter?: string;
    }
  >;
  stats: {
    total_items: number;
    agents: number;
    commands: number;
    templates: number;
    mcps: number;
  };
  items: CatalogItem[];
}

export class CatalogIndexBuilder {
  private projectRoot: string;
  private catalogPath: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.catalogPath = join(projectRoot, 'CATALOG_INDEX.json');
  }

  async buildFromLocal(): Promise<CatalogIndex> {
    const index: CatalogIndex = {
      version: '1.0.0',
      updated: new Date().toISOString(),
      sources: {
        'codeflow-core': {
          name: 'Codeflow Core',
          description: 'Official Codeflow agents and commands',
          url: 'https://github.com/ferg-cod3s/codeflow',
          type: 'local',
        },
      },
      stats: {
        total_items: 0,
        agents: 0,
        commands: 0,
        templates: 0,
        mcps: 0,
      },
      items: [],
    };

    // Process existing agents from codeflow-agents/
    const agents = await this.scanAgents();
    index.items.push(...agents);
    index.stats.agents = agents.length;

    // Process commands from command/
    const commands = await this.scanCommands();
    index.items.push(...commands);
    index.stats.commands = commands.length;

    // Process MCP servers from mcp/
    const mcps = await this.scanMCPs();
    index.items.push(...mcps);
    index.stats.mcps = mcps.length;

    // Update total count
    index.stats.total_items = index.items.length;

    return index;
  }

  private async scanAgents(): Promise<CatalogItem[]> {
    const agentsDir = join(this.projectRoot, 'codeflow-agents');
    const items: CatalogItem[] = [];

    if (!existsSync(agentsDir)) {
      return items;
    }

    // Recursively scan for .md files
    const scanDir = async (dir: string, baseDir: string): Promise<void> => {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath, baseDir);
        } else if (entry.name.endsWith('.md') && !entry.name.startsWith('README')) {
          const item = await this.parseAgentFile(fullPath, baseDir);
          if (item) {
            items.push(item);
          }
        }
      }
    };

    await scanDir(agentsDir, agentsDir);
    return items;
  }

  private async parseAgentFile(filePath: string, baseDir: string): Promise<CatalogItem | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const relativePath = relative(baseDir, filePath);
      const category = dirname(relativePath);
      const name = relativePath.split('/').pop()?.replace('.md', '') || '';

      // Extract metadata from frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        return null;
      }

      const frontmatter = frontmatterMatch[1];
      const description = this.extractField(frontmatter, 'description');
      const tags = this.extractTags(frontmatter, category);
      const _model = this.extractField(frontmatter, 'model');

      // Generate hash of the file content
      const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 7);

      return {
        id: `codeflow-core/${name}`,
        kind: 'agent',
        name: name,
        version: '1.0.0',
        description: description.substring(0, 200),
        tags: tags,
        license: 'MIT',
        source: 'codeflow-core',
        dependencies: this.extractDependencies(frontmatter),
        install_targets: ['claude-code', 'opencode'],
        conversion_rules: {
          base_path: relative(this.projectRoot, filePath),
          supports_all_formats: true,
        },
        provenance: {
          repo: 'ferg-cod3s/codeflow',
          path: relative(this.projectRoot, filePath),
          sha: hash,
          license: 'MIT',
          attribution: 'Codeflow Team',
        },
      };
    } catch (error) {
      console.warn(`Failed to parse agent file ${filePath}:`, error);
      return null;
    }
  }

  private async scanCommands(): Promise<CatalogItem[]> {
    const commandsDir = join(this.projectRoot, 'command');
    const items: CatalogItem[] = [];

    if (!existsSync(commandsDir)) {
      return items;
    }

    const entries = await readdir(commandsDir);

    for (const entry of entries) {
      if (entry.endsWith('.md') && !entry.startsWith('README')) {
        const fullPath = join(commandsDir, entry);
        const item = await this.parseCommandFile(fullPath);
        if (item) {
          items.push(item);
        }
      }
    }

    return items;
  }

  private async parseCommandFile(filePath: string): Promise<CatalogItem | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const name = filePath.split('/').pop()?.replace('.md', '') || '';

      // Extract metadata from frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        return null;
      }

      const frontmatter = frontmatterMatch[1];
      const description = this.extractField(frontmatter, 'description');
      const tags = ['command', 'workflow'];

      // Generate hash
      const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 7);

      // Extract dependencies from intended_followups
      const dependencies = this.extractIntendedFollowups(frontmatter);

      return {
        id: `codeflow-core/cmd-${name}`,
        kind: 'command',
        name: `/${name}`,
        version: '1.0.0',
        description: description.substring(0, 200),
        tags: tags,
        license: 'MIT',
        source: 'codeflow-core',
        dependencies: dependencies,
        install_targets: ['claude-code', 'opencode'],
        conversion_rules: {
          base_path: relative(this.projectRoot, filePath),
          supports_all_formats: true,
        },
        provenance: {
          repo: 'ferg-cod3s/codeflow',
          path: relative(this.projectRoot, filePath),
          sha: hash,
          license: 'MIT',
          attribution: 'Codeflow Team',
        },
      };
    } catch (error) {
      console.warn(`Failed to parse command file ${filePath}:`, error);
      return null;
    }
  }

  private extractField(frontmatter: string, field: string): string {
    const regex = new RegExp(`^${field}:\\s*(.+)`, 'mi');
    const match = frontmatter.match(regex);

    if (match) {
      let value = match[1].trim();
      // Handle multi-line values
      const lines = frontmatter.split('\n');
      const fieldIndex = lines.findIndex((l) => l.startsWith(`${field}:`));
      if (fieldIndex !== -1) {
        let i = fieldIndex + 1;
        while (i < lines.length && lines[i].startsWith('  ')) {
          value += ' ' + lines[i].trim();
          i++;
        }
      }
      // Remove quotes
      return value.replace(/^["']|["']$/g, '').trim();
    }

    return '';
  }

  private extractTags(frontmatter: string, category: string): string[] {
    const tags: string[] = [];

    // Add category as a tag
    if (category && category !== '.') {
      tags.push(category.replace('-', ' ').replace('_', ' '));
    }

    // Extract tags from frontmatter
    const tagsMatch = frontmatter.match(/^tags:\s*\[(.*?)\]/im);
    if (tagsMatch) {
      const tagsList = tagsMatch[1].split(',').map((t) => t.trim().replace(/['"]/g, ''));
      tags.push(...tagsList);
    }

    // Extract from categories if present
    const categoryMatch = frontmatter.match(/^category:\s*(.+)/im);
    if (categoryMatch) {
      tags.push(categoryMatch[1].trim());
    }

    // Deduplicate
    return [...new Set(tags)];
  }

  private extractDependencies(frontmatter: string): string[] {
    const deps: string[] = [];

    // Look for intended_followups
    const followupsMatch = frontmatter.match(/intended_followups:\s*\n((?:\s+-\s+.+\n?)+)/);
    if (followupsMatch) {
      const lines = followupsMatch[1].split('\n');
      for (const line of lines) {
        const match = line.match(/^\s*-\s+(.+)/);
        if (match) {
          deps.push(match[1].trim());
        }
      }
    }

    return deps;
  }

  private extractIntendedFollowups(frontmatter: string): string[] {
    // Similar to extractDependencies but for commands
    return this.extractDependencies(frontmatter);
  }

  async save(index: CatalogIndex): Promise<void> {
    await writeFile(this.catalogPath, JSON.stringify(index, null, 2));
    console.log(`✅ Catalog index saved to ${this.catalogPath}`);
    console.log(
      `📊 Stats: ${index.stats.total_items} total items (${index.stats.agents} agents, ${index.stats.commands} commands)`
    );
  }

  async load(): Promise<CatalogIndex | null> {
    if (!existsSync(this.catalogPath)) {
      return null;
    }

    try {
      const content = await readFile(this.catalogPath, 'utf-8');
      return JSON.parse(content) as CatalogIndex;
    } catch (error) {
      console.error('Failed to load catalog index:', error);
      return null;
    }
  }

  private async scanMCPs(): Promise<CatalogItem[]> {
    const mcpDir = join(this.projectRoot, 'mcp');
    const items: CatalogItem[] = [];

    if (!existsSync(mcpDir)) {
      return items;
    }

    const entries = await readdir(mcpDir);

    for (const entry of entries) {
      if (entry.endsWith('.mjs') || entry.endsWith('.js')) {
        const fullPath = join(mcpDir, entry);
        const item = await this.parseMCPFile(fullPath);
        if (item) {
          items.push(item);
        }
      }
    }

    return items;
  }

  private async parseMCPFile(filePath: string): Promise<CatalogItem | null> {
    try {
      const content = await readFile(filePath, 'utf-8');
      const name =
        filePath
          .split('/')
          .pop()
          ?.replace(/\.(mjs|js)$/, '') || '';

      // Extract metadata from comments or basic analysis
      const description = this.extractMCPDescription(content);
      const tags = ['mcp', 'server'];

      // Generate hash
      const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 7);

      return {
        id: `codeflow-core/mcp-${name}`,
        kind: 'mcp',
        name: name,
        version: '1.0.0',
        description: description.substring(0, 200),
        tags: tags,
        license: 'MIT',
        source: 'codeflow-core',
        dependencies: [],
        install_targets: ['mcp'],
        conversion_rules: {
          base_path: relative(this.projectRoot, filePath),
          supports_all_formats: false,
          supports_formats: ['mcp'],
        },
        provenance: {
          repo: 'ferg-cod3s/codeflow',
          path: relative(this.projectRoot, filePath),
          sha: hash,
          license: 'MIT',
          attribution: 'Codeflow Team',
        },
      };
    } catch (error) {
      console.warn(`Failed to parse MCP file ${filePath}:`, error);
      return null;
    }
  }

  private extractMCPDescription(content: string): string {
    // Look for comments or basic description
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.trim().startsWith('//') || line.trim().startsWith('/*')) {
        const desc = line.replace(/\/\/|\/\*/, '').trim();
        if (desc.length > 10) {
          return desc;
        }
      }
    }
    return 'MCP server implementation';
  }
}

export default CatalogIndexBuilder;
