/**
 * Error Handling System for CodeFlow
 * 
 * Comprehensive error types and recovery strategies for resilient conversion operations
 */

export enum ErrorType {
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_READ_ERROR = 'FILE_READ_ERROR',
  FILE_WRITE_ERROR = 'FILE_WRITE_ERROR',
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONVERSION_ERROR = 'CONVERSION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum RecoveryStrategy {
  RETRY = 'retry',
  SKIP = 'skip',
  FALLBACK = 'fallback',
  MANUAL = 'manual',
  ABORT = 'abort'
}

export interface ConversionError extends Error {
  type: ErrorType;
  severity: ErrorSeverity;
  file?: string;
  operation?: string;
  recoverable: boolean;
  recoveryStrategy?: RecoveryStrategy;
  maxRetries?: number;
  currentAttempt?: number;
  cause?: Error;
  context?: Record<string, any>;
}

export interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  fallbackStrategy?: RecoveryStrategy;
  continueOnError?: boolean;
  errorThreshold?: number;
}

export interface ConversionResult<T = any> {
  success: boolean;
  data?: T;
  error?: ConversionError;
  warnings: string[];
  converted?: number;
  failed?: number;
  errors?: string[];
  metrics?: {
    totalProcessed: number;
    successful: number;
    failed: number;
    skipped: number;
    duration: number;
  };
}

export class ConversionErrorHandler {
  private options: ErrorRecoveryOptions;
  private errorCounts: Map<ErrorType, number> = new Map();
  private recoveryAttempts: Map<string, number> = new Map();

  constructor(options: ErrorRecoveryOptions = {}) {
    this.options = {
      maxRetries: 3,
      retryDelay: 1000,
      fallbackStrategy: RecoveryStrategy.SKIP,
      continueOnError: true,
      errorThreshold: 10,
      ...options
    };
  }

  /**
   * Create a standardized conversion error
   */
  createError(
    type: ErrorType,
    message: string,
    context?: {
      file?: string;
      operation?: string;
      cause?: Error;
      [key: string]: any;
    }
  ): ConversionError {
    const error = new Error(message) as ConversionError;
    error.type = type;
    error.severity = this.getSeverity(type);
    error.file = context?.file;
    error.operation = context?.operation;
    error.cause = context?.cause;
    error.context = context || {};
    error.recoverable = this.isRecoverable(type);
    error.recoveryStrategy = this.getRecoveryStrategy(type);
    error.maxRetries = this.options.maxRetries;
    error.currentAttempt = 1;

    // Track error counts
    const currentCount = this.errorCounts.get(type) || 0;
    this.errorCounts.set(type, currentCount + 1);

    return error;
  }

  /**
   * Handle an error with appropriate recovery strategy
   */
  async handleError<T>(
    error: ConversionError,
    operation: () => Promise<T>,
    context?: string
  ): Promise<ConversionResult<T>> {
    const startTime = Date.now();
    
    try {
      // Check if we should abort due to error threshold
      if (this.shouldAbort()) {
        return {
          success: false,
          error: this.createError(ErrorType.UNKNOWN_ERROR, 'Error threshold exceeded, aborting operation'),
          warnings: [],
          metrics: this.createMetrics(0, 1, 0, Date.now() - startTime)
        };
      }

      // Attempt recovery based on error type and strategy
      const recoveryResult = await this.attemptRecovery(error, operation, context);
      
      if (recoveryResult.success) {
        return {
          success: true,
          data: recoveryResult.data,
          warnings: recoveryResult.warnings,
          metrics: this.createMetrics(1, 0, 0, Date.now() - startTime)
        };
      }

      return {
        success: false,
        error: recoveryResult.error || error,
        warnings: recoveryResult.warnings,
        metrics: this.createMetrics(0, 1, 0, Date.now() - startTime)
      };

    } catch (fallbackError) {
      return {
        success: false,
        error: this.createError(
          ErrorType.UNKNOWN_ERROR,
          `Recovery failed: ${(fallbackError as Error).message}`,
          { cause: fallbackError as Error, originalError: error }
        ),
        warnings: [],
        metrics: this.createMetrics(0, 1, 0, Date.now() - startTime)
      };
    }
  }

  /**
   * Attempt recovery based on error type
   */
  private async attemptRecovery<T>(
    error: ConversionError,
    operation: () => Promise<T>,
    context?: string
  ): Promise<ConversionResult<T>> {
    const key = `${error.type}_${error.file || 'unknown'}_${context || ''}`;
    const attempts = this.recoveryAttempts.get(key) || 0;
    const startTime = Date.now();

    // Check if we've exceeded max retries
    if (attempts >= (error.maxRetries || this.options.maxRetries!)) {
      return {
        success: false,
        error,
        warnings: [`Max retries (${attempts}) exceeded for ${error.type}`],
        metrics: this.createMetrics(0, 1, 0, Date.now() - startTime)
      };
    }

    // Update recovery attempts
    this.recoveryAttempts.set(key, attempts + 1);
    error.currentAttempt = attempts + 1;

    switch (error.recoveryStrategy) {
      case RecoveryStrategy.RETRY:
        return await this.retryOperation(operation, error);
      
      case RecoveryStrategy.FALLBACK:
        return await this.attemptFallback(error, context);
      
      case RecoveryStrategy.SKIP:
        return {
          success: false,
          error,
          warnings: ['Operation skipped due to unrecoverable error']
        };
      
      case RecoveryStrategy.MANUAL:
        return {
          success: false,
          error,
          warnings: ['Manual intervention required for this error type']
        };
      
      default:
        return {
          success: false,
          error,
          warnings: [`No recovery strategy for ${error.recoveryStrategy}`]
        };
    }
  }

  /**
   * Retry an operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    originalError: ConversionError
  ): Promise<ConversionResult<T>> {
    const attempt = originalError.currentAttempt || 1;
    const delay = this.options.retryDelay! * Math.pow(2, attempt - 1); // Exponential backoff

    // Wait before retry
    await this.sleep(delay);

    try {
      const data = await operation();
      return {
        success: true,
        data,
        warnings: [`Operation succeeded on attempt ${attempt}`]
      };
    } catch (retryError) {
      const conversionError = retryError as ConversionError;
      conversionError.currentAttempt = attempt + 1;
      conversionError.cause = originalError;
      
      return {
        success: false,
        error: conversionError,
        warnings: [`Retry attempt ${attempt} failed: ${(retryError as Error).message}`]
      };
    }
  }

  /**
   * Attempt fallback strategy
   */
  private async attemptFallback<T>(
    error: ConversionError,
    context?: string
  ): Promise<ConversionResult<T>> {
    // For now, return the error with fallback indication
    // In a real implementation, this could try alternative approaches
    return {
      success: false,
      error: {
        ...error,
        recoveryStrategy: RecoveryStrategy.MANUAL,
        context: {
          ...error.context,
          fallbackAttempted: true,
          fallbackContext: context
        }
      },
      warnings: ['Fallback strategy attempted but failed']
    };
  }

  /**
   * Check if operation should be aborted
   */
  private shouldAbort(): boolean {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    return totalErrors >= this.options.errorThreshold!;
  }

  /**
   * Get error severity based on type
   */
  private getSeverity(type: ErrorType): ErrorSeverity {
    const severityMap: Record<ErrorType, ErrorSeverity> = {
      [ErrorType.FILE_NOT_FOUND]: ErrorSeverity.HIGH,
      [ErrorType.FILE_READ_ERROR]: ErrorSeverity.HIGH,
      [ErrorType.FILE_WRITE_ERROR]: ErrorSeverity.HIGH,
      [ErrorType.PARSE_ERROR]: ErrorSeverity.MEDIUM,
      [ErrorType.VALIDATION_ERROR]: ErrorSeverity.MEDIUM,
      [ErrorType.CONVERSION_ERROR]: ErrorSeverity.MEDIUM,
      [ErrorType.PERMISSION_ERROR]: ErrorSeverity.HIGH,
      [ErrorType.NETWORK_ERROR]: ErrorSeverity.MEDIUM,
      [ErrorType.MEMORY_ERROR]: ErrorSeverity.CRITICAL,
      [ErrorType.TIMEOUT_ERROR]: ErrorSeverity.MEDIUM,
      [ErrorType.UNKNOWN_ERROR]: ErrorSeverity.LOW
    };

    return severityMap[type] || ErrorSeverity.LOW;
  }

  /**
   * Check if error type is recoverable
   */
  private isRecoverable(type: ErrorType): boolean {
    const recoverableTypes = [
      ErrorType.FILE_READ_ERROR,
      ErrorType.FILE_WRITE_ERROR,
      ErrorType.PARSE_ERROR,
      ErrorType.CONVERSION_ERROR,
      ErrorType.NETWORK_ERROR,
      ErrorType.TIMEOUT_ERROR
    ];

    return recoverableTypes.includes(type);
  }

  /**
   * Get recovery strategy for error type
   */
  private getRecoveryStrategy(type: ErrorType): RecoveryStrategy {
    const strategyMap: Record<ErrorType, RecoveryStrategy> = {
      [ErrorType.FILE_NOT_FOUND]: RecoveryStrategy.SKIP,
      [ErrorType.FILE_READ_ERROR]: RecoveryStrategy.RETRY,
      [ErrorType.FILE_WRITE_ERROR]: RecoveryStrategy.RETRY,
      [ErrorType.PARSE_ERROR]: RecoveryStrategy.SKIP,
      [ErrorType.VALIDATION_ERROR]: RecoveryStrategy.SKIP,
      [ErrorType.CONVERSION_ERROR]: RecoveryStrategy.FALLBACK,
      [ErrorType.PERMISSION_ERROR]: RecoveryStrategy.MANUAL,
      [ErrorType.NETWORK_ERROR]: RecoveryStrategy.RETRY,
      [ErrorType.MEMORY_ERROR]: RecoveryStrategy.ABORT,
      [ErrorType.TIMEOUT_ERROR]: RecoveryStrategy.RETRY,
      [ErrorType.UNKNOWN_ERROR]: RecoveryStrategy.FALLBACK
    };

    return strategyMap[type] || RecoveryStrategy.FALLBACK;
  }

  /**
   * Create metrics object
   */
  public createMetrics(
    successful: number,
    failed: number,
    skipped: number,
    duration: number
  ) {
    return {
      totalProcessed: successful + failed + skipped,
      successful,
      failed,
      skipped,
      duration
    };
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get error summary
   */
  getErrorSummary(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    mostCommonError: ErrorType;
    recoveryRate: number;
  } {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    
    const errorsByType: Record<ErrorType, number> = {} as any;
    const errorsBySeverity: Record<ErrorSeverity, number> = {} as any;
    
    for (const [type, count] of this.errorCounts.entries()) {
      errorsByType[type] = count;
      const severity = this.getSeverity(type);
      errorsBySeverity[severity] = (errorsBySeverity[severity] || 0) + count;
    }

    const mostCommonError = Array.from(this.errorCounts.entries())
      .sort(([,a], [,b]) => b - a)[0]?.[0] || ErrorType.UNKNOWN_ERROR;

    const totalOperations = totalErrors + Array.from(this.recoveryAttempts.values())
      .reduce((sum, attempts) => sum + attempts, 0);
    const recoveryRate = totalOperations > 0 ? (totalErrors / totalOperations) * 100 : 0;

    return {
      totalErrors,
      errorsByType,
      errorsBySeverity,
      mostCommonError,
      recoveryRate
    };
  }

  /**
   * Reset error tracking
   */
  reset(): void {
    this.errorCounts.clear();
    this.recoveryAttempts.clear();
  }
}