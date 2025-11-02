import winston from 'winston';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import packageJson from '../../package.json';





export interface LogContext {
  command?: string;
  agentName?: string;
  operation?: string;
  userId?: string;
  projectPath?: string;
  duration?: number;
  fileCount?: number;
  agentCount?: number;
  error?: Error;
  [key: string]: any;
}

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
}

// Custom log format for CLI operations
const cliFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info: any) => {
    const { timestamp, level, message, ...meta } = info;
    const base = {
      timestamp,
      level: level.toUpperCase(),
      service: 'codeflow-cli',
      version: packageJson.version,
      environment: process.env.NODE_ENV || 'development',
      message,
    };

    return JSON.stringify({ ...base, ...meta });
  })
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let output = `${timestamp} ${level}: ${message}`;

    // Add key metadata for console output
    const importantKeys = ['command', 'agentName', 'duration', 'error'];
    const importantMeta = Object.fromEntries(
      Object.entries(meta).filter(([key]) => importantKeys.includes(key))
    );

    if (Object.keys(importantMeta).length > 0) {
      output += ` ${JSON.stringify(importantMeta)}`;
    }

    return output;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: cliFormat,
  defaultMeta: {
    service: 'codeflow-cli',
    version: packageJson.version,
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      level: process.env.CONSOLE_LOG_LEVEL || 'info',
      format: consoleFormat,
      silent: process.env.NODE_ENV === 'test',
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),

    // Separate error log
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      tailable: true,
    }),

    // Performance log for timing analysis
    new winston.transports.File({
      filename: path.join(logsDir, 'performance.log'),
      level: 'info',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 3,
      tailable: true,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
        winston.format((info: any) => {
          // Only include performance-related logs
          if (info.duration || info.operation === 'performance') {
            return info;
          }
          return false;
        })()
      ),
    }),
  ],

  // Handle exceptions and rejections
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
    }),
  ],
});

// Add request ID for correlation
let requestCounter = 0;
function getRequestId(): string {
  return `req-${Date.now()}-${++requestCounter}`;
}

// Enhanced logging methods with context
export const logCommand = {
  start: (command: string, context: LogContext = {}) => {
    const requestId = getRequestId();
    logger.info('Command started', {
      ...context,
      command,
      operation: 'command_start',
      requestId,
    });
    return requestId;
  },

  success: (requestId: string, command: string, duration: number, context: LogContext = {}) => {
    logger.info('Command completed successfully', {
      ...context,
      command,
      operation: 'command_success',
      duration,
      requestId,
    });
  },

  error: (
    requestId: string,
    command: string,
    error: Error,
    duration?: number,
    context: LogContext = {}
  ) => {
    logger.error('Command failed', {
      ...context,
      command,
      operation: 'command_error',
      error: error.message,
      stack: error.stack,
      duration,
      requestId,
    });
  },
};

export const logAgent = {
  spawn: (agentName: string, taskType: string, context: LogContext = {}) => {
    const requestId = getRequestId();
    logger.info('Agent spawned', {
      ...context,
      agentName,
      taskType,
      operation: 'agent_spawn',
      requestId,
    });
    return requestId;
  },

  success: (requestId: string, agentName: string, duration: number, context: LogContext = {}) => {
    logger.info('Agent execution completed', {
      ...context,
      agentName,
      operation: 'agent_success',
      duration,
      requestId,
    });
  },

  error: (
    requestId: string,
    agentName: string,
    error: Error,
    duration?: number,
    context: LogContext = {}
  ) => {
    logger.error('Agent execution failed', {
      ...context,
      agentName,
      operation: 'agent_error',
      error: error.message,
      stack: error.stack,
      duration,
      requestId,
    });
  },
};

export const logMCP = {
  operation: (operation: string, context: LogContext = {}) => {
    const requestId = getRequestId();
    logger.info('MCP operation started', {
      ...context,
      operation,
      type: 'mcp_operation',
      requestId,
    });
    return requestId;
  },

  success: (requestId: string, operation: string, duration: number, context: LogContext = {}) => {
    logger.info('MCP operation completed', {
      ...context,
      operation,
      type: 'mcp_success',
      duration,
      requestId,
    });
  },

  error: (
    requestId: string,
    operation: string,
    error: Error,
    duration?: number,
    context: LogContext = {}
  ) => {
    logger.error('MCP operation failed', {
      ...context,
      operation,
      type: 'mcp_error',
      error: error.message,
      stack: error.stack,
      duration,
      requestId,
    });
  },
};

export const logPerformance = {
  slow: (operation: string, duration: number, threshold: number, context: LogContext = {}) => {
    logger.warn('Performance threshold exceeded', {
      ...context,
      operation,
      duration,
      threshold,
      type: 'performance_warning',
    });
  },

  memory: (usage: NodeJS.MemoryUsage, context: LogContext = {}) => {
    logger.info('Memory usage snapshot', {
      ...context,
      heapUsed: usage.heapUsed,
      heapTotal: usage.heapTotal,
      external: usage.external,
      rss: usage.rss,
      type: 'memory_snapshot',
    });
  },
};

// Health check logging
export const logHealth = {
  check: (component: string, status: 'healthy' | 'unhealthy', details?: any) => {
    logger.info('Health check', {
      component,
      status,
      details,
      type: 'health_check',
    });
  },

  service: (status: 'starting' | 'running' | 'stopping' | 'stopped', details?: any) => {
    logger.info('Service status change', {
      status,
      details,
      type: 'service_status',
    });
  },
};

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  logger.end();
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  logger.end();
});
