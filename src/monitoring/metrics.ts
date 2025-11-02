import { CloudWatchClient, PutMetricDataCommand, StandardUnit } from '@aws-sdk/client-cloudwatch';





export interface CommandMetrics {
  command: string;
  executionTime: number;
  success: boolean;
  errorType?: string;
  agentCount?: number;
  fileCount?: number;
}

export interface AgentMetrics {
  agentName: string;
  spawnTime: number;
  executionTime: number;
  success: boolean;
  taskType: string;
}

export interface MCPMetrics {
  operation: 'tool_call' | 'resource_access' | 'agent_spawn';
  duration: number;
  success: boolean;
  agentCount?: number;
}

export class MetricsCollector {
  private cloudwatch?: CloudWatchClient;
  private metrics: Array<{
    name: string;
    value: number;
    unit: StandardUnit;
    dimensions: Record<string, string>;
    timestamp: Date;
  }> = [];

  constructor() {
    if (process.env.AWS_REGION) {
      this.cloudwatch = new CloudWatchClient({
        region: process.env.AWS_REGION,
      });
    }
  }

  recordCommandExecution(metrics: CommandMetrics): void {
    this.addMetric('CommandExecutionTime', metrics.executionTime, StandardUnit.Milliseconds, {
      Command: metrics.command,
      Success: metrics.success.toString(),
      ...(metrics.errorType && { ErrorType: metrics.errorType }),
    });

    this.addMetric('CommandSuccess', metrics.success ? 1 : 0, StandardUnit.Count, {
      Command: metrics.command,
    });

    if (metrics.agentCount) {
      this.addMetric('CommandAgentCount', metrics.agentCount, StandardUnit.Count, {
        Command: metrics.command,
      });
    }

    if (metrics.fileCount) {
      this.addMetric('CommandFileCount', metrics.fileCount, StandardUnit.Count, {
        Command: metrics.command,
      });
    }
  }

  recordAgentExecution(metrics: AgentMetrics): void {
    this.addMetric('AgentSpawnTime', metrics.spawnTime, StandardUnit.Milliseconds, {
      AgentName: metrics.agentName,
      TaskType: metrics.taskType,
    });

    this.addMetric('AgentExecutionTime', metrics.executionTime, StandardUnit.Milliseconds, {
      AgentName: metrics.agentName,
      TaskType: metrics.taskType,
      Success: metrics.success.toString(),
    });

    this.addMetric('AgentSuccess', metrics.success ? 1 : 0, StandardUnit.Count, {
      AgentName: metrics.agentName,
      TaskType: metrics.taskType,
    });
  }

  recordMCPOperation(metrics: MCPMetrics): void {
    this.addMetric('MCPOperationDuration', metrics.duration, StandardUnit.Milliseconds, {
      Operation: metrics.operation,
      Success: metrics.success.toString(),
    });

    this.addMetric('MCPOperationSuccess', metrics.success ? 1 : 0, StandardUnit.Count, {
      Operation: metrics.operation,
    });

    if (metrics.agentCount) {
      this.addMetric('MCPOperationAgentCount', metrics.agentCount, StandardUnit.Count, {
        Operation: metrics.operation,
      });
    }
  }

  recordMemoryUsage(): void {
    const memUsage = process.memoryUsage();

    this.addMetric('MemoryHeapUsed', memUsage.heapUsed / 1024 / 1024, StandardUnit.Megabytes, {});
    this.addMetric('MemoryHeapTotal', memUsage.heapTotal / 1024 / 1024, StandardUnit.Megabytes, {});
    this.addMetric('MemoryExternal', memUsage.external / 1024 / 1024, StandardUnit.Megabytes, {});
    this.addMetric('MemoryRSS', memUsage.rss / 1024 / 1024, StandardUnit.Megabytes, {});
  }

  recordFileOperation(
    operation: string,
    fileCount: number,
    totalSize: number,
    duration: number
  ): void {
    this.addMetric('FileOperationDuration', duration, StandardUnit.Milliseconds, {
      Operation: operation,
    });

    this.addMetric('FileOperationCount', fileCount, StandardUnit.Count, {
      Operation: operation,
    });

    this.addMetric('FileOperationSize', totalSize, StandardUnit.Bytes, {
      Operation: operation,
    });
  }

  private addMetric(
    name: string,
    value: number,
    unit: StandardUnit,
    dimensions: Record<string, string>
  ): void {
    this.metrics.push({
      name,
      value,
      unit,
      dimensions,
      timestamp: new Date(),
    });
  }

  async flush(): Promise<void> {
    if (this.metrics.length === 0) return;

    // Send to CloudWatch if available
    if (this.cloudwatch) {
      try {
        const metricData = this.metrics.map((metric) => ({
          MetricName: metric.name,
          Value: metric.value,
          Unit: metric.unit,
          Timestamp: metric.timestamp,
          Dimensions: Object.entries(metric.dimensions).map(([Name, Value]) => ({
            Name,
            Value,
          })),
        }));

        await this.cloudwatch.send(
          new PutMetricDataCommand({
            Namespace: 'Codeflow/CLI',
            MetricData: metricData,
          })
        );
      } catch (error) {
        console.error('Failed to send metrics to CloudWatch:', error);
      }
    }

    // Log metrics for local development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Metrics:', this.metrics.slice(-5)); // Last 5 metrics
    }

    this.metrics = [];
  }

  // Flush metrics periodically
  startPeriodicFlush(intervalMs: number = 60000): void {
    setInterval(() => {
      this.flush().catch(console.error);
    }, intervalMs);
  }
}

// Global metrics collector instance
export const metrics = new MetricsCollector();

// Auto-flush in production
if (process.env.NODE_ENV === 'production') {
  metrics.startPeriodicFlush();
}
