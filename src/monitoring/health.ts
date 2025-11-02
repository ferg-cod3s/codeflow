import { existsSync, statSync } from 'fs';
import { join } from 'path';
import { logger, logHealth } from './logger';

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  version: string;
  uptime: number;
  checks: Record<string, HealthCheckResult>;
}

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  message?: string;
  details?: any;
  timestamp?: string;
  duration?: number;
}

export class HealthChecker {
  private checks: Map<string, () => Promise<HealthCheckResult>> = new Map();

  constructor() {
    this.registerDefaultChecks();
  }

  registerCheck(name: string, check: () => Promise<HealthCheckResult>): void {
    this.checks.set(name, check);
  }

  async runAllChecks(): Promise<HealthStatus> {
    const _startTime = Date.now();
    const checks: Record<string, HealthCheckResult> = {};
    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';

    // Run all checks in parallel
    const checkPromises = Array.from(this.checks.entries()).map(async ([name, check]) => {
      const checkStart = Date.now();
      try {
        const result = await check();
        result.timestamp = new Date().toISOString();
        result.duration = Date.now() - checkStart;

        checks[name] = result;

        // Update overall status
        if (result.status === 'unhealthy') {
          overallStatus = 'unhealthy';
        } else if (result.status === 'degraded' && overallStatus === 'healthy') {
          overallStatus = 'degraded';
        }

        logHealth.check(
          name,
          result.status === 'degraded' ? 'unhealthy' : result.status,
          result.details
        );
      } catch (error) {
        const errorResult: HealthCheckResult = {
          status: 'unhealthy',
          message: error instanceof Error ? error.message : 'Unknown error',
          details: error,
          timestamp: new Date().toISOString(),
          duration: Date.now() - checkStart,
        };

        checks[name] = errorResult;
        overallStatus = 'unhealthy';

        logger.error(`Health check failed: ${name}`, {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
      }
    });

    await Promise.all(checkPromises);

    const healthStatus: HealthStatus = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.0.0',
      uptime: process.uptime(),
      checks,
    };

    return healthStatus;
  }

  async runCheck(name: string): Promise<HealthCheckResult | null> {
    const check = this.checks.get(name);
    if (!check) return null;

    const startTime = Date.now();
    try {
      const result = await check();
      result.timestamp = new Date().toISOString();
      result.duration = Date.now() - startTime;
      return result;
    } catch (error) {
      return {
        status: 'unhealthy',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime,
      };
    }
  }

  private registerDefaultChecks(): void {
    // Agent registry health check
    this.registerCheck('agentRegistry', async (): Promise<HealthCheckResult> => {
      try {
        // Check if agent registry files exist and are readable
        const agentDirs = [
          join(process.cwd(), 'codeflow-agents'),
          join(process.cwd(), '.claude', 'agents'),
          join(process.cwd(), '.opencode', 'agent'),
        ];

        let foundAgents = false;
        for (const dir of agentDirs) {
          if (existsSync(dir)) {
            try {
              const stats = statSync(dir);
              if (stats.isDirectory()) {
                foundAgents = true;
                break;
              }
            } catch {
              // Directory not accessible
            }
          }
        }

        if (!foundAgents) {
          return {
            status: 'degraded',
            message: 'No agent directories found',
            details: { checkedDirs: agentDirs },
          };
        }

        return {
          status: 'healthy',
          message: 'Agent registry accessible',
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          message: 'Agent registry check failed',
          details: error,
        };
      }
    });

    // Command loader health check
    this.registerCheck('commandLoader', async (): Promise<HealthCheckResult> => {
      try {
        const commandDirs = [
          join(process.cwd(), 'command'),
          join(process.cwd(), '.claude', 'commands'),
          join(process.cwd(), '.opencode', 'command'),
        ];

        let foundCommands = false;
        for (const dir of commandDirs) {
          if (existsSync(dir)) {
            try {
              const stats = statSync(dir);
              if (stats.isDirectory()) {
                foundCommands = true;
                break;
              }
            } catch {
              // Directory not accessible
            }
          }
        }

        if (!foundCommands) {
          return {
            status: 'degraded',
            message: 'No command directories found',
            details: { checkedDirs: commandDirs },
          };
        }

        return {
          status: 'healthy',
          message: 'Command loader accessible',
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          message: 'Command loader check failed',
          details: error,
        };
      }
    });

    // File system health check
    this.registerCheck('fileSystem', async (): Promise<HealthCheckResult> => {
      try {
        // Check basic file system operations
        const testFile = join(process.cwd(), '.health-check.tmp');

        // Write test
        await Bun.write(testFile, 'health-check');

        // Read test
        const content = await Bun.file(testFile).text();
        if (content !== 'health-check') {
          throw new Error('File read/write test failed');
        }

        // Cleanup
        await Bun.write(testFile, ''); // Clear file instead of deleting

        return {
          status: 'healthy',
          message: 'File system operations working',
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          message: 'File system health check failed',
          details: error,
        };
      }
    });

    // Memory health check
    this.registerCheck('memory', async (): Promise<HealthCheckResult> => {
      try {
        const memUsage = process.memoryUsage();
        const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
        const heapTotalMB = memUsage.heapTotal / 1024 / 1024;

        // Check if memory usage is reasonable (< 500MB heap used)
        if (heapUsedMB > 500) {
          return {
            status: 'degraded',
            message: `High memory usage: ${heapUsedMB.toFixed(1)}MB heap used`,
            details: {
              heapUsed: heapUsedMB,
              heapTotal: heapTotalMB,
              external: memUsage.external / 1024 / 1024,
              rss: memUsage.rss / 1024 / 1024,
            },
          };
        }

        return {
          status: 'healthy',
          message: `Memory usage normal: ${heapUsedMB.toFixed(1)}MB heap used`,
          details: {
            heapUsed: heapUsedMB,
            heapTotal: heapTotalMB,
          },
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          message: 'Memory check failed',
          details: error,
        };
      }
    });

    // MCP server health check (if running)
    this.registerCheck('mcpServer', async (): Promise<HealthCheckResult> => {
      // This would be implemented when MCP server health endpoint is available
      return {
        status: 'healthy',
        message: 'MCP server check not implemented',
      };
    });
  }
}

// Global health checker instance
export const healthChecker = new HealthChecker();

// CLI health check command
export async function runHealthCheck(): Promise<void> {
  console.log('🏥 Running Codeflow health checks...\n');

  const health = await healthChecker.runAllChecks();

  console.log(`📊 Overall Status: ${health.status.toUpperCase()}`);
  console.log(`⏱️  Uptime: ${Math.floor(health.uptime)}s`);
  console.log(`📦 Version: ${health.version}`);
  console.log(`🕒 Timestamp: ${health.timestamp}\n`);

  console.log('🔍 Check Results:');
  for (const [name, result] of Object.entries(health.checks)) {
    const statusIcon =
      result.status === 'healthy' ? '✅' : result.status === 'degraded' ? '⚠️' : '❌';
    console.log(`  ${statusIcon} ${name}: ${result.status.toUpperCase()}`);
    if (result.message) {
      console.log(`    ${result.message}`);
    }
    console.log(`    Duration: ${result.duration}ms\n`);
  }

  // Exit with appropriate code
  if (health.status === 'unhealthy') {
    process.exit(1);
  } else if (health.status === 'degraded') {
    process.exit(2);
  } else {
    process.exit(0);
  }
}
