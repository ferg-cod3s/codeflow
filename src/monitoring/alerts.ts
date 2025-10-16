import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { logger } from './logger';

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  condition: (metrics: AlertMetrics) => boolean;
  severity: 'critical' | 'warning' | 'info';
  channels: AlertChannel[];
  cooldownMinutes: number;
  enabled: boolean;
}

export interface AlertMetrics {
  commandExecutionTime?: number;
  commandSuccessRate?: number;
  agentSpawnTime?: number;
  agentSuccessRate?: number;
  memoryUsageMB?: number;
  errorCount?: number;
  mcpOperationTime?: number;
  fileOperationCount?: number;
  [key: string]: number | undefined;
}

export interface AlertChannel {
  type: 'sns' | 'slack' | 'email' | 'pagerduty';
  target: string;
  template?: string;
}

export interface Alert {
  id: string;
  ruleId: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  metrics: AlertMetrics;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
}

export class AlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertCooldowns: Map<string, Date> = new Map();
  private snsClient?: SNSClient;

  constructor() {
    if (process.env.AWS_REGION) {
      this.snsClient = new SNSClient({ region: process.env.AWS_REGION });
    }
    this.registerDefaultRules();
  }

  registerRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
    logger.info('Alert rule registered', {
      ruleId: rule.id,
      name: rule.name,
      severity: rule.severity,
    });
  }

  async evaluateMetrics(metrics: AlertMetrics): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Check cooldown
      const lastAlert = this.alertCooldowns.get(rule.id);
      if (lastAlert) {
        const cooldownEnd = new Date(lastAlert.getTime() + rule.cooldownMinutes * 60 * 1000);
        if (new Date() < cooldownEnd) {
          continue; // Still in cooldown
        }
      }

      // Evaluate condition
      if (rule.condition(metrics)) {
        await this.triggerAlert(rule, metrics);
      }
    }
  }

  private async triggerAlert(rule: AlertRule, metrics: AlertMetrics): Promise<void> {
    const alertId = `alert-${rule.id}-${Date.now()}`;
    const alert: Alert = {
      id: alertId,
      ruleId: rule.id,
      severity: rule.severity,
      title: rule.name,
      message: this.generateAlertMessage(rule, metrics),
      metrics,
      timestamp: new Date(),
    };

    // Store active alert
    this.activeAlerts.set(alertId, alert);

    // Set cooldown
    this.alertCooldowns.set(rule.id, new Date());

    // Send to channels
    for (const channel of rule.channels) {
      try {
        await this.sendAlertToChannel(alert, channel);
      } catch (error) {
        logger.error('Failed to send alert to channel', {
          alertId,
          channel: channel.type,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    logger.warn('Alert triggered', {
      alertId,
      ruleId: rule.id,
      severity: rule.severity,
      title: alert.title,
    });
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) return;

    alert.resolved = true;
    alert.resolvedAt = new Date();

    // Send resolution notifications
    const rule = this.rules.get(alert.ruleId);
    if (rule) {
      for (const channel of rule.channels) {
        try {
          await this.sendResolutionToChannel(alert, channel);
        } catch (error) {
          logger.error('Failed to send resolution to channel', {
            alertId,
            channel: channel.type,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    this.activeAlerts.delete(alertId);

    logger.info('Alert resolved', {
      alertId,
      ruleId: alert.ruleId,
      duration: alert.resolvedAt.getTime() - alert.timestamp.getTime(),
    });
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  private generateAlertMessage(rule: AlertRule, metrics: AlertMetrics): string {
    let message = rule.description + '\n\nMetrics:\n';

    for (const [key, value] of Object.entries(metrics)) {
      if (value !== undefined) {
        message += `- ${key}: ${value}\n`;
      }
    }

    return message;
  }

  private async sendAlertToChannel(alert: Alert, channel: AlertChannel): Promise<void> {
    const message = `[${alert.severity.toUpperCase()}] ${alert.title}\n\n${alert.message}`;

    switch (channel.type) {
      case 'sns':
        if (this.snsClient) {
          await this.snsClient.send(
            new PublishCommand({
              TopicArn: channel.target,
              Subject: `Codeflow Alert: ${alert.title}`,
              Message: message,
            })
          );
        }
        break;

      case 'slack':
        // Implement Slack webhook
        await this.sendSlackMessage(channel.target, {
          text: message,
          attachments: [
            {
              color:
                alert.severity === 'critical'
                  ? 'danger'
                  : alert.severity === 'warning'
                    ? 'warning'
                    : 'good',
              fields: Object.entries(alert.metrics).map(([key, value]) => ({
                title: key,
                value: String(value),
                short: true,
              })),
            },
          ],
        });
        break;

      case 'email':
        // For email, we'd typically use SES or similar
        logger.info('Email alert (not implemented)', { alertId: alert.id, target: channel.target });
        break;

      case 'pagerduty':
        // Implement PagerDuty integration
        await this.sendPagerDutyAlert(channel.target, alert);
        break;
    }
  }

  private async sendResolutionToChannel(alert: Alert, channel: AlertChannel): Promise<void> {
    const message = `✅ RESOLVED: ${alert.title}\n\nDuration: ${Math.floor((alert.resolvedAt!.getTime() - alert.timestamp.getTime()) / 1000)}s`;

    switch (channel.type) {
      case 'sns':
        if (this.snsClient) {
          await this.snsClient.send(
            new PublishCommand({
              TopicArn: channel.target,
              Subject: `Codeflow Alert Resolved: ${alert.title}`,
              Message: message,
            })
          );
        }
        break;

      case 'slack':
        await this.sendSlackMessage(channel.target, {
          text: message,
          color: 'good',
        });
        break;

      case 'pagerduty':
        await this.resolvePagerDutyAlert(channel.target, alert);
        break;
    }
  }

  private async sendSlackMessage(webhookUrl: string, payload: any): Promise<void> {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Slack webhook failed: ${response.status}`);
    }
  }

  private async sendPagerDutyAlert(routingKey: string, alert: Alert): Promise<void> {
    const payload = {
      routing_key: routingKey,
      event_action: 'trigger',
      dedup_key: alert.id,
      payload: {
        summary: alert.title,
        severity: alert.severity,
        source: 'codeflow-cli',
        component: 'monitoring',
        group: 'codeflow',
        class: 'alert',
        custom_details: alert.metrics,
      },
    };

    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`PagerDuty alert failed: ${response.status}`);
    }
  }

  private async resolvePagerDutyAlert(routingKey: string, alert: Alert): Promise<void> {
    const payload = {
      routing_key: routingKey,
      event_action: 'resolve',
      dedup_key: alert.id,
    };

    const response = await fetch('https://events.pagerduty.com/v2/enqueue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`PagerDuty resolve failed: ${response.status}`);
    }
  }

  private registerDefaultRules(): void {
    // Critical: High error rate
    this.registerRule({
      id: 'high-error-rate',
      name: 'High Command Error Rate',
      description: 'Command success rate dropped below 95%',
      condition: (metrics) => (metrics.commandSuccessRate ?? 100) < 95,
      severity: 'critical',
      channels: [{ type: 'sns', target: process.env.ALERT_SNS_TOPIC_ARN || '' }],
      cooldownMinutes: 5,
      enabled: true,
    });

    // Critical: Slow command execution
    this.registerRule({
      id: 'slow-commands',
      name: 'Slow Command Execution',
      description: 'Average command execution time exceeded 30 seconds',
      condition: (metrics) => (metrics.commandExecutionTime ?? 0) > 30000,
      severity: 'critical',
      channels: [{ type: 'sns', target: process.env.ALERT_SNS_TOPIC_ARN || '' }],
      cooldownMinutes: 10,
      enabled: true,
    });

    // Warning: High memory usage
    this.registerRule({
      id: 'high-memory',
      name: 'High Memory Usage',
      description: 'Memory usage exceeded 400MB',
      condition: (metrics) => (metrics.memoryUsageMB ?? 0) > 400,
      severity: 'warning',
      channels: [{ type: 'sns', target: process.env.ALERT_SNS_TOPIC_ARN || '' }],
      cooldownMinutes: 15,
      enabled: true,
    });

    // Warning: Agent spawn failures
    this.registerRule({
      id: 'agent-failures',
      name: 'Agent Spawn Failures',
      description: 'Agent success rate dropped below 90%',
      condition: (metrics) => (metrics.agentSuccessRate ?? 100) < 90,
      severity: 'warning',
      channels: [{ type: 'sns', target: process.env.ALERT_SNS_TOPIC_ARN || '' }],
      cooldownMinutes: 10,
      enabled: true,
    });

    // Info: MCP operation delays
    this.registerRule({
      id: 'mcp-delays',
      name: 'MCP Operation Delays',
      description: 'MCP operations taking longer than 10 seconds',
      condition: (metrics) => (metrics.mcpOperationTime ?? 0) > 10000,
      severity: 'info',
      channels: [{ type: 'sns', target: process.env.ALERT_SNS_TOPIC_ARN || '' }],
      cooldownMinutes: 30,
      enabled: true,
    });
  }
}

// Global alert manager instance
export const alertManager = new AlertManager();
