/**
 * Strategy Generator for Verbalized Sampling
 *
 * Generates and ranks solution strategies based on agent type and problem context.
 * Implements the core VS pattern of creating multiple approaches and selecting the best.
 */

export interface Strategy {
  /** Human-readable name of the strategy */
  name: string;
  /** Detailed description of the approach */
  description: string;
  /** Overall confidence score (0.0-1.0) */
  confidence_score: number;
  /** Detailed scoring breakdown */
  reasoning: StrategyReasoning;
  /** Step-by-step execution plan */
  execution_plan: string[];
  /** Type of strategy (research, planning, development) */
  strategy_type: 'research' | 'planning' | 'development';
}

export interface StrategyReasoning {
  /** How well strategy fits current context (0.0-1.0) */
  contextual_fit: number;
  /** Probability of successful execution (0.0-1.0) */
  success_probability: number;
  /** Efficiency of implementation (0.0-1.0) */
  efficiency: number;
  /** Alignment with user preferences (0.0-1.0) */
  user_preference: number;
  /** Detailed explanation for scores */
  explanation: string;
}

export interface StrategyGenerationRequest {
  /** Problem description or task */
  problem: string;
  /** Type of agent generating strategies */
  agent_type: 'research' | 'planning' | 'development';
  /** Current context and constraints */
  context: {
    codebase_description?: string;
    existing_patterns?: string[];
    constraints?: string[];
    user_preferences?: string[];
    time_constraints?: string;
    resource_constraints?: string[];
  };
  /** Number of strategies to generate (default: 3) */
  strategy_count?: number;
}

export interface StrategyGenerationResult {
  /** Generated strategies */
  strategies: Strategy[];
  /** Selected strategy name */
  selected_strategy: string;
  /** Total confidence in selected approach */
  total_confidence: number;
  /** Summary of the VS process */
  execution_summary: string;
  /** Generation metadata */
  metadata: {
    generated_at: string;
    agent_type: string;
    total_strategies: number;
    confidence_range: [number, number];
  };
}

/**
 * Strategy Generator Class
 *
 * Core class for implementing Verbalized Sampling strategy generation.
 */
export class StrategyGenerator {
  private readonly confidence_weights = {
    contextual_fit: 0.4,
    success_probability: 0.3,
    efficiency: 0.2,
    user_preference: 0.1,
  };

  /**
   * Generate strategies for a given problem and context
   */
  async generateStrategies(request: StrategyGenerationRequest): Promise<StrategyGenerationResult> {
    const strategies = await this.createStrategies(request);
    const rankedStrategies = this.rankStrategies(strategies);
    const selectedStrategy = rankedStrategies[0];

    return {
      strategies: rankedStrategies,
      selected_strategy: selectedStrategy.name,
      total_confidence: selectedStrategy.confidence_score,
      execution_summary: this.generateExecutionSummary(selectedStrategy, rankedStrategies),
      metadata: {
        generated_at: new Date().toISOString(),
        agent_type: request.agent_type,
        total_strategies: strategies.length,
        confidence_range: this.getConfidenceRange(rankedStrategies),
      },
    };
  }

  /**
   * Create strategy candidates based on agent type and problem
   */
  private async createStrategies(request: StrategyGenerationRequest): Promise<Strategy[]> {
    const { agent_type, problem, context } = request;
    const strategyCount = request.strategy_count || 3;

    switch (agent_type) {
      case 'research':
        return this.createResearchStrategies(problem, context, strategyCount);
      case 'planning':
        return this.createPlanningStrategies(problem, context, strategyCount);
      case 'development':
        return this.createDevelopmentStrategies(problem, context, strategyCount);
      default:
        throw new Error(`Unknown agent type: ${agent_type}`);
    }
  }

  /**
   * Create research-focused strategies
   */
  private createResearchStrategies(
    problem: string,
    context: StrategyGenerationRequest['context'],
    count: number
  ): Strategy[] {
    const strategies: Strategy[] = [];

    // Code-Path Analysis Strategy
    strategies.push({
      name: 'Code-Path Analysis',
      description: `Trace execution flows and identify key decision points to understand: ${problem}`,
      confidence_score: 0,
      reasoning: this.calculateReasoning('Code-Path Analysis', problem, context, 'research'),
      execution_plan: [
        'Identify entry points and main execution flows',
        'Trace key decision branches and conditional logic',
        'Map data transformations and state changes',
        'Document critical paths and edge cases',
        'Analyze error handling and exception flows',
      ],
      strategy_type: 'research',
    });

    // Pattern Discovery Strategy
    strategies.push({
      name: 'Pattern Discovery',
      description: `Find recurring patterns and architectural conventions related to: ${problem}`,
      confidence_score: 0,
      reasoning: this.calculateReasoning('Pattern Discovery', problem, context, 'research'),
      execution_plan: [
        'Scan codebase for repeated code structures',
        'Identify naming conventions and architectural patterns',
        'Find common utility functions and shared logic',
        'Analyze design patterns and abstractions',
        'Document pattern variations and evolution',
      ],
      strategy_type: 'research',
    });

    // Architecture Mapping Strategy
    strategies.push({
      name: 'Architecture Mapping',
      description: `Map system boundaries and integration points to understand: ${problem}`,
      confidence_score: 0,
      reasoning: this.calculateReasoning('Architecture Mapping', problem, context, 'research'),
      execution_plan: [
        'Identify major components and modules',
        'Map data flow and dependencies between components',
        'Document interfaces and contracts',
        'Analyze separation of concerns',
        'Identify architectural layers and boundaries',
      ],
      strategy_type: 'research',
    });

    // Integration Analysis Strategy (if needed for count)
    if (count > 3) {
      strategies.push({
        name: 'Integration Analysis',
        description: `Examine how components interact and depend on each other for: ${problem}`,
        confidence_score: 0,
        reasoning: this.calculateReasoning('Integration Analysis', problem, context, 'research'),
        execution_plan: [
          'Identify integration points and interfaces',
          'Analyze data exchange formats and protocols',
          'Document dependency relationships',
          'Map communication patterns (sync/async)',
          'Identify potential failure points and fallbacks',
        ],
        strategy_type: 'research',
      });
    }

    return strategies.slice(0, count);
  }

  /**
   * Create planning-focused strategies
   */
  private createPlanningStrategies(
    problem: string,
    context: StrategyGenerationRequest['context'],
    count: number
  ): Strategy[] {
    const strategies: Strategy[] = [];

    // Sequential Planning Strategy
    strategies.push({
      name: 'Sequential Planning',
      description: `Create step-by-step linear approach with clear dependencies for: ${problem}`,
      confidence_score: 0,
      reasoning: this.calculateReasoning('Sequential Planning', problem, context, 'planning'),
      execution_plan: [
        'Identify prerequisite tasks and dependencies',
        'Create ordered sequence of activities',
        'Define completion criteria for each step',
        'Plan verification and validation points',
        'Estimate timeline and resource needs',
      ],
      strategy_type: 'planning',
    });

    // Feature-Driven Planning Strategy
    strategies.push({
      name: 'Feature-Driven Planning',
      description: `Organize plan around user-facing features and outcomes for: ${problem}`,
      confidence_score: 0,
      reasoning: this.calculateReasoning('Feature-Driven Planning', problem, context, 'planning'),
      execution_plan: [
        'Define user stories and acceptance criteria',
        'Break features into deliverable increments',
        'Plan user experience and interface design',
        'Coordinate frontend and backend development',
        'Plan testing and user validation',
      ],
      strategy_type: 'planning',
    });

    // Minimal Viable Planning Strategy
    strategies.push({
      name: 'Minimal Viable Planning',
      description: `Focus on smallest valuable increment first for: ${problem}`,
      confidence_score: 0,
      reasoning: this.calculateReasoning('Minimal Viable Planning', problem, context, 'planning'),
      execution_plan: [
        'Identify core value proposition',
        'Define smallest useful increment',
        'Plan rapid development and deployment',
        'Build in feedback collection mechanisms',
        'Plan iterative improvements based on usage',
      ],
      strategy_type: 'planning',
    });

    // Parallel Planning Strategy (if needed for count)
    if (count > 3) {
      strategies.push({
        name: 'Parallel Planning',
        description: `Identify independent workstreams for concurrent execution for: ${problem}`,
        confidence_score: 0,
        reasoning: this.calculateReasoning('Parallel Planning', problem, context, 'planning'),
        execution_plan: [
          'Identify independent work packages',
          'Assign workstreams to team members',
          'Plan integration points and coordination',
          'Define interfaces and contracts between streams',
          'Plan testing and validation across streams',
        ],
        strategy_type: 'planning',
      });
    }

    return strategies.slice(0, count);
  }

  /**
   * Create development-focused strategies
   */
  private createDevelopmentStrategies(
    problem: string,
    context: StrategyGenerationRequest['context'],
    count: number
  ): Strategy[] {
    const strategies: Strategy[] = [];

    // Component-First Strategy
    strategies.push({
      name: 'Component-First',
      description: `Build UI components before backend integration for: ${problem}`,
      confidence_score: 0,
      reasoning: this.calculateReasoning('Component-First', problem, context, 'development'),
      execution_plan: [
        'Build UI components with mock data',
        'Implement component state management',
        'Add styling and responsive design',
        'Integrate with backend APIs',
        'Add error handling and loading states',
      ],
      strategy_type: 'development',
    });

    // API-First Strategy
    strategies.push({
      name: 'API-First',
      description: `Design and implement endpoints before consumer code for: ${problem}`,
      confidence_score: 0,
      reasoning: this.calculateReasoning('API-First', problem, context, 'development'),
      execution_plan: [
        'Design API contracts and data models',
        'Implement endpoints with validation',
        'Add authentication and authorization',
        'Create documentation and testing tools',
        'Build client integrations',
      ],
      strategy_type: 'development',
    });

    // Data-First Strategy
    strategies.push({
      name: 'Data-First',
      description: `Establish data model and persistence before business logic for: ${problem}`,
      confidence_score: 0,
      reasoning: this.calculateReasoning('Data-First', problem, context, 'development'),
      execution_plan: [
        'Design data models and relationships',
        'Implement data access layer',
        'Create migration scripts and seeding',
        'Build data processing and validation',
        'Implement business logic and services',
      ],
      strategy_type: 'development',
    });

    // Integration-First Strategy (if needed for count)
    if (count > 3) {
      strategies.push({
        name: 'Integration-First',
        description: `Focus on connecting existing systems over new development for: ${problem}`,
        confidence_score: 0,
        reasoning: this.calculateReasoning('Integration-First', problem, context, 'development'),
        execution_plan: [
          'Analyze existing systems and interfaces',
          'Design integration patterns and data flow',
          'Implement adapters and connectors',
          'Handle authentication and data transformation',
          'Add monitoring and error handling',
        ],
        strategy_type: 'development',
      });
    }

    return strategies.slice(0, count);
  }

  /**
   * Calculate reasoning scores for a strategy
   */
  private calculateReasoning(
    strategyName: string,
    problem: string,
    context: StrategyGenerationRequest['context'],
    agentType: string
  ): StrategyReasoning {
    // This is a simplified implementation - in practice, this would use
    // more sophisticated analysis of the problem and context
    const contextual_fit = this.assessContextualFit(strategyName, context, agentType);
    const success_probability = this.assessSuccessProbability(strategyName, problem, context);
    const efficiency = this.assessEfficiency(strategyName, problem, context);
    const user_preference = this.assessUserPreference(strategyName, context);

    const explanation = `Strategy "${strategyName}" scored well on contextual fit (${contextual_fit.toFixed(2)}) due to alignment with existing patterns, has moderate success probability (${success_probability.toFixed(2)}) based on problem complexity, good efficiency (${efficiency.toFixed(2)}) for implementation speed, and reasonable user preference alignment (${user_preference.toFixed(2)}).`;

    return {
      contextual_fit,
      success_probability,
      efficiency,
      user_preference,
      explanation,
    };
  }

  /**
   * Assess how well strategy fits current context
   */
  private assessContextualFit(
    _strategyName: string,
    context: StrategyGenerationRequest['context'],
    _agentType: string
  ): number {
    // Simplified assessment - would analyze codebase patterns in practice
    if (context.existing_patterns && context.existing_patterns.length > 0) {
      return 0.8; // Good fit with existing patterns
    }
    if (context.codebase_description) {
      return 0.7; // Moderate fit with some context
    }
    return 0.6; // Default moderate fit
  }

  /**
   * Assess probability of successful execution
   */
  private assessSuccessProbability(
    _strategyName: string,
    problem: string,
    context: StrategyGenerationRequest['context']
  ): number {
    // Simplified assessment based on problem complexity and constraints
    if (context.constraints && context.constraints.length > 2) {
      return 0.6; // Lower probability with many constraints
    }
    if (problem.length > 200) {
      return 0.7; // Moderate probability for complex problems
    }
    return 0.8; // High probability for straightforward problems
  }

  /**
   * Assess implementation efficiency
   */
  private assessEfficiency(
    _strategyName: string,
    _problem: string,
    context: StrategyGenerationRequest['context']
  ): number {
    // Simplified assessment based on time and resource constraints
    if (context.time_constraints?.includes('urgent')) {
      return 0.9; // High efficiency for urgent needs
    }
    if (context.resource_constraints && context.resource_constraints.length > 0) {
      return 0.7; // Moderate efficiency with resource limits
    }
    return 0.8; // Good efficiency by default
  }

  /**
   * Assess alignment with user preferences
   */
  private assessUserPreference(
    _strategyName: string,
    context: StrategyGenerationRequest['context']
  ): number {
    // Simplified assessment based on stated preferences
    if (context.user_preferences && context.user_preferences.length > 0) {
      return 0.8; // Good alignment with stated preferences
    }
    return 0.7; // Default reasonable alignment
  }

  /**
   * Calculate final confidence scores and rank strategies
   */
  private rankStrategies(strategies: Strategy[]): Strategy[] {
    // Calculate confidence scores for each strategy
    const scoredStrategies = strategies.map((strategy) => ({
      ...strategy,
      confidence_score: this.calculateConfidenceScore(strategy.reasoning),
    }));

    // Sort by confidence score (descending)
    return scoredStrategies.sort((a, b) => b.confidence_score - a.confidence_score);
  }

  /**
   * Calculate overall confidence score from reasoning components
   */
  private calculateConfidenceScore(reasoning: StrategyReasoning): number {
    return (
      reasoning.contextual_fit * this.confidence_weights.contextual_fit +
      reasoning.success_probability * this.confidence_weights.success_probability +
      reasoning.efficiency * this.confidence_weights.efficiency +
      reasoning.user_preference * this.confidence_weights.user_preference
    );
  }

  /**
   * Generate execution summary for the selected strategy
   */
  private generateExecutionSummary(selectedStrategy: Strategy, allStrategies: Strategy[]): string {
    const alternatives = allStrategies
      .filter((s) => s.name !== selectedStrategy.name)
      .map((s) => `${s.name} (${s.confidence_score.toFixed(2)})`)
      .join(', ');

    return `Selected "${selectedStrategy.name}" with confidence ${selectedStrategy.confidence_score.toFixed(2)}. This approach was chosen over alternatives: ${alternatives}. The strategy provides the best balance of contextual fit, success probability, efficiency, and user preference alignment.`;
  }

  /**
   * Get confidence range from strategy list
   */
  private getConfidenceRange(strategies: Strategy[]): [number, number] {
    if (strategies.length === 0) return [0, 0];

    const scores = strategies.map((s) => s.confidence_score);
    return [Math.min(...scores), Math.max(...scores)];
  }
}

/**
 * Convenience function for strategy generation
 */
export async function generateStrategies(
  request: StrategyGenerationRequest
): Promise<StrategyGenerationResult> {
  const generator = new StrategyGenerator();
  return generator.generateStrategies(request);
}
