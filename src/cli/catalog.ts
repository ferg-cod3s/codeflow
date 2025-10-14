import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';
import { homedir } from 'os';
import CatalogIndexBuilder, { CatalogIndex, CatalogItem } from '../catalog/index-builder.js';
import { ImportPipeline } from '../catalog/import-pipeline.js';
import { FormatConverter } from '../conversion/format-converter.js';
import { AgentValidator } from '../conversion/validator.js';
import { ModelFixer } from '../catalog/model-fixer.js';
import { parseAgentFile } from '../conversion/agent-parser.js';
import CLIErrorHandler from './error-handler.js';

export class CatalogCLI {
  private projectRoot: string;
  private catalogIndex: CatalogIndex | null = null;
  private converter: FormatConverter;
  private validator: AgentValidator;
  private modelFixer: ModelFixer;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.converter = new FormatConverter();
    this.validator = new AgentValidator();
    this.modelFixer = new ModelFixer(projectRoot);
  }

  async loadCatalog(): Promise<CatalogIndex> {
    if (this.catalogIndex) {
      return this.catalogIndex;
    }

    const builder = new CatalogIndexBuilder(this.projectRoot);
    this.catalogIndex = await builder.load();

    if (!this.catalogIndex) {
      CLIErrorHandler.displayWarning('Catalog index not found. Building from local sources...', [
        'Run "codeflow catalog build" to create the catalog',
      ]);
      this.catalogIndex = await builder.buildFromLocal();
      await builder.save(this.catalogIndex);
    }

    return this.catalogIndex;
  }

  // Main catalog command dispatcher
  async execute(subcommand: string, options: any = {}): Promise<void> {
    try {
      switch (subcommand) {
        case 'list':
          await this.list(options);
          break;
        case 'search':
          await this.search(options.query, options);
          break;
        case 'info':
          await this.info(options.id);
          break;
        case 'install':
          await this.install(options.id, options);
          break;
        case 'install-all':
          await this.installAll(options);
          break;
        case 'update':
          await this.update(options.id);
          break;
        case 'remove':
          await this.remove(options.id);
          break;
        case 'build':
          await this.build(options);
          break;
        case 'import':
          await this.import(options.source || options.id, options);
          break;
        case 'sync':
          await this.sync(options);
          break;
        case 'health-check':
          await this.healthCheck();
          break;
        default:
          await this.showHelp();
      }
    } catch (error) {
      CLIErrorHandler.handleCommonError(error, 'catalog');
    }
  }

  // List available items in the catalog
  async list(options: { type?: string; source?: string; tags?: string[] } = {}): Promise<void> {
    const catalog = await this.loadCatalog();

    let items = catalog.items;

    // Filter by type
    if (options.type) {
      items = items.filter((item) => item.kind === options.type);
    }

    // Filter by source
    if (options.source) {
      items = items.filter((item) => item.source === options.source);
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      items = items.filter((item) => options.tags!.some((tag) => item.tags.includes(tag)));
    }

    // Display results in a table format
    console.log('\n📦 Available Catalog Items\n');
    console.log(
      '┌─────────────────────────┬──────────┬──────────────────────────────┬─────────────┬──────────────┐'
    );
    console.log(
      '│ ID                      │ Type     │ Description                  │ Tags        │ Targets      │'
    );
    console.log(
      '├─────────────────────────┼──────────┼──────────────────────────────┼─────────────┼──────────────┤'
    );

    items.slice(0, 20).forEach((item) => {
      const id = item.id.substring(0, 23).padEnd(23);
      const type = item.kind.padEnd(8);
      const desc = item.description.substring(0, 28).padEnd(28);
      const tags = item.tags.slice(0, 2).join(', ').substring(0, 11).padEnd(11);
      const targets = item.install_targets.join(', ').substring(0, 12).padEnd(12);

      console.log(`│ ${id} │ ${type} │ ${desc} │ ${tags} │ ${targets} │`);
    });

    console.log(
      '└─────────────────────────┴──────────┴──────────────────────────────┴─────────────┴──────────────┘'
    );

    if (items.length > 20) {
      console.log(`\n... and ${items.length - 20} more items`);
    }

    console.log(`\n📊 Total: ${items.length} items`);
  }

  // Search for items in the catalog
  async search(query: string, options: { tags?: string[] } = {}): Promise<void> {
    if (!query) {
      CLIErrorHandler.displayError({
        command: 'catalog-search',
        phase: 'validation',
        errorType: 'missing_query',
        expected: 'Search query',
        found: 'No query provided',
        mitigation: 'Provide a search term',
        requiresUserInput: true,
      });
      return;
    }

    const catalog = await this.loadCatalog();
    const searchTerm = query.toLowerCase();

    let results = catalog.items.filter(
      (item) =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
    );

    // Additional tag filtering
    if (options.tags && options.tags.length > 0) {
      results = results.filter((item) => options.tags!.some((tag) => item.tags.includes(tag)));
    }

    if (results.length === 0) {
      console.log(`\n❌ No results found for "${query}"`);
      return;
    }

    console.log(`\n🔍 Found ${results.length} matches for "${query}":\n`);

    results.forEach((item) => {
      console.log(`  ${item.id}`);
      console.log(`    ${item.description.substring(0, 80)}`);
      console.log(`    Tags: ${item.tags.join(', ')}`);
      console.log('');
    });
  }

  // Show detailed information about a catalog item
  async info(itemId: string): Promise<void> {
    if (!itemId) {
      CLIErrorHandler.displayError({
        command: 'catalog-info',
        phase: 'validation',
        errorType: 'missing_id',
        expected: 'Item ID',
        found: 'No ID provided',
        mitigation: 'Provide an item ID',
        requiresUserInput: true,
      });
      return;
    }

    const catalog = await this.loadCatalog();
    const item = catalog.items.find((i) => i.id === itemId);

    if (!item) {
      console.log(`\n❌ Item not found: ${itemId}`);
      return;
    }

    console.log(`\n📦 ${item.name}`);
    console.log('═'.repeat(50));
    console.log(`ID:           ${item.id}`);
    console.log(`Type:         ${item.kind}`);
    console.log(`Version:      ${item.version}`);
    console.log(`Source:       ${item.source}`);
    console.log(`License:      ${item.license}`);
    console.log(`\nDescription:`);
    console.log(`  ${item.description}`);
    console.log(`\nTags:         ${item.tags.join(', ')}`);
    console.log(`Targets:      ${item.install_targets.join(', ')}`);

    if (item.dependencies.length > 0) {
      console.log(`\nDependencies:`);
      item.dependencies.forEach((dep) => console.log(`  - ${dep}`));
    }

    console.log(`\nProvenance:`);
    console.log(`  Repository:  ${item.provenance.repo}`);
    console.log(`  Path:        ${item.provenance.path}`);
    console.log(`  Attribution: ${item.provenance.attribution}`);
  }

  // Install an item from the catalog
  async install(
    itemId: string,
    options: { target?: string[]; global?: boolean; dryRun?: boolean } = {}
  ): Promise<void> {
    if (!itemId) {
      CLIErrorHandler.displayError({
        command: 'catalog-install',
        phase: 'validation',
        errorType: 'missing_id',
        expected: 'Item ID',
        found: 'No ID provided',
        mitigation: 'Provide an item ID to install',
        requiresUserInput: true,
      });
      return;
    }

    const catalog = await this.loadCatalog();
    const item = catalog.items.find((i) => i.id === itemId);

    if (!item) {
      console.log(`\n❌ Item not found: ${itemId}`);
      return;
    }

    const targets = options.target || item.install_targets;

    console.log(`\n📦 Installing ${item.name}...`);

    if (options.dryRun) {
      console.log('🔍 Dry run mode - no changes will be made');
    }

    for (const target of targets) {
      await this.installToTarget(item, target, options);
    }

    console.log(`\n✅ Successfully installed ${item.name}`);
  }

  // Install all items from the catalog
  async installAll(
    options: {
      target?: string[];
      global?: boolean;
      dryRun?: boolean;
      source?: string;
      id?: string;
    } = {}
  ): Promise<void> {
    const catalog = await this.loadCatalog();

    let items = catalog.items;

    // Filter by source if specified
    if (options.source) {
      items = items.filter((item) => item.source === options.source);
    }

    if (items.length === 0) {
      console.log(`\n❌ No items found to install`);
      return;
    }

    const targets = options.target || ['claude-code', 'opencode'];

    console.log(`\n📦 Installing all ${items.length} items from catalog...`);
    console.log(`Targets: ${targets.join(', ')}`);

    if (options.dryRun) {
      console.log('🔍 Dry run mode - no changes will be made');
    }

    let successCount = 0;
    let errorCount = 0;

    for (const item of items) {
      try {
        console.log(`\n📥 Installing ${item.name} (${item.kind})...`);
        await this.install(item.id, options);
        successCount++;
      } catch (error) {
        console.error(`❌ Failed to install ${item.name}: ${error}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Installation Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📦 Total: ${items.length}`);
  }

  private async installToTarget(
    item: CatalogItem,
    target: string,
    options: { global?: boolean; dryRun?: boolean }
  ): Promise<void> {
    const home = homedir();
    let targetPath: string;

    // Determine target path based on format and scope
    if (options.global) {
      switch (target) {
        case 'claude-code':
          targetPath = join(
            home,
            '.claude',
            item.kind === 'command' ? 'commands' : 'agents',
            `${item.name}.md`
          );
          break;
        case 'opencode':
          targetPath = join(
            home,
            '.config',
            'opencode',
            item.kind === 'command' ? 'command' : 'agent',
            `${item.name}.md`
          );
          break;
        default:
          console.warn(`⚠️  Unknown target: ${target}`);
          return;
      }
    } else {
      switch (target) {
        case 'claude-code':
          targetPath = join(
            this.projectRoot,
            '.claude',
            item.kind === 'command' ? 'commands' : 'agents',
            `${item.name}.md`
          );
          break;
        case 'opencode':
          targetPath = join(
            this.projectRoot,
            '.opencode',
            item.kind === 'command' ? 'command' : 'agent',
            `${item.name}.md`
          );
          break;
        default:
          console.warn(`⚠️  Unknown target: ${target}`);
          return;
      }
    }

    // Read source file
    const sourcePath = join(this.projectRoot, item.conversion_rules.base_path);

    if (!existsSync(sourcePath)) {
      console.error(`❌ Source file not found: ${sourcePath}`);
      return;
    }

    const content = await readFile(sourcePath, 'utf-8');

    // Parse the content into an Agent object
    const sourceFormat = 'base'; // Assuming source is always in base format
    let agent: any;
    try {
      agent = await parseAgentFile(sourcePath, sourceFormat);
      if (!agent) {
        console.error(`❌ Failed to parse agent from ${sourcePath}`);
        return;
      }
    } catch (error) {
      console.error(`❌ Error parsing agent: ${(error as Error).message}`);
      return;
    }

    // Convert format if needed
    let convertedAgent = agent;
    if (target === 'claude-code' || target === 'opencode') {
      try {
        const targetFormat = target;
        // Convert the agent object
        convertedAgent = this.converter.convert(agent, targetFormat);
        // Fix model configuration for the target
        convertedAgent.content = this.modelFixer.fixModel(
          convertedAgent.content,
          targetFormat,
          item.kind as 'agent' | 'command'
        );
      } catch (error) {
        // If conversion fails, use original agent
        console.warn(`⚠️  Conversion failed for ${target}, using original format`);
        convertedAgent = agent;
      }
    }

    // Validate converted agent
    const validation = this.validator.validateAgent(convertedAgent);
    if (!validation.valid) {
      console.error(
        `❌ Validation failed for ${target}:`,
        validation.errors.map((e) => e.message)
      );
      return;
    }

    if (!options.dryRun) {
      // Create directory if needed
      const targetDir = dirname(targetPath);
      if (!existsSync(targetDir)) {
        await mkdir(targetDir, { recursive: true });
      }

      // Write file
      await writeFile(targetPath, convertedAgent.content, 'utf-8');
      console.log(`  ✓ Installed to ${targetPath}`);
    } else {
      console.log(`  [DRY RUN] Would install to ${targetPath}`);
    }
  }

  // Build/rebuild the catalog index
  async build(options: { force?: boolean } = {}): Promise<void> {
    console.log('\n🏗️  Building catalog index...\n');

    const builder = new CatalogIndexBuilder(this.projectRoot);

    if (!options.force) {
      const existing = await builder.load();
      if (existing) {
        console.log('⚠️  Catalog already exists. Use --force to rebuild.');
        return;
      }
    }

    const index = await builder.buildFromLocal();
    await builder.save(index);

    console.log('\n✅ Catalog built successfully!');
    console.log(`📊 Total items: ${index.stats.total_items}`);
    console.log(`   - Agents: ${index.stats.agents}`);
    console.log(`   - Commands: ${index.stats.commands}`);
    console.log(`   - Templates: ${index.stats.templates}`);
  }

  // Import from external sources
  async import(
    source: string,
    options: { adapter?: string; filter?: string[]; exclude?: string[]; dryRun?: boolean } = {}
  ): Promise<void> {
    const pipeline = new ImportPipeline(this.projectRoot);

    try {
      await pipeline.import(source, {
        adapter: options.adapter,
        filter: options.filter,
        exclude: options.exclude,
        dryRun: options.dryRun,
        resolvedDependencies: true,
      });

      // Generate third-party notices if items were imported
      if (!options.dryRun) {
        await pipeline.generateThirdPartyNotices();
        console.log('\n📄 Updated THIRD_PARTY_NOTICES.md');
      }
    } catch (error) {
      CLIErrorHandler.handleCommonError(error, 'catalog-import');
    }
  }

  // Sync catalog items to configured locations
  async sync(options: { global?: boolean; dryRun?: boolean } = {}): Promise<void> {
    const catalog = await this.loadCatalog();

    console.log(
      `\n🔄 Syncing catalog items to ${options.global ? 'global' : 'project'} directories...`
    );

    if (options.dryRun) {
      console.log('🔍 Dry run mode - no changes will be made');
    }

    let syncCount = 0;
    for (const item of catalog.items) {
      if (item.source === 'codeflow-core') {
        for (const target of item.install_targets) {
          await this.installToTarget(item, target, {
            global: options.global,
            dryRun: options.dryRun,
          });
          syncCount++;
        }
      }
    }

    console.log(`\n✅ Synced ${syncCount} items`);
  }

  // Health check for installed items
  async healthCheck(): Promise<void> {
    console.log('\n🏥 Running catalog health check...\n');

    const catalog = await this.loadCatalog();
    let valid = 0;
    let missing = 0;
    let invalid = 0;

    for (const item of catalog.items) {
      const sourcePath = join(this.projectRoot, item.conversion_rules.base_path);

      if (!existsSync(sourcePath)) {
        missing++;
        console.log(`❌ Missing: ${item.id}`);
      } else {
        try {
          const __content = await readFile(sourcePath, 'utf-8');
          const agent = await parseAgentFile(sourcePath, 'base');
          if (!agent) {
            invalid++;
            console.log(`⚠️  Failed to parse: ${item.id}`);
            continue;
          }
          const validation = this.validator.validateAgent(agent);

          if (validation.valid) {
            valid++;
          } else {
            invalid++;
            console.log(`⚠️  Invalid: ${item.id}`);
            validation.errors.forEach((err) => console.log(`    - ${err.message}`));
          }
        } catch (_error) {
          invalid++;
          console.log(`⚠️  Error reading: ${item.id}`);
        }
      }
    }

    console.log('\n📊 Health Check Results:');
    console.log(`   ✅ Valid: ${valid}`);
    console.log(`   ❌ Missing: ${missing}`);
    console.log(`   ⚠️  Invalid: ${invalid}`);
  }

  // Update an installed item
  async update(itemId?: string): Promise<void> {
    if (itemId) {
      console.log(`\n🔄 Updating ${itemId}...`);
    } else {
      console.log('\n🔄 Checking for updates...');
    }

    console.log('⚠️  Update functionality not yet implemented');
  }

  // Remove an installed item
  async remove(itemId: string): Promise<void> {
    console.log(`\n🗑️  Removing ${itemId}...`);
    console.log('⚠️  Remove functionality not yet implemented');
  }

  // Show help for catalog commands
  async showHelp(): Promise<void> {
    console.log(`
📦 Codeflow Catalog - Manage agents, commands, and templates

Usage:
  codeflow catalog <subcommand> [options]

Subcommands:
  list [--type agent|command|template] [--source name] [--tags tag1,tag2]
    List available catalog items

  search <query> [--tags tag1,tag2]
    Search for items in the catalog

  info <item-id>
    Show detailed information about an item

   install <item-id> [--target claude-code,opencode] [--global] [--dry-run]
     Install an item from the catalog

   install-all [--target claude-code,opencode] [--global] [--dry-run] [--source name]
     Install all items from the catalog

   update [item-id]
    Update installed items to latest versions

  remove <item-id>
    Remove an installed item

  build [--force]
    Build or rebuild the catalog index

  import <source> [--adapter name] [--filter patterns] [--dry-run]
    Import items from external sources

  sync [--global] [--dry-run]
    Sync all catalog items to configured locations

  health-check
    Validate installed components

 Examples:
   codeflow catalog list --type agent
   codeflow catalog search "code review"
   codeflow catalog install codeflow-core/code-reviewer --global
   codeflow catalog install-all --global --dry-run  # Preview installing all items
   codeflow catalog sync --global
   codeflow catalog import davila7/claude-code-templates
   codeflow catalog import davila7/claude-code-templates --dry-run  # Preview import

This replaces the previous commands:
  - codeflow setup → catalog install + sync
  - codeflow convert → catalog install with --target
  - codeflow sync → catalog sync
`);
  }
}

// Export the main catalog function
export async function catalog(subcommand: string, options: any = {}): Promise<void> {
  const cli = new CatalogCLI(process.cwd());
  await cli.execute(subcommand, options);
}
