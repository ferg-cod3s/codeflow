/**
 * Confidence Calculator for Verbalized Sampling
 *
 * Provides detailed confidence scoring based on multiple criteria.
 * Ensures consistent and transparent confidence calculations across strategies.
 */

export interface ConfidenceCriteria {
  /** How well strategy fits current context (0.0-1.0) */
  contextual_fit: number;
  /** Probability of successful execution (0.0-1.0) */
  success_probability: number;
  /** Efficiency of implementation (0.0-1.0) */
  efficiency: number;
  /** Alignment with user preferences (0.0-1.0) */
  user_preference: number;
}

export interface ConfidenceWeights {
  contextual_fit: number;
  success_probability: number;
  efficiency: number;
  user_preference: number;
}

export interface ConfidenceBreakdown {
  /** Overall confidence score */
  score: number;
  /** Individual criteria scores */
  criteria: ConfidenceCriteria;
  /** Weights used in calculation */
  weights: ConfidenceWeights;
  /** Detailed explanation of scoring */
  explanation: string;
  /** Confidence level category */
  level: 'very_low' | 'low' | 'moderate' | 'high' | 'very_high';
}

export interface ContextAnalysis {
  /** Description of codebase and existing patterns */
  codebase_context: string;
  /** List of existing architectural patterns */
  existing_patterns: string[];
  /** Known constraints and limitations */
  constraints: string[];
  /** Available resources and tools */
  resources: string[];
  /** Team expertise and preferences */
  team_context: string;
}

export interface ProblemAnalysis {
  /** Complexity assessment of the problem */
  complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  /** Estimated time and effort required */
  effort_estimate: 'low' | 'medium' | 'high' | 'very_high';
  /** Number of dependencies and integration points */
  dependency_count: number;
  /** Risk level of the approach */
  risk_level: 'low' | 'medium' | 'high' | 'very_high';
  /** Clarity of requirements and success criteria */
  clarity: 'clear' | 'mostly_clear' | 'somewhat_clear' | 'unclear';
}

/**
 * Confidence Calculator Class
 *
 * Provides detailed confidence scoring with transparent reasoning.
 */
export class ConfidenceCalculator {
  private readonly default_weights: ConfidenceWeights = {
    contextual_fit: 0.4,
    success_probability: 0.3,
    efficiency: 0.2,
    user_preference: 0.1,
  };

  /**
   * Calculate confidence score with detailed breakdown
   */
  calculateConfidence(
    criteria: ConfidenceCriteria,
    weights?: Partial<ConfidenceWeights>,
    context?: ContextAnalysis,
    problem?: ProblemAnalysis
  ): ConfidenceBreakdown {
    const finalWeights = { ...this.default_weights, ...weights };
    const score = this.calculateWeightedScore(criteria, finalWeights);
    const level = this.getConfidenceLevel(score);
    const explanation = this.generateExplanation(criteria, finalWeights, context, problem);

    return {
      score,
      criteria,
      weights: finalWeights,
      explanation,
      level,
    };
  }

  /**
   * Calculate contextual fit score
   */
  calculateContextualFit(
    _strategyName: string,
    context: ContextAnalysis,
    strategyType: 'research' | 'planning' | 'development'
  ): number {
    let score = 0.5; // Base score

    // Check alignment with existing patterns
    if (context.existing_patterns.length > 0) {
      score += 0.2;
    }

    // Check codebase familiarity
    if (
      context.codebase_context.includes('well-documented') ||
      context.codebase_context.includes('established')
    ) {
      score += 0.15;
    }

    // Check resource availability
    if (context.resources.length >= 3) {
      score += 0.1;
    }

    // Check team expertise
    if (context.team_context.includes('experienced') || context.team_context.includes('familiar')) {
      score += 0.05;
    }

    // Strategy-specific adjustments
    score += this.getStrategyContextAdjustment(_strategyName, strategyType, context);

    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * Calculate success probability score
   */
  calculateSuccessProbability(
    strategyName: string,
    problem: ProblemAnalysis,
    context: ContextAnalysis
  ): number {
    let score = 0.5; // Base score

    // Complexity adjustment
    switch (problem.complexity) {
      case 'simple':
        score += 0.3;
        break;
      case 'moderate':
        score += 0.15;
        break;
      case 'complex':
        score -= 0.1;
        break;
      case 'very_complex':
        score -= 0.25;
        break;
    }

    // Effort adjustment
    switch (problem.effort_estimate) {
      case 'low':
        score += 0.1;
        break;
      case 'medium':
        score += 0.05;
        break;
      case 'high':
        score -= 0.1;
        break;
      case 'very_high':
        score -= 0.2;
        break;
    }

    // Risk adjustment
    switch (problem.risk_level) {
      case 'low':
        score += 0.15;
        break;
      case 'medium':
        score += 0.05;
        break;
      case 'high':
        score -= 0.1;
        break;
      case 'very_high':
        score -= 0.2;
        break;
    }

    // Clarity adjustment
    switch (problem.clarity) {
      case 'clear':
        score += 0.15;
        break;
      case 'mostly_clear':
        score += 0.1;
        break;
      case 'somewhat_clear':
        score += 0.05;
        break;
      case 'unclear':
        score -= 0.15;
        break;
    }

    // Dependency adjustment
    if (problem.dependency_count <= 2) {
      score += 0.1;
    } else if (problem.dependency_count >= 6) {
      score -= 0.1;
    }

    // Constraint adjustment
    if (context.constraints.length <= 2) {
      score += 0.05;
    } else if (context.constraints.length >= 5) {
      score -= 0.1;
    }

    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * Calculate efficiency score
   */
  calculateEfficiency(
    _strategyName: string,
    problem: ProblemAnalysis,
    context: ContextAnalysis,
    timeConstraints?: string
  ): number {
    let score = 0.5; // Base score

    // Time constraint adjustments
    if (timeConstraints) {
      if (timeConstraints.includes('urgent') || timeConstraints.includes('asap')) {
        score += 0.2;
      } else if (timeConstraints.includes('relaxed') || timeConstraints.includes('flexible')) {
        score += 0.1;
      }
    }

    // Effort-based efficiency
    switch (problem.effort_estimate) {
      case 'low':
        score += 0.25;
        break;
      case 'medium':
        score += 0.1;
        break;
      case 'high':
        score -= 0.1;
        break;
      case 'very_high':
        score -= 0.2;
        break;
    }

    // Resource-based efficiency
    if (context.resources.length >= 4) {
      score += 0.15;
    } else if (context.resources.length <= 1) {
      score -= 0.1;
    }

    // Strategy-specific efficiency
    score += this.getStrategyEfficiencyAdjustment(_strategyName, problem, context);

    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * Calculate user preference score
   */
  calculateUserPreference(
    strategyName: string,
    userPreferences: string[],
    context: ContextAnalysis
  ): number {
    let score = 0.7; // Base score - assume reasonable alignment

    // Direct preference matches
    const strategyKeywords = this.getStrategyKeywords(strategyName);
    const matchingPreferences = userPreferences.filter((pref) =>
      strategyKeywords.some((keyword) => pref.toLowerCase().includes(keyword.toLowerCase()))
    );

    if (matchingPreferences.length > 0) {
      score += 0.2 * (matchingPreferences.length / userPreferences.length);
    }

    // Team context alignment
    if (context.team_context.includes('prefers')) {
      const teamPrefs = context.team_context.toLowerCase();
      if (strategyKeywords.some((keyword) => teamPrefs.includes(keyword))) {
        score += 0.1;
      }
    }

    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * Normalize confidence scores across multiple strategies
   */
  normalizeScores(scores: number[]): number[] {
    const total = scores.reduce((sum, score) => sum + score, 0);
    if (total === 0) return scores.map(() => 1 / scores.length);
    return scores.map((score) => score / total);
  }

  /**
   * Calculate weighted score from criteria and weights
   */
  private calculateWeightedScore(criteria: ConfidenceCriteria, weights: ConfidenceWeights): number {
    return (
      criteria.contextual_fit * weights.contextual_fit +
      criteria.success_probability * weights.success_probability +
      criteria.efficiency * weights.efficiency +
      criteria.user_preference * weights.user_preference
    );
  }

  /**
   * Get confidence level category from score
   */
  private getConfidenceLevel(score: number): ConfidenceBreakdown['level'] {
    if (score >= 0.9) return 'very_high';
    if (score >= 0.7) return 'high';
    if (score >= 0.5) return 'moderate';
    if (score >= 0.3) return 'low';
    return 'very_low';
  }

  /**
   * Generate detailed explanation for confidence score
   */
  private generateExplanation(
    criteria: ConfidenceCriteria,
    weights: ConfidenceWeights,
    context?: ContextAnalysis,
    problem?: ProblemAnalysis
  ): string {
    const parts: string[] = [];

    parts.push(
      `Overall confidence: ${(
        criteria.contextual_fit * weights.contextual_fit +
        criteria.success_probability * weights.success_probability +
        criteria.efficiency * weights.efficiency +
        criteria.user_preference * weights.user_preference
      ).toFixed(3)}`
    );

    parts.push(
      `Contextual fit (${weights.contextual_fit.toFixed(2)} weight): ${criteria.contextual_fit.toFixed(3)} - ${this.getContextualFitExplanation(criteria.contextual_fit)}`
    );

    parts.push(
      `Success probability (${weights.success_probability.toFixed(2)} weight): ${criteria.success_probability.toFixed(3)} - ${this.getSuccessProbabilityExplanation(criteria.success_probability)}`
    );

    parts.push(
      `Efficiency (${weights.efficiency.toFixed(2)} weight): ${criteria.efficiency.toFixed(3)} - ${this.getEfficiencyExplanation(criteria.efficiency)}`
    );

    parts.push(
      `User preference (${weights.user_preference.toFixed(2)} weight): ${criteria.user_preference.toFixed(3)} - ${this.getUserPreferenceExplanation(criteria.user_preference)}`
    );

    if (context && problem) {
      parts.push(
        `Context: ${problem.complexity} complexity, ${problem.effort_estimate} effort, ${problem.risk_level} risk`
      );
    }

    return parts.join('. ');
  }

  /**
   * Get explanation for contextual fit score
   */
  private getContextualFitExplanation(score: number): string {
    if (score >= 0.8) return 'excellent alignment with existing patterns and architecture';
    if (score >= 0.6) return 'good fit with current codebase and conventions';
    if (score >= 0.4) return 'moderate alignment requiring some adaptations';
    if (score >= 0.2) return 'poor fit with significant changes needed';
    return 'very poor fit requiring major architectural changes';
  }

  /**
   * Get explanation for success probability score
   */
  private getSuccessProbabilityExplanation(score: number): string {
    if (score >= 0.8) return 'very high probability of successful execution';
    if (score >= 0.6) return 'high probability with manageable risks';
    if (score >= 0.4) return 'moderate probability with some challenges';
    if (score >= 0.2) return 'low probability with significant obstacles';
    return 'very low probability with high risk of failure';
  }

  /**
   * Get explanation for efficiency score
   */
  private getEfficiencyExplanation(score: number): string {
    if (score >= 0.8) return 'very efficient implementation with quick delivery';
    if (score >= 0.6) return 'good efficiency with reasonable timeline';
    if (score >= 0.4) return 'moderate efficiency with extended timeline';
    if (score >= 0.2) return 'low efficiency with significant time investment';
    return 'very low efficiency with lengthy implementation';
  }

  /**
   * Get explanation for user preference score
   */
  private getUserPreferenceExplanation(score: number): string {
    if (score >= 0.8) return 'strong alignment with user preferences';
    if (score >= 0.6) return 'good alignment with user expectations';
    if (score >= 0.4) return 'moderate alignment with some preferences met';
    if (score >= 0.2) return 'poor alignment with user preferences';
    return 'very poor alignment conflicting with user preferences';
  }

  /**
   * Get strategy-specific context adjustment
   */
  private getStrategyContextAdjustment(
    _strategyName: string,
    strategyType: string,
    context: ContextAnalysis
  ): number {
    // Strategy-specific context adjustments would be implemented here
    // This is a simplified version
    if (strategyType === 'research' && context.existing_patterns.length > 0) {
      return 0.1;
    }
    if (strategyType === 'development' && context.resources.length > 2) {
      return 0.1;
    }
    return 0;
  }

  /**
   * Get strategy-specific efficiency adjustment
   */
  private getStrategyEfficiencyAdjustment(
    _strategyName: string,
    _problem: ProblemAnalysis,
    _context: ContextAnalysis
  ): number {
    // Strategy-specific efficiency adjustments would be implemented here
    // This is a simplified version
    if (_strategyName.includes('Minimal') || _strategyName.includes('Quick')) {
      return 0.15;
    }
    if (_strategyName.includes('Comprehensive') || _strategyName.includes('Thorough')) {
      return -0.1;
    }
    return 0;
  }

  /**
   * Get keywords associated with a strategy
   */
  private getStrategyKeywords(strategyName: string): string[] {
    const keywords: { [key: string]: string[] } = {
      'Code-Path': ['code', 'flow', 'execution', 'trace'],
      'Pattern Discovery': ['pattern', 'convention', 'architecture'],
      'Architecture Mapping': ['architecture', 'structure', 'design'],
      'Integration Analysis': ['integration', 'connection', 'interface'],
      Sequential: ['sequential', 'step-by-step', 'linear'],
      'Feature-Driven': ['feature', 'user', 'value'],
      'Minimal Viable': ['minimal', 'quick', 'simple'],
      Parallel: ['parallel', 'concurrent', 'team'],
      'Component-First': ['component', 'ui', 'frontend'],
      'API-First': ['api', 'backend', 'service'],
      'Data-First': ['data', 'database', 'model'],
      'Integration-First': ['integration', 'connection', 'existing'],
    };

    for (const [key, vals] of Object.entries(keywords)) {
      if (strategyName.includes(key)) {
        return vals;
      }
    }

    return [strategyName.toLowerCase()];
  }
}

/**
 * Convenience function for confidence calculation
 */
export function calculateConfidence(
  criteria: ConfidenceCriteria,
  weights?: Partial<ConfidenceWeights>,
  context?: ContextAnalysis,
  problem?: ProblemAnalysis
): ConfidenceBreakdown {
  const calculator = new ConfidenceCalculator();
  return calculator.calculateConfidence(criteria, weights, context, problem);
}
