/**
 * Output Formatter for Verbalized Sampling
 *
 * Formats VS results in various output formats with consistent structure.
 * Supports JSON, markdown, and terminal output formats.
 */

import { Strategy, StrategyGenerationResult } from './strategy-generator.js';
import { ConfidenceBreakdown } from './confidence-calculator.js';

export interface VSOutputFormat {
  /** Format type */
  format: 'json' | 'markdown' | 'terminal' | 'summary';
  /** Include detailed explanations */
  verbose?: boolean;
  /** Include execution plans */
  include_plans?: boolean;
  /** Include confidence breakdowns */
  include_breakdowns?: boolean;
  /** Maximum length for descriptions */
  max_description_length?: number;
}

export interface FormattedOutput {
  /** Formatted content string */
  content: string;
  /** Output format used */
  format: string;
  /** Metadata about output */
  metadata: {
    generated_at: string;
    format_version: string;
    content_length: number;
  };
}

export interface TerminalColors {
  /** Color for strategy names */
  strategy: string;
  /** Color for confidence scores */
  confidence: string;
  /** Color for selected strategy */
  selected: string;
  /** Color for explanations */
  explanation: string;
  /** Color for metadata */
  metadata: string;
}

/**
 * Output Formatter Class
 *
 * Provides consistent formatting for Verbalized Sampling results.
 */
export class VSOutputFormatter {
  private readonly format_version = '1.0';
  private readonly default_colors: TerminalColors = {
    strategy: '\x1b[36m', // Cyan
    confidence: '\x1b[32m', // Green
    selected: '\x1b[33m', // Yellow
    explanation: '\x1b[37m', // White
    metadata: '\x1b[90m', // Gray
  };

  /**
   * Format strategy generation result
   */
  formatResult(
    result: StrategyGenerationResult,
    format: VSOutputFormat = { format: 'json' }
  ): FormattedOutput {
    switch (format.format) {
      case 'json':
        return this.formatAsJSON(result, format);
      case 'markdown':
        return this.formatAsMarkdown(result, format);
      case 'terminal':
        return this.formatAsTerminal(result, format);
      case 'summary':
        return this.formatAsSummary(result, format);
      default:
        throw new Error(`Unsupported format: ${format.format}`);
    }
  }

  /**
   * Format single strategy
   */
  formatStrategy(
    strategy: Strategy,
    format: VSOutputFormat = { format: 'json' },
    isSelected = false
  ): FormattedOutput {
    const result: StrategyGenerationResult = {
      strategies: [strategy],
      selected_strategy: isSelected ? strategy.name : '',
      total_confidence: strategy.confidence_score,
      execution_summary: isSelected ? 'Single strategy display' : '',
      metadata: {
        generated_at: new Date().toISOString(),
        agent_type: strategy.strategy_type,
        total_strategies: 1,
        confidence_range: [strategy.confidence_score, strategy.confidence_score],
      },
    };

    return this.formatResult(result, format);
  }

  /**
   * Format confidence breakdown
   */
  formatConfidenceBreakdown(
    breakdown: ConfidenceBreakdown,
    format: VSOutputFormat = { format: 'json' }
  ): FormattedOutput {
    switch (format.format) {
      case 'json':
        return this.formatConfidenceAsJSON(breakdown);
      case 'markdown':
        return this.formatConfidenceAsMarkdown(breakdown);
      case 'terminal':
        return this.formatConfidenceAsTerminal(breakdown);
      default:
        throw new Error(`Unsupported format for confidence: ${format.format}`);
    }
  }

  /**
   * Format as JSON
   */
  private formatAsJSON(
    result: StrategyGenerationResult,
    _options: VSOutputFormat
  ): FormattedOutput {
    const content = JSON.stringify(result, null, 2);

    return {
      content,
      format: 'json',
      metadata: {
        generated_at: new Date().toISOString(),
        format_version: this.format_version,
        content_length: content.length,
      },
    };
  }

  /**
   * Format as Markdown
   */
  private formatAsMarkdown(
    result: StrategyGenerationResult,
    options: VSOutputFormat
  ): FormattedOutput {
    const lines: string[] = [];

    // Header
    lines.push('# Verbalized Sampling Results');
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push(`**Selected Strategy:** ${result.selected_strategy}`);
    lines.push(`**Total Confidence:** ${result.total_confidence.toFixed(3)}`);
    lines.push(`**Agent Type:** ${result.metadata.agent_type}`);
    lines.push(`**Total Strategies:** ${result.metadata.total_strategies}`);
    lines.push('');

    // Execution Summary
    if (result.execution_summary) {
      lines.push('## Execution Summary');
      lines.push('');
      lines.push(result.execution_summary);
      lines.push('');
    }

    // Strategies
    lines.push('## Strategies');
    lines.push('');

    result.strategies.forEach((strategy) => {
      const isSelected = strategy.name === result.selected_strategy;
      const prefix = isSelected ? '🎯 **' : '### ';
      const suffix = isSelected ? '**' : '';

      lines.push(`${prefix}${strategy.name}${suffix}`);
      lines.push('');

      if (options.verbose !== false) {
        lines.push(
          `**Description:** ${this.truncateText(strategy.description, options.max_description_length)}`
        );
        lines.push('');
      }

      lines.push(`**Confidence Score:** ${strategy.confidence_score.toFixed(3)}`);
      lines.push(`**Strategy Type:** ${strategy.strategy_type}`);
      lines.push('');

      // Confidence breakdown
      if (options.include_breakdowns !== false) {
        lines.push('#### Confidence Breakdown');
        lines.push('');
        lines.push(
          `- **Contextual Fit:** ${strategy.reasoning.contextual_fit.toFixed(3)} (40% weight)`
        );
        lines.push(
          `- **Success Probability:** ${strategy.reasoning.success_probability.toFixed(3)} (30% weight)`
        );
        lines.push(`- **Efficiency:** ${strategy.reasoning.efficiency.toFixed(3)} (20% weight)`);
        lines.push(
          `- **User Preference:** ${strategy.reasoning.user_preference.toFixed(3)} (10% weight)`
        );
        lines.push('');

        if (options.verbose !== false && strategy.reasoning.explanation) {
          lines.push('**Explanation:**');
          lines.push('');
          lines.push(strategy.reasoning.explanation);
          lines.push('');
        }
      }

      // Execution plan
      if (options.include_plans !== false && strategy.execution_plan.length > 0) {
        lines.push('#### Execution Plan');
        lines.push('');
        strategy.execution_plan.forEach((step, stepIndex) => {
          lines.push(`${stepIndex + 1}. ${step}`);
        });
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    });

    // Metadata
    lines.push('## Metadata');
    lines.push('');
    lines.push(`- **Generated At:** ${result.metadata.generated_at}`);
    lines.push(`- **Format Version:** ${this.format_version}`);
    lines.push(
      `- **Confidence Range:** ${result.metadata.confidence_range[0].toFixed(3)} - ${result.metadata.confidence_range[1].toFixed(3)}`
    );
    lines.push('');

    const content = lines.join('\n');

    return {
      content,
      format: 'markdown',
      metadata: {
        generated_at: new Date().toISOString(),
        format_version: this.format_version,
        content_length: content.length,
      },
    };
  }

  /**
   * Format as Terminal Output
   */
  private formatAsTerminal(
    result: StrategyGenerationResult,
    options: VSOutputFormat
  ): FormattedOutput {
    const lines: string[] = [];
    const colors = this.default_colors;

    // Header
    lines.push(
      `${colors.strategy}╔══════════════════════════════════════════════════════════════╗${colors.explanation}`
    );
    lines.push(
      `${colors.strategy}║                    VERBALIZED SAMPLING RESULTS                 ║${colors.explanation}`
    );
    lines.push(
      `${colors.strategy}╚══════════════════════════════════════════════════════════════╝${colors.explanation}`
    );
    lines.push('');

    // Summary
    lines.push(`${colors.selected}📊 SUMMARY${colors.explanation}`);
    lines.push(
      `${colors.explanation}─────────────────────────────────────────────────────────────${colors.explanation}`
    );
    lines.push(
      `${colors.strategy}Selected Strategy:${colors.explanation} ${result.selected_strategy}`
    );
    lines.push(
      `${colors.confidence}Total Confidence:${colors.explanation} ${result.total_confidence.toFixed(3)}`
    );
    lines.push(`${colors.strategy}Agent Type:${colors.explanation} ${result.metadata.agent_type}`);
    lines.push(
      `${colors.strategy}Total Strategies:${colors.explanation} ${result.metadata.total_strategies}`
    );
    lines.push('');

    // Execution Summary
    if (result.execution_summary) {
      lines.push(`${colors.selected}🎯 EXECUTION SUMMARY${colors.explanation}`);
      lines.push(
        `${colors.explanation}─────────────────────────────────────────────────────────────${colors.explanation}`
      );
      lines.push(result.execution_summary);
      lines.push('');
    }

    // Strategies
    lines.push(`${colors.strategy}📋 STRATEGIES${colors.explanation}`);
    lines.push(
      `${colors.explanation}─────────────────────────────────────────────────────────────${colors.explanation}`
    );
    lines.push('');

    result.strategies.forEach((strategy) => {
      const isSelected = strategy.name === result.selected_strategy;
      const icon = isSelected ? '🎯' : '📝';

      lines.push(`${icon} ${colors.strategy}${strategy.name}${colors.explanation}`);
      lines.push(
        `${colors.explanation}   ${this.truncateText(strategy.description, 80)}${colors.explanation}`
      );
      lines.push(
        `   ${colors.confidence}Confidence: ${strategy.confidence_score.toFixed(3)}${colors.explanation} | ${colors.strategy}Type: ${strategy.strategy_type}${colors.explanation}`
      );

      if (options.include_breakdowns !== false) {
        lines.push(
          `   ${colors.explanation}Breakdown: Context(${strategy.reasoning.contextual_fit.toFixed(2)}) | Success(${strategy.reasoning.success_probability.toFixed(2)}) | Efficiency(${strategy.reasoning.efficiency.toFixed(2)}) | Preference(${strategy.reasoning.user_preference.toFixed(2)})${colors.explanation}`
        );
      }

      if (isSelected) {
        lines.push(`   ${colors.selected}← SELECTED STRATEGY${colors.explanation}`);
      }

      lines.push('');
    });

    // Metadata
    lines.push(`${colors.metadata}ℹ️  METADATA${colors.explanation}`);
    lines.push(
      `${colors.explanation}─────────────────────────────────────────────────────────────${colors.explanation}`
    );
    lines.push(`${colors.metadata}Generated: ${result.metadata.generated_at}${colors.explanation}`);
    lines.push(
      `${colors.metadata}Confidence Range: ${result.metadata.confidence_range[0].toFixed(3)} - ${result.metadata.confidence_range[1].toFixed(3)}${colors.explanation}`
    );
    lines.push('');

    const content = lines.join('\n');

    return {
      content,
      format: 'terminal',
      metadata: {
        generated_at: new Date().toISOString(),
        format_version: this.format_version,
        content_length: content.length,
      },
    };
  }

  /**
   * Format as Summary
   */
  private formatAsSummary(
    result: StrategyGenerationResult,
    options: VSOutputFormat
  ): FormattedOutput {
    const lines: string[] = [];

    // Quick summary
    lines.push(
      `VS Results: ${result.selected_strategy} selected with ${result.total_confidence.toFixed(3)} confidence`
    );
    lines.push(
      `Generated ${result.metadata.total_strategies} strategies for ${result.metadata.agent_type} agent`
    );

    if (options.verbose) {
      lines.push('');
      lines.push('Strategies considered:');
      result.strategies.forEach((strategy) => {
        const marker = strategy.name === result.selected_strategy ? '→' : ' ';
        lines.push(`  ${marker} ${strategy.name} (${strategy.confidence_score.toFixed(3)})`);
      });
    }

    const content = lines.join('\n');

    return {
      content,
      format: 'summary',
      metadata: {
        generated_at: new Date().toISOString(),
        format_version: this.format_version,
        content_length: content.length,
      },
    };
  }

  /**
   * Format confidence breakdown as JSON
   */
  private formatConfidenceAsJSON(breakdown: ConfidenceBreakdown): FormattedOutput {
    const content = JSON.stringify(breakdown, null, 2);

    return {
      content,
      format: 'json',
      metadata: {
        generated_at: new Date().toISOString(),
        format_version: this.format_version,
        content_length: content.length,
      },
    };
  }

  /**
   * Format confidence breakdown as Markdown
   */
  private formatConfidenceAsMarkdown(breakdown: ConfidenceBreakdown): FormattedOutput {
    const lines: string[] = [];

    lines.push('## Confidence Breakdown');
    lines.push('');
    lines.push(`**Overall Score:** ${breakdown.score.toFixed(3)} (${breakdown.level})`);
    lines.push('');

    lines.push('### Criteria Scores');
    lines.push('');
    lines.push(`| Criterion | Score | Weight | Contribution |`);
    lines.push(`|-----------|-------|--------|--------------|`);
    lines.push(
      `| Contextual Fit | ${breakdown.criteria.contextual_fit.toFixed(3)} | ${breakdown.weights.contextual_fit.toFixed(2)} | ${(breakdown.criteria.contextual_fit * breakdown.weights.contextual_fit).toFixed(3)} |`
    );
    lines.push(
      `| Success Probability | ${breakdown.criteria.success_probability.toFixed(3)} | ${breakdown.weights.success_probability.toFixed(2)} | ${(breakdown.criteria.success_probability * breakdown.weights.success_probability).toFixed(3)} |`
    );
    lines.push(
      `| Efficiency | ${breakdown.criteria.efficiency.toFixed(3)} | ${breakdown.weights.efficiency.toFixed(2)} | ${(breakdown.criteria.efficiency * breakdown.weights.efficiency).toFixed(3)} |`
    );
    lines.push(
      `| User Preference | ${breakdown.criteria.user_preference.toFixed(3)} | ${breakdown.weights.user_preference.toFixed(2)} | ${(breakdown.criteria.user_preference * breakdown.weights.user_preference).toFixed(3)} |`
    );
    lines.push('');

    if (breakdown.explanation) {
      lines.push('### Explanation');
      lines.push('');
      lines.push(breakdown.explanation);
      lines.push('');
    }

    const content = lines.join('\n');

    return {
      content,
      format: 'markdown',
      metadata: {
        generated_at: new Date().toISOString(),
        format_version: this.format_version,
        content_length: content.length,
      },
    };
  }

  /**
   * Format confidence breakdown as Terminal
   */
  private formatConfidenceAsTerminal(breakdown: ConfidenceBreakdown): FormattedOutput {
    const lines: string[] = [];
    const colors = this.default_colors;

    lines.push(`${colors.confidence}📊 CONFIDENCE BREAKDOWN${colors.explanation}`);
    lines.push(
      `${colors.explanation}─────────────────────────────────────────────────────────────${colors.explanation}`
    );
    lines.push(
      `${colors.confidence}Overall Score: ${breakdown.score.toFixed(3)} (${breakdown.level.toUpperCase()})${colors.explanation}`
    );
    lines.push('');

    lines.push(`${colors.strategy}Criteria Breakdown:${colors.explanation}`);
    lines.push(
      `  ${colors.explanation}Contextual Fit:    ${breakdown.criteria.contextual_fit.toFixed(3)} × ${breakdown.weights.contextual_fit.toFixed(2)} = ${(breakdown.criteria.contextual_fit * breakdown.weights.contextual_fit).toFixed(3)}${colors.explanation}`
    );
    lines.push(
      `  ${colors.explanation}Success Probability: ${breakdown.criteria.success_probability.toFixed(3)} × ${breakdown.weights.success_probability.toFixed(2)} = ${(breakdown.criteria.success_probability * breakdown.weights.success_probability).toFixed(3)}${colors.explanation}`
    );
    lines.push(
      `  ${colors.explanation}Efficiency:         ${breakdown.criteria.efficiency.toFixed(3)} × ${breakdown.weights.efficiency.toFixed(2)} = ${(breakdown.criteria.efficiency * breakdown.weights.efficiency).toFixed(3)}${colors.explanation}`
    );
    lines.push(
      `  ${colors.explanation}User Preference:    ${breakdown.criteria.user_preference.toFixed(3)} × ${breakdown.weights.user_preference.toFixed(2)} = ${(breakdown.criteria.user_preference * breakdown.weights.user_preference).toFixed(3)}${colors.explanation}`
    );
    lines.push('');

    if (breakdown.explanation) {
      lines.push(`${colors.explanation}Explanation: ${breakdown.explanation}${colors.explanation}`);
      lines.push('');
    }

    const content = lines.join('\n');

    return {
      content,
      format: 'terminal',
      metadata: {
        generated_at: new Date().toISOString(),
        format_version: this.format_version,
        content_length: content.length,
      },
    };
  }

  /**
   * Truncate text to specified length
   */
  private truncateText(text: string, maxLength?: number): string {
    if (!maxLength || text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Create custom color scheme
   */
  createColorScheme(customColors: Partial<TerminalColors>): TerminalColors {
    return { ...this.default_colors, ...customColors };
  }

  /**
   * Validate format options
   */
  validateFormatOptions(options: VSOutputFormat): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!['json', 'markdown', 'terminal', 'summary'].includes(options.format)) {
      errors.push(`Invalid format: ${options.format}`);
    }

    if (options.max_description_length !== undefined && options.max_description_length < 10) {
      errors.push('max_description_length must be at least 10 characters');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Convenience function for formatting results
 */
export function formatVSResult(
  result: StrategyGenerationResult,
  format: VSOutputFormat = { format: 'json' }
): FormattedOutput {
  const formatter = new VSOutputFormatter();
  return formatter.formatResult(result, format);
}

/**
 * Convenience function for formatting strategies
 */
export function formatVSStrategy(
  strategy: Strategy,
  format: VSOutputFormat = { format: 'json' },
  isSelected = false
): FormattedOutput {
  const formatter = new VSOutputFormatter();
  return formatter.formatStrategy(strategy, format, isSelected);
}
