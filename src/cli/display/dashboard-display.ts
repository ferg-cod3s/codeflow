/**
 * Dashboard Display Component
 * Provides rich terminal dashboard with real-time status, metrics, and workflow visualization
 */





import chalk from 'chalk';
import boxen from 'boxen';
import Table from 'cli-table3';
import { getTheme } from '../themes/theme-manager.js';
import type { Theme } from '../themes/types.js';

interface DashboardSection {
  title: string;
  content: string;
  priority: 'high' | 'medium' | 'low';
  status?: 'success' | 'warning' | 'error' | 'info';
}

interface WorkflowNode {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'warning';
  dependencies: string[];
  duration?: number;
  progress?: number;
}

export interface DashboardData {
  title: string;
  sections: DashboardSection[];
  workflow?: {
    nodes: WorkflowNode[];
    connections: Array<{ from: string; to: string }>;
  };
  metrics?: Array<{
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'stable';
    status?: 'success' | 'warning' | 'error';
  }>;
  alerts?: Array<{
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: Date;
  }>;
}

export class DashboardDisplay {
  private theme: Theme;
  private width: number;

  constructor(theme?: Theme, width: number = 120) {
    this.theme = theme || getTheme();
    this.width = width;
  }

  /**
   * Render complete dashboard
   */
  render(data: DashboardData): string {
    const sections = [
      this.renderHeader(data.title),
      this.renderAlerts(data.alerts || []),
      this.renderMetrics(data.metrics || []),
      ...data.sections.map((section) => this.renderSection(section)),
    ];

    if (data.workflow) {
      sections.push(this.renderWorkflow(data.workflow));
    }

    return sections.join('\n\n');
  }

  /**
   * Render dashboard header with title and timestamp
   */
  private renderHeader(title: string): string {
    const timestamp = new Date().toLocaleTimeString();
    const header = `${this.theme.typography.heading1(title)}\n${chalk.dim(`Updated: ${timestamp}`)}`;

    return boxen(header, {
      ...this.theme.box,
      borderColor: this.theme.colors.primary,
      padding: 1,
      margin: 0,
    });
  }

  /**
   * Render alerts section
   */
  private renderAlerts(alerts?: DashboardData['alerts']): string {
    if (!alerts || alerts.length === 0) return '';

    const alertLines = alerts.map((alert) => {
      const icon = this.getAlertIcon(alert.type);
      const color = this.getAlertColor(alert.type);
      const time = alert.timestamp.toLocaleTimeString();
      return `${icon} ${(chalk as any)[color](alert.message)} ${chalk.dim(`(${time})`)}`;
    });

    return boxen(`${this.theme.typography.heading3('Alerts')}\n\n${alertLines.join('\n')}`, {
      ...this.theme.box,
      borderColor: alerts.some((a) => a.type === 'error')
        ? this.theme.colors.error
        : this.theme.colors.warning,
    });
  }

  /**
   * Render metrics grid
   */
  private renderMetrics(metrics?: DashboardData['metrics']): string {
    if (!metrics || metrics.length === 0) return '';

    const table = new Table({
      style: {
        head: [this.theme.colors.primary],
        border: [this.theme.colors.border],
      },
      colWidths: [20, 15, 10],
    });

    table.push(
      [
        this.theme.typography.bold('Metric'),
        this.theme.typography.bold('Value'),
        this.theme.typography.bold('Status'),
      ],
      ...metrics.map((metric) => [
        metric.label,
        this.formatMetricValue(metric),
        this.formatMetricStatus(metric),
      ])
    );

    return boxen(
      `${this.theme.typography.heading3('Metrics')}\n\n${table.toString()}`,
      this.theme.box
    );
  }

  /**
   * Render individual section
   */
  private renderSection(section: DashboardSection): string {
    const statusIcon = section.status ? this.getStatusIcon(section.status) : '';
    const title = `${statusIcon} ${this.theme.typography.heading2(section.title)}`;

    return boxen(`${title}\n\n${section.content}`, {
      ...this.theme.box,
      borderColor: section.status ? this.theme.colors[section.status] : this.theme.colors.border,
    });
  }

  /**
   * Render workflow visualization
   */
  private renderWorkflow(workflow: NonNullable<DashboardData['workflow']>): string {
    const lines: string[] = [this.theme.typography.heading3('Workflow Status')];

    // Group nodes by status
    const grouped = workflow.nodes.reduce(
      (acc, node) => {
        if (!acc[node.status]) acc[node.status] = [];
        acc[node.status].push(node);
        return acc;
      },
      {} as Record<string, WorkflowNode[]>
    );

    // Render each status group
    Object.entries(grouped).forEach(([status, nodes]) => {
      const statusColor = this.getWorkflowStatusColor(status as WorkflowNode['status']);
      const statusIcon = this.getWorkflowStatusIcon(status as WorkflowNode['status']);

      lines.push(`\n${statusIcon} ${(chalk as any)[statusColor](`${status.toUpperCase()}`)}`);
      nodes.forEach((node) => {
        const progress = node.progress ? ` (${node.progress}%)` : '';
        const duration = node.duration ? ` ${chalk.dim(`[${node.duration}ms]`)}` : '';
        lines.push(`  ${(chalk as any)[statusColor]('└─')} ${node.name}${progress}${duration}`);
      });
    });

    return boxen(lines.join('\n'), {
      ...this.theme.box,
      borderColor: this.theme.colors.accent,
    });
  }

  /**
   * Helper methods for formatting
   */
  private getAlertIcon(type: string): string {
    switch (type) {
      case 'error':
        return '🚨';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '📢';
    }
  }

  private getAlertColor(type: string): string {
    switch (type) {
      case 'error':
        return this.theme.colors.error;
      case 'warning':
        return this.theme.colors.warning;
      case 'info':
        return this.theme.colors.info;
      default:
        return this.theme.colors.muted;
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '';
    }
  }

  private formatMetricValue(metric: NonNullable<DashboardData['metrics']>[0]): string {
    const value = String(metric.value);
    const trend = metric.trend ? this.getTrendIcon(metric.trend) : '';
    return `${value}${trend}`;
  }

  private formatMetricStatus(metric: NonNullable<DashboardData['metrics']>[0]): string {
    if (!metric.status) return '';
    const color = (this.theme.colors as any)[metric.status];
    return (chalk as any)[color](metric.status.toUpperCase());
  }

  private getTrendIcon(trend: string): string {
    switch (trend) {
      case 'up':
        return ' 📈';
      case 'down':
        return ' 📉';
      case 'stable':
        return ' ➡️';
      default:
        return '';
    }
  }

  private getWorkflowStatusColor(status: WorkflowNode['status']): string {
    switch (status) {
      case 'running':
        return this.theme.colors.primary;
      case 'success':
        return this.theme.colors.success;
      case 'error':
        return this.theme.colors.error;
      case 'warning':
        return this.theme.colors.warning;
      case 'pending':
        return this.theme.colors.muted;
      default:
        return this.theme.colors.muted;
    }
  }

  private getWorkflowStatusIcon(status: WorkflowNode['status']): string {
    switch (status) {
      case 'running':
        return '🔄';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'pending':
        return '⏳';
      default:
        return '❓';
    }
  }
}
