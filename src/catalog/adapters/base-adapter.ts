import { CatalogItem } from '../index-builder.js';

export interface ImportResult {
  success: boolean;
  itemsImported: number;
  errors: string[];
  warnings: string[];
}

export interface AdapterConfig {
  repoUrl: string;
  branch?: string;
  filter?: string[];
  exclude?: string[];
  targetPath?: string;
}

export abstract class SourceAdapter {
  abstract name: string;
  abstract version: string;
  abstract description: string;

  constructor(protected config: AdapterConfig) {}

  /**
   * Scan the repository and return catalog items
   */
  abstract scan(): Promise<CatalogItem[]>;

  /**
   * Import a specific item to the local catalog
   */
  abstract import(item: CatalogItem, targetPath: string): Promise<ImportResult>;

  /**
   * Validate an item before import
   */
  abstract validate(item: CatalogItem): { valid: boolean; errors: string[] };

  /**
   * Clone or fetch the repository
   */
  abstract fetchRepository(): Promise<string>;

  /**
   * Clean up temporary files
   */
  abstract cleanup(): Promise<void>;

  /**
   * Convert external format to base format
   */
  abstract convertToBase(content: string, metadata: any): Promise<string>;

  /**
   * Extract metadata from external format
   */
  abstract extractMetadata(content: string, filePath: string): any;

  /**
   * Check if a file should be imported based on filters
   */
  protected shouldImport(filePath: string): boolean {
    const { filter, exclude } = this.config;

    // Check exclusions first
    if (exclude && exclude.length > 0) {
      for (const pattern of exclude) {
        if (this.matchesPattern(filePath, pattern)) {
          return false;
        }
      }
    }

    // Check inclusions
    if (filter && filter.length > 0) {
      for (const pattern of filter) {
        if (this.matchesPattern(filePath, pattern)) {
          return true;
        }
      }
      return false; // If filter is specified, only include matching files
    }

    return true; // Include by default if no filters
  }

  /**
   * Simple glob pattern matching
   */
  protected matchesPattern(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
      .replace(/\//g, '\\/');
    
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(filePath);
  }

  /**
   * Generate a unique ID for an imported item
   */
  protected generateItemId(sourceName: string, itemName: string): string {
    return `${sourceName}/${itemName}`;
  }

  /**
   * Sanitize item name for use as filename
   */
  protected sanitizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/--+/g, '-')
      .trim();
  }
}

export default SourceAdapter;