import { writeFile } from 'fs/promises';
import { join } from 'path';
import { CatalogItem, CatalogIndex, CatalogIndexBuilder } from './index-builder.js';
import { SourceAdapter } from './adapters/base-adapter.js';
import { ClaudeTemplatesAdapter } from './adapters/claude-templates-adapter.js';
import semver from 'semver';





export interface ImportOptions {
  adapter?: string;
  filter?: string[];
  exclude?: string[];
  dryRun?: boolean;
  force?: boolean;
  resolvedDependencies?: boolean;
}

export interface ImportReport {
  totalScanned: number;
  totalImported: number;
  skipped: number;
  errors: string[];
  warnings: string[];
  importedItems: CatalogItem[];
  dependencyResolution: DependencyResolution[];
}

export interface DependencyResolution {
  itemId: string;
  dependencies: string[];
  resolved: string[];
  missing: string[];
  circular: boolean;
}

export interface VersionConflict {
  itemId: string;
  existingVersion: string;
  newVersion: string;
  resolution: 'keep' | 'update' | 'error';
}

export class ImportPipeline {
  private projectRoot: string;
  private catalogBuilder: CatalogIndexBuilder;
  private catalog: CatalogIndex | null = null;
  private adapters: Map<string, typeof SourceAdapter> = new Map();

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
    this.catalogBuilder = new CatalogIndexBuilder(projectRoot);

    // Register available adapters
    this.registerAdapter('claude-templates', ClaudeTemplatesAdapter);
  }

  registerAdapter(name: string, adapterClass: typeof SourceAdapter) {
    this.adapters.set(name, adapterClass);
  }

  async loadCatalog(): Promise<CatalogIndex> {
    if (!this.catalog) {
      this.catalog = await this.catalogBuilder.load();
      if (!this.catalog) {
        this.catalog = await this.catalogBuilder.buildFromLocal();
      }
    }
    return this.catalog;
  }

  async import(source: string, options: ImportOptions = {}): Promise<ImportReport> {
    const report: ImportReport = {
      totalScanned: 0,
      totalImported: 0,
      skipped: 0,
      errors: [],
      warnings: [],
      importedItems: [],
      dependencyResolution: [],
    };

    try {
      // Load current catalog
      const catalog = await this.loadCatalog();

      // Determine adapter
      const adapterName = options.adapter || this.detectAdapter(source);
      if (!adapterName) {
        throw new Error(`No adapter found for source: ${source}`);
      }

      const AdapterClass = this.adapters.get(adapterName);
      if (!AdapterClass) {
        throw new Error(`Adapter not found: ${adapterName}`);
      }

      // Create adapter instance
      const adapter = new (AdapterClass as any)({
        repoUrl: source,
        filter: options.filter,
        exclude: options.exclude,
      });

      console.log(`\n📥 Importing from ${source} using ${adapterName} adapter...`);

      if (options.dryRun) {
        console.log('🔍 Dry run mode - no changes will be made\n');
      }

      // Scan repository
      const items = await adapter.scan();
      report.totalScanned = items.length;
      console.log(`📊 Found ${items.length} items to import\n`);

      // Process each item
      for (const item of items) {
        try {
          // Check for version conflicts
          const conflict = await this.checkVersionConflict(item, catalog);
          if (conflict && conflict.resolution === 'error') {
            report.errors.push(
              `Version conflict for ${item.id}: ${conflict.existingVersion} vs ${conflict.newVersion}`
            );
            report.skipped++;
            continue;
          }

          if (conflict && conflict.resolution === 'keep') {
            report.warnings.push(
              `Keeping existing version of ${item.id} (${conflict.existingVersion})`
            );
            report.skipped++;
            continue;
          }

          // Validate item
          const validation = adapter.validate(item);
          if (!validation.valid) {
            report.errors.push(`Invalid item ${item.id}: ${validation.errors.join(', ')}`);
            report.skipped++;
            continue;
          }

          // Resolve dependencies
          if (options.resolvedDependencies) {
            const resolution = await this.resolveDependencies(item, catalog);
            report.dependencyResolution.push(resolution);

            if (resolution.missing.length > 0) {
              report.warnings.push(
                `Missing dependencies for ${item.id}: ${resolution.missing.join(', ')}`
              );
            }

            if (resolution.circular) {
              report.warnings.push(`Circular dependency detected for ${item.id}`);
            }
          }

          // Import the item
          if (!options.dryRun) {
            const targetPath = join(this.projectRoot, 'imported', item.source, `${item.name}.md`);
            const importResult = await adapter.import(item, targetPath);

            if (importResult.success) {
              report.totalImported += importResult.itemsImported;
              report.importedItems.push(item);

              // Add to catalog
              catalog.items.push(item);
              catalog.stats.total_items++;
              if (item.kind === 'template') {
                catalog.stats.templates++;
              }
            } else {
              report.errors.push(...importResult.errors);
            }

            report.warnings.push(...importResult.warnings);
          } else {
            console.log(`[DRY RUN] Would import ${item.id}`);
            report.totalImported++;
            report.importedItems.push(item);
          }
        } catch (error) {
          report.errors.push(`Failed to import ${item.id}: ${error}`);
          report.skipped++;
        }
      }

      // Update catalog source if new
      if (!catalog.sources[adapterName]) {
        catalog.sources[adapterName] = {
          name: adapter.name,
          description: adapter.description,
          url: source,
          type: 'external',
          adapter: adapterName,
        };
      }

      // Save updated catalog
      if (!options.dryRun && report.totalImported > 0) {
        catalog.updated = new Date().toISOString();
        await this.catalogBuilder.save(catalog);
        console.log('\n✅ Catalog updated');
      }

      // Clean up
      await adapter.cleanup();
    } catch (error) {
      report.errors.push(`Import failed: ${error}`);
    }

    // Print summary
    this.printImportSummary(report);

    return report;
  }

  private detectAdapter(source: string): string | null {
    // Simple detection based on URL patterns
    if (source.includes('davila7/claude-code-templates')) {
      return 'claude-templates';
    }

    // Add more patterns as needed

    return null;
  }

  private async checkVersionConflict(
    item: CatalogItem,
    catalog: CatalogIndex
  ): Promise<VersionConflict | null> {
    const existing = catalog.items.find((i) => i.id === item.id);

    if (!existing) {
      return null;
    }

    const comparison = semver.compare(existing.version, item.version);

    if (comparison === 0) {
      // Same version, skip
      return {
        itemId: item.id,
        existingVersion: existing.version,
        newVersion: item.version,
        resolution: 'keep',
      };
    }

    if (comparison > 0) {
      // Existing is newer
      return {
        itemId: item.id,
        existingVersion: existing.version,
        newVersion: item.version,
        resolution: 'keep',
      };
    }

    // New version is newer
    return {
      itemId: item.id,
      existingVersion: existing.version,
      newVersion: item.version,
      resolution: 'update',
    };
  }

  private async resolveDependencies(
    item: CatalogItem,
    catalog: CatalogIndex
  ): Promise<DependencyResolution> {
    const resolution: DependencyResolution = {
      itemId: item.id,
      dependencies: item.dependencies,
      resolved: [],
      missing: [],
      circular: false,
    };

    const visited = new Set<string>();
    const stack = new Set<string>();

    const resolve = (depId: string): boolean => {
      if (stack.has(depId)) {
        resolution.circular = true;
        return false;
      }

      if (visited.has(depId)) {
        return true;
      }

      visited.add(depId);
      stack.add(depId);

      // Find dependency in catalog
      const dep = catalog.items.find(
        (i) => i.name === depId || i.id === depId || i.id === `codeflow-core/${depId}`
      );

      if (!dep) {
        resolution.missing.push(depId);
        stack.delete(depId);
        return false;
      }

      resolution.resolved.push(depId);

      // Recursively resolve dependencies
      for (const subDep of dep.dependencies) {
        resolve(subDep);
      }

      stack.delete(depId);
      return true;
    };

    // Resolve all dependencies
    for (const dep of item.dependencies) {
      resolve(dep);
    }

    return resolution;
  }

  private printImportSummary(report: ImportReport): void {
    console.log('\n📋 Import Summary');
    console.log('═══════════════════════════════');
    console.log(`Total Scanned:  ${report.totalScanned}`);
    console.log(`Total Imported: ${report.totalImported}`);
    console.log(`Skipped:        ${report.skipped}`);

    if (report.errors.length > 0) {
      console.log('\n❌ Errors:');
      report.errors.forEach((err) => console.log(`  - ${err}`));
    }

    if (report.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      report.warnings.forEach((warn) => console.log(`  - ${warn}`));
    }

    if (report.dependencyResolution.length > 0) {
      console.log('\n🔗 Dependency Resolution:');
      report.dependencyResolution.forEach((res) => {
        console.log(`  ${res.itemId}:`);
        if (res.resolved.length > 0) {
          console.log(`    ✓ Resolved: ${res.resolved.join(', ')}`);
        }
        if (res.missing.length > 0) {
          console.log(`    ✗ Missing: ${res.missing.join(', ')}`);
        }
        if (res.circular) {
          console.log(`    ⚠ Circular dependency detected`);
        }
      });
    }

    if (report.importedItems.length > 0) {
      console.log('\n📦 Imported Items:');
      report.importedItems.forEach((item) => {
        console.log(`  - ${item.id} (${item.kind})`);
      });
    }
  }

  // Export catalog with third-party notices
  async generateThirdPartyNotices(): Promise<string> {
    const catalog = await this.loadCatalog();
    const notices: string[] = ['# Third Party Notices\n'];

    // Group items by source
    const bySource = new Map<string, CatalogItem[]>();
    for (const item of catalog.items) {
      if (item.source !== 'codeflow-core') {
        const items = bySource.get(item.source) || [];
        items.push(item);
        bySource.set(item.source, items);
      }
    }

    // Generate notices for each source
    for (const [source, items] of bySource) {
      const sourceInfo = catalog.sources[source];
      if (sourceInfo) {
        notices.push(`## ${sourceInfo.name}\n`);
        notices.push(`- **Repository**: ${sourceInfo.url}`);
        notices.push(`- **Description**: ${sourceInfo.description}`);
        notices.push(`- **Items**: ${items.length} items imported\n`);

        // List unique licenses
        const licenses = [...new Set(items.map((i) => i.license))];
        notices.push(`### Licenses`);
        licenses.forEach((license) => {
          notices.push(`- ${license}`);
        });

        notices.push('\n### Imported Items');
        items.forEach((item) => {
          notices.push(`- **${item.name}**: ${item.description.substring(0, 80)}...`);
          notices.push(`  - License: ${item.license}`);
          notices.push(`  - Attribution: ${item.provenance.attribution}`);
        });

        notices.push('\n---\n');
      }
    }

    const content = notices.join('\n');
    const noticesPath = join(this.projectRoot, 'THIRD_PARTY_NOTICES.md');
    await writeFile(noticesPath, content, 'utf-8');

    return content;
  }
}

export default ImportPipeline;
