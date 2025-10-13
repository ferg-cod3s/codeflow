/**
 * Agent Status Display Component
 * Shows real-time agent execution status
 */

import chalk, { type ChalkInstance } from 'chalk';
import type { Theme, AgentStatus } from '../themes/types.js';
import { getTheme } from '../themes/index.js';
import { renderProgressBar } from './progress-display.js';

/**
 * Agent status display options
 */
export interface AgentStatusDisplayOptions {
  theme?: Theme;
  showProgress?: boolean;
  showTimestamp?: boolean;
  compact?: boolean;
}

/**
 * Agent Status Display Component
 */
export class AgentStatusDisplay {
  private theme: Theme;
  private options: Required<AgentStatusDisplayOptions>;

  constructor(options: AgentStatusDisplayOptions = {}) {
    this.theme = options.theme ?? getTheme();
    this.options = {
      theme: this.theme,
      showProgress: options.showProgress ?? true,
      showTimestamp: options.showTimestamp ?? true,
      compact: options.compact ?? false,
    };
  }

  /**
   * Render a single agent status
   */
  renderAgent(status: AgentStatus): string {
    const symbol = this.getStatusSymbol(status.status);
    const color = this.getStatusColor(status.status);
    const name = (chalk as any)[color].bold(status.name);
    const statusText = (chalk as any)[color](symbol);

    const lines: string[] = [`${statusText} ${name}`];

    if (status.message && !this.options.compact) {
      lines.push(`  ${(chalk as any)[this.theme.colors.muted](status.message)}`);
    }

    if (this.options.showProgress && status.progress !== undefined && status.status === 'running') {
      const progressBar = renderProgressBar(status.progress, 100, {
        theme: this.theme,
        width: 30,
        total: 100,
      });
      lines.push(`  ${progressBar}`);
    }

    if (this.options.showTimestamp && status.startTime) {
      const duration = status.endTime
        ? this.formatDuration(status.startTime, status.endTime)
        : this.formatDuration(status.startTime, new Date());
      lines.push(`  ${chalk.dim(`Duration: ${duration}`)}`);
    }

    return lines.join('\n');
  }

  /**
   * Render multiple agent statuses
   */
  renderAgents(statuses: AgentStatus[]): string {
    if (statuses.length === 0) {
      return chalk.dim('No agents running');
    }

    const lines = statuses.map((status) => this.renderAgent(status));
    return lines.join('\n\n');
  }

  /**
   * Render agent summary
   */
  renderSummary(statuses: AgentStatus[]): string {
    const counts = {
      idle: statuses.filter((s) => s.status === 'idle').length,
      running: statuses.filter((s) => s.status === 'running').length,
      success: statuses.filter((s) => s.status === 'success').length,
      error: statuses.filter((s) => s.status === 'error').length,
      warning: statuses.filter((s) => s.status === 'warning').length,
    };

    const parts: string[] = [];

    if (counts.running > 0) {
      parts.push((chalk as any)[this.theme.colors.info](`${counts.running} running`));
    }
    if (counts.success > 0) {
      parts.push((chalk as any)[this.theme.colors.success](`${counts.success} succeeded`));
    }
    if (counts.error > 0) {
      parts.push((chalk as any)[this.theme.colors.error](`${counts.error} failed`));
    }
    if (counts.warning > 0) {
      parts.push((chalk as any)[this.theme.colors.warning](`${counts.warning} warnings`));
    }
    if (counts.idle > 0) {
      parts.push((chalk as any)[this.theme.colors.muted](`${counts.idle} idle`));
    }

    return parts.join(' | ');
  }

  /**
   * Render agent execution timeline
   */
  renderTimeline(statuses: AgentStatus[]): string {
    const completed = statuses.filter((s) => s.endTime);

    if (completed.length === 0) {
      return chalk.dim('No completed agents');
    }

    const lines = completed
      .sort((a, b) => (a.startTime?.getTime() ?? 0) - (b.startTime?.getTime() ?? 0))
      .map((status) => {
        const symbol = this.getStatusSymbol(status.status);
        const color = this.getStatusColor(status.status);
        const duration =
          status.startTime && status.endTime
            ? this.formatDuration(status.startTime, status.endTime)
            : 'unknown';

        return `${(chalk as any)[color](symbol)} ${chalk.bold(status.name)} ${chalk.dim(`(${duration})`)}`;
      });

    return lines.join('\n');
  }

  /**
   * Get status symbol
   */
  private getStatusSymbol(status: AgentStatus['status']): string {
    switch (status) {
      case 'idle':
        return '○';
      case 'running':
        return '▶';
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      default:
        return '●';
    }
  }

  /**
   * Get status color
   */
  private getStatusColor(status: AgentStatus['status']): string {
    switch (status) {
      case 'idle':
        return this.theme.colors.muted;
      case 'running':
        return this.theme.colors.info;
      case 'success':
        return this.theme.colors.success;
      case 'error':
        return this.theme.colors.error;
      case 'warning':
        return this.theme.colors.warning;
      default:
        return 'white';
    }
  }

  /**
   * Format duration between two dates
   */
  private formatDuration(start: Date, end: Date): string {
    const ms = end.getTime() - start.getTime();
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }
}

/**
 * Convenience function to render agent status
 */
export function renderAgentStatus(
  status: AgentStatus,
  options?: AgentStatusDisplayOptions
): string {
  const display = new AgentStatusDisplay(options);
  return display.renderAgent(status);
}

/**
 * Convenience function to render multiple agents
 */
export function renderAgents(statuses: AgentStatus[], options?: AgentStatusDisplayOptions): string {
  const display = new AgentStatusDisplay(options);
  return display.renderAgents(statuses);
}
