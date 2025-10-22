/**
 * Table Display Component
 * Renders data in styled tables
 */

import Table from 'cli-table3';
import chalk from 'chalk';
import type { Theme } from '../themes/types.js';
import { getTheme } from '../themes/index.js';

/**
 * Table display options
 */
export interface TableDisplayOptions {
  theme?: Theme;
  compact?: boolean;
  showHeader?: boolean;
  colWidths?: number[];
  wordWrap?: boolean;
}

/**
 * Table row data
 */
export type TableRow = Record<string, string | number | boolean | null | undefined>;

/**
 * Table Display Component
 */
export class TableDisplay {
  private theme: Theme;
  private options: Required<TableDisplayOptions>;

  constructor(options: TableDisplayOptions = {}) {
    this.theme = options.theme ?? getTheme();
    this.options = {
      theme: this.theme,
      compact: options.compact ?? false,
      showHeader: options.showHeader ?? true,
      colWidths: options.colWidths ?? [],
      wordWrap: options.wordWrap ?? true,
    };
  }

  /**
   * Render a table from array of objects
   */
  render(data: TableRow[], headers?: string[]): string {
    if (data.length === 0) {
      return chalk.dim('No data to display');
    }

    const columns = headers ?? Object.keys(data[0]);

    const tableConfig: any = {
      head: this.options.showHeader
        ? columns.map((col) => (chalk as any)[this.theme.colors.primary](col))
        : undefined,
      wordWrap: this.options.wordWrap,
      style: {
        'padding-left': 1,
        'padding-right': 1,
        head: [],
        border: [],
        compact: this.options.compact,
      },
    };

    // Only add colWidths if specified
    if (this.options.colWidths && this.options.colWidths.length > 0) {
      tableConfig.colWidths = this.options.colWidths;
    }

    const table = new Table(tableConfig);

    // Add rows
    data.forEach((row) => {
      const values = columns.map((col) => this.formatValue(row[col]));
      table.push(values);
    });

    return table.toString();
  }

  /**
   * Render a simple key-value table
   */
  renderKeyValue(data: Record<string, unknown>): string {
    const table = new Table({
      style: {
        'padding-left': 1,
        'padding-right': 1,
        head: [],
        border: [],
        compact: this.options.compact,
      },
    });

    Object.entries(data).forEach(([key, value]) => {
      table.push([(chalk as any)[this.theme.colors.muted](key), this.formatValue(value)]);
    });

    return table.toString();
  }

  /**
   * Render agents table
   */
  renderAgents(agents: Array<{ name: string; description?: string; tags?: string[] }>): string {
    const table = new Table({
      head: this.options.showHeader
        ? [
            (chalk as any)[this.theme.colors.primary]('Agent'),
            (chalk as any)[this.theme.colors.primary]('Description'),
            (chalk as any)[this.theme.colors.primary]('Tags'),
          ]
        : undefined,
      colWidths: [25, 50, 30],
      wordWrap: true,
      style: {
        'padding-left': 1,
        'padding-right': 1,
        head: [],
        border: [],
        compact: this.options.compact,
      },
    });

    agents.forEach((agent) => {
      table.push([
        (chalk as any)[this.theme.colors.accent](agent.name),
        agent.description ?? chalk.dim('No description'),
        agent.tags?.map((t) => (chalk as any)[this.theme.colors.info](t)).join(', ') ?? '',
      ]);
    });

    return table.toString();
  }

  /**
   * Render results summary table
   */
  renderResultsSummary(
    results: Array<{
      metric: string;
      value: string | number;
      status?: 'success' | 'warning' | 'error' | 'info';
    }>
  ): string {
    const table = new Table({
      head: this.options.showHeader
        ? [
            (chalk as any)[this.theme.colors.primary]('Metric'),
            (chalk as any)[this.theme.colors.primary]('Value'),
            (chalk as any)[this.theme.colors.primary]('Status'),
          ]
        : undefined,
      style: {
        'padding-left': 1,
        'padding-right': 1,
        head: [],
        border: [],
        compact: this.options.compact,
      },
    });

    results.forEach((result) => {
      const statusSymbol = this.getStatusSymbol(result.status);
      const statusColor = result.status ? this.theme.colors[result.status] : 'white';

      table.push([
        (chalk as any)[this.theme.colors.muted](result.metric),
        chalk.bold(String(result.value)),
        (chalk as any)[statusColor](statusSymbol),
      ]);
    });

    return table.toString();
  }

  /**
   * Format a value for display
   */
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return chalk.dim('—');
    }

    if (typeof value === 'boolean') {
      return value
        ? (chalk as any)[this.theme.colors.success]('✓')
        : (chalk as any)[this.theme.colors.error]('✗');
    }

    if (typeof value === 'number') {
      return chalk.bold(String(value));
    }

    if (Array.isArray(value)) {
      return value.map((v) => String(v)).join(', ');
    }

    if (typeof value === 'object') {
      return chalk.dim('[Object]');
    }

    return String(value);
  }

  /**
   * Get status symbol
   */
  private getStatusSymbol(status?: 'success' | 'warning' | 'error' | 'info'): string {
    switch (status) {
      case 'success':
        return '✓';
      case 'warning':
        return '⚠';
      case 'error':
        return '✗';
      case 'info':
        return 'ℹ';
      default:
        return '●';
    }
  }
}

/**
 * Convenience function to create and render a table
 */
export function renderTable(data: TableRow[], options?: TableDisplayOptions): string {
  const display = new TableDisplay(options);
  return display.render(data);
}

/**
 * Convenience function to render key-value table
 */
export function renderKeyValue(
  data: Record<string, unknown>,
  options?: TableDisplayOptions
): string {
  const display = new TableDisplay(options);
  return display.renderKeyValue(data);
}
