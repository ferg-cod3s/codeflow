/**
 * Verbalized Sampling Infrastructure
 *
 * A structured approach to problem-solving that generates multiple solution strategies,
 * ranks them by confidence, and executes the most promising approach.
 *
 * Core Components:
 * - StrategyGenerator: Creates and ranks solution strategies
 * - ConfidenceCalculator: Calculates detailed confidence scores
 * - VSOutputFormatter: Formats results in multiple output formats
 */

// Import types and classes
import {
  Strategy,
  StrategyReasoning,
  StrategyGenerationRequest,
  StrategyGenerationResult,
  StrategyGenerator,
  generateStrategies,
} from './strategy-generator.js';

import {
  ConfidenceCriteria,
  ConfidenceWeights,
  ConfidenceBreakdown,
  ContextAnalysis,
  ProblemAnalysis,
  ConfidenceCalculator,
  calculateConfidence,
} from './confidence-calculator.js';

import {
  VSOutputFormat,
  FormattedOutput,
  TerminalColors,
  VSOutputFormatter,
  formatVSResult,
  formatVSStrategy,
} from './output-formatter.js';

// Re-export types
export type {
  Strategy,
  StrategyReasoning,
  StrategyGenerationRequest,
  StrategyGenerationResult,
  ConfidenceCriteria,
  ConfidenceWeights,
  ConfidenceBreakdown,
  ContextAnalysis,
  ProblemAnalysis,
  VSOutputFormat,
  FormattedOutput,
  TerminalColors,
};

// Re-export classes and functions
export {
  StrategyGenerator,
  generateStrategies,
  ConfidenceCalculator,
  calculateConfidence,
  VSOutputFormatter,
  formatVSResult,
  formatVSStrategy,
};

/**
 * Verbalized Sampling main interface
 *
 * Provides a simple interface for using the complete VS system.
 */
export interface VSRequest {
  /** Problem description or task */
  problem: string;
  /** Type of agent generating strategies */
  agent_type: 'research' | 'planning' | 'development';
  /** Current context and constraints */
  context?: {
    codebase_description?: string;
    existing_patterns?: string[];
    constraints?: string[];
    user_preferences?: string[];
    time_constraints?: string;
    resource_constraints?: string[];
  };
  /** Number of strategies to generate */
  strategy_count?: number;
  /** Output format preferences */
  output_format?: VSOutputFormat;
}

/**
 * Complete Verbalized Sampling result
 */
export interface VSResult {
  /** Generated and ranked strategies */
  strategies: StrategyGenerationResult;
  /** Formatted outputs in requested formats */
  outputs: {
    primary: FormattedOutput;
    additional?: FormattedOutput[];
  };
  /** Processing metadata */
  processing: {
    generated_at: string;
    processing_time_ms: number;
    agent_type: string;
    total_strategies: number;
  };
}

/**
 * Verbalized Sampling main class
 *
 * Provides a high-level interface for the complete VS workflow.
 */
export class VerbalizedSampling {
  private strategyGenerator: StrategyGenerator;
  private outputFormatter: VSOutputFormatter;

  constructor() {
    this.strategyGenerator = new StrategyGenerator();
    this.outputFormatter = new VSOutputFormatter();
  }

  /**
   * Execute complete Verbalized Sampling workflow
   */
  async execute(request: VSRequest): Promise<VSResult> {
    const startTime = Date.now();

    // Generate strategies
    const strategyRequest: StrategyGenerationRequest = {
      problem: request.problem,
      agent_type: request.agent_type,
      context: request.context || {},
      strategy_count: request.strategy_count || 3,
    };

    const strategies = await this.strategyGenerator.generateStrategies(strategyRequest);

    // Format outputs
    const outputFormat = request.output_format || { format: 'json' };
    const primaryOutput = this.outputFormatter.formatResult(strategies, outputFormat);

    // Generate additional formats if needed
    const additionalOutputs: FormattedOutput[] = [];
    if (outputFormat.format !== 'summary') {
      const summaryOutput = this.outputFormatter.formatResult(strategies, { format: 'summary' });
      additionalOutputs.push(summaryOutput);
    }

    const processingTime = Date.now() - startTime;

    return {
      strategies,
      outputs: {
        primary: primaryOutput,
        additional: additionalOutputs.length > 0 ? additionalOutputs : undefined,
      },
      processing: {
        generated_at: new Date().toISOString(),
        processing_time_ms: processingTime,
        agent_type: request.agent_type,
        total_strategies: strategies.strategies.length,
      },
    };
  }

  /**
   * Generate strategies only (no formatting)
   */
  async generateStrategies(
    request: Omit<VSRequest, 'output_format'>
  ): Promise<StrategyGenerationResult> {
    const strategyRequest: StrategyGenerationRequest = {
      problem: request.problem,
      agent_type: request.agent_type,
      context: request.context || {},
      strategy_count: request.strategy_count || 3,
    };

    return this.strategyGenerator.generateStrategies(strategyRequest);
  }

  /**
   * Format existing strategies
   */
  formatStrategies(
    strategies: StrategyGenerationResult,
    format: VSOutputFormat = { format: 'json' }
  ): FormattedOutput {
    return this.outputFormatter.formatResult(strategies, format);
  }

  /**
   * Get available strategy patterns for agent type
   */
  getAvailablePatterns(agentType: 'research' | 'planning' | 'development'): string[] {
    const patterns: { [key: string]: string[] } = {
      research: [
        'Code-Path Analysis',
        'Pattern Discovery',
        'Architecture Mapping',
        'Integration Analysis',
      ],
      planning: [
        'Sequential Planning',
        'Feature-Driven Planning',
        'Minimal Viable Planning',
        'Parallel Planning',
      ],
      development: ['Component-First', 'API-First', 'Data-First', 'Integration-First'],
    };

    return patterns[agentType] || [];
  }

  /**
   * Validate VS request
   */
  validateRequest(request: VSRequest): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!request.problem || request.problem.trim().length === 0) {
      errors.push('Problem description is required');
    }

    if (!['research', 'planning', 'development'].includes(request.agent_type)) {
      errors.push('Agent type must be research, planning, or development');
    }

    if (
      request.strategy_count !== undefined &&
      (request.strategy_count < 1 || request.strategy_count > 10)
    ) {
      errors.push('Strategy count must be between 1 and 10');
    }

    if (request.output_format) {
      const formatValidation = this.outputFormatter.validateFormatOptions(request.output_format);
      if (!formatValidation.valid) {
        errors.push(...formatValidation.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Convenience function for complete VS workflow
 */
export async function executeVerbalizedSampling(request: VSRequest): Promise<VSResult> {
  const vs = new VerbalizedSampling();
  return vs.execute(request);
}

/**
 * Convenience function for strategy generation only
 */
export async function generateVSStrategies(
  request: Omit<VSRequest, 'output_format'>
): Promise<StrategyGenerationResult> {
  const vs = new VerbalizedSampling();
  return vs.generateStrategies(request);
}

// Re-export for backward compatibility
export * from './strategy-generator.js';
export * from './confidence-calculator.js';
export * from './output-formatter.js';
