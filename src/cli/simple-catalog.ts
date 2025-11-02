import { join } from 'path';
import { existsSync, readFileSync } from 'fs';
import { CatalogIndex, CatalogItem } from '../catalog/index-builder.js';
import { FormatConverter } from '../conversion/format-converter.js';
import { parseAgentFile } from '../conversion/agent-parser.js';





export class SimpleCatalogCLI {
  private projectRoot: string;
  private catalogPath: string;
  private converter: FormatConverter;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.catalogPath = join(projectRoot, 'CATALOG_INDEX.json');
    this.converter = new FormatConverter();
  }

  private loadCatalog(): CatalogIndex | null {
    if (!existsSync(this.catalogPath)) {
      return null;
    }
    try {
      const data = readFileSync(this.catalogPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load catalog:', error);
      return null;
    }
  }

  async search(term: string): Promise<void> {
    const catalog = this.loadCatalog();
    if (!catalog) {
      console.log('❌ No catalog found. Run "codeflow catalog build" first.');
      return;
    }

    const matches = catalog.items.filter(
      (item) =>
        item.name.toLowerCase().includes(term.toLowerCase()) ||
        item.description.toLowerCase().includes(term.toLowerCase()) ||
        item.tags.some((tag) => tag.toLowerCase().includes(term.toLowerCase()))
    );

    if (matches.length === 0) {
      console.log(`❌ No items found matching "${term}"`);
      return;
    }

    console.log(`\n🔍 Found ${matches.length} items matching "${term}":\n`);

    matches.forEach((item, index) => {
      console.log(`${index + 1}. ${item.name} (${item.kind})`);
      console.log(`   ${item.description}`);
      console.log(`   Tags: ${item.tags.join(', ')}`);
      console.log(`   Install: codeflow catalog install ${item.id}\n`);
    });
  }

  async install(itemId: string, targetFormat: string = 'all'): Promise<void> {
    const catalog = this.loadCatalog();
    if (!catalog) {
      console.log('❌ No catalog found. Run "codeflow catalog build" first.');
      return;
    }

    const item = catalog.items.find((i) => i.id === itemId);
    if (!item) {
      console.log(`❌ Item "${itemId}" not found in catalog.`);
      return;
    }

    console.log(`📦 Installing ${item.name}...`);

    // Read the base format file
    const basePath = join(this.projectRoot, item.conversion_rules.base_path);
    if (!existsSync(basePath)) {
      console.log(`❌ Base file not found: ${basePath}`);
      return;
    }

    const content = readFileSync(basePath, 'utf-8');
    const agent = await parseAgentFile(content, 'base');

    // Convert and install to target formats
    const targets: Array<'claude-code' | 'opencode'> = [];
    if (targetFormat === 'all' || targetFormat === 'claude-code') {
      targets.push('claude-code');
    }
    if (targetFormat === 'all' || targetFormat === 'opencode') {
      targets.push('opencode');
    }

    for (const target of targets) {
      try {
        const converted = this.converter.convert(agent, target as any);
        const targetPath = this.getTargetPath(item, target);

        // Write the converted file
        await this.writeFile(targetPath, converted.content);
        console.log(`✅ Installed to ${target}: ${targetPath}`);
      } catch (error) {
        console.log(`❌ Failed to install to ${target}: ${error}`);
      }
    }
  }

  async list(type?: string): Promise<void> {
    const catalog = this.loadCatalog();
    if (!catalog) {
      console.log('❌ No catalog found. Run "codeflow catalog build" first.');
      return;
    }

    let items = catalog.items;
    if (type) {
      items = items.filter((item) => item.kind === type);
    }

    console.log(`\n📋 Catalog Items (${items.length} total):\n`);

    const grouped = items.reduce(
      (acc, item) => {
        if (!acc[item.kind]) acc[item.kind] = [];
        acc[item.kind].push(item);
        return acc;
      },
      {} as Record<string, CatalogItem[]>
    );

    Object.entries(grouped).forEach(([kind, items]) => {
      console.log(`${kind.toUpperCase()} (${items.length}):`);
      items.forEach((item) => {
        console.log(`  - ${item.name}: ${item.description.substring(0, 60)}...`);
      });
      console.log('');
    });
  }

  async build(): Promise<void> {
    // Use existing build script
    const { execSync } = await import('child_process');
    console.log('🏗️ Building catalog index...');
    execSync('node scripts/build-catalog.js', { stdio: 'inherit' });
  }

  private getTargetPath(item: CatalogItem, target: string): string {
    // Simple mapping - could be enhanced
    const baseName = item.name.replace(/[^a-zA-Z0-9-_]/g, '-');
    switch (target) {
      case 'claude-code':
        return join(this.projectRoot, '.claude', 'agents', `${baseName}.md`);
      case 'opencode':
        return join(this.projectRoot, '.opencode', 'agent', `${baseName}.md`);
      default:
        throw new Error(`Unknown target format: ${target}`);
    }
  }

  private async writeFile(path: string, content: string): Promise<void> {
    const { writeFile, mkdir } = await import('fs/promises');
    const { dirname } = await import('path');
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, 'utf-8');
  }
}
