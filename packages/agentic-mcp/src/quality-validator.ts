#!/usr/bin/env node

import type { AgentExecutionResult } from './agent-spawner.js';
import type { MultiPhaseWorkflowResult, WorkflowContext } from './workflow-orchestrator.js';

/**
 * Quality Validation and Metrics Calculation
 * 
 * Provides quality gates, confidence scoring, and validation for workflow results
 */

export interface QualityMetrics {
  completeness: number;
  accuracy: number;
  coverage: number;
  consistency: number;
  overallScore: number;
  confidence: 'high' | 'medium' | 'low';
  gates: QualityGate[];
}

export interface QualityGate {
  name: string;
  passed: boolean;
  score: number;
  threshold: number;
  message: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface ValidationResult {
  valid: boolean;
  metrics: QualityMetrics;
  issues: ValidationIssue[];
  recommendations: string[];
}

export interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  agentId?: string;
  suggestion?: string;
}

/**
 * Validate workflow results and calculate quality metrics
 */
export function validateWorkflowQuality(
  workflowResult: MultiPhaseWorkflowResult,
  context: WorkflowContext
): ValidationResult {
  const metrics = calculateQualityMetrics(workflowResult, context);
  const issues = identifyValidationIssues(workflowResult, metrics);
  const recommendations = generateQualityRecommendations(metrics, issues);
  
  return {
    valid: metrics.overallScore >= 60, // Minimum quality threshold
    metrics,
    issues,
    recommendations,
  };
}

/**
 * Calculate comprehensive quality metrics
 */
export function calculateQualityMetrics(
  workflowResult: MultiPhaseWorkflowResult,
  context: WorkflowContext
): QualityMetrics {
  // Calculate individual metric scores
  const completeness = calculateCompleteness(workflowResult);
  const accuracy = calculateAccuracy(workflowResult);
  const coverage = calculateCoverage(workflowResult, context);
  const consistency = calculateConsistency(workflowResult);
  
  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    completeness * 0.3 +
    accuracy * 0.3 +
    coverage * 0.2 +
    consistency * 0.2
  );
  
  // Determine confidence level
  let confidence: 'high' | 'medium' | 'low' = 'medium';
  if (overallScore >= 80) confidence = 'high';
  if (overallScore < 50) confidence = 'low';
  
  // Evaluate quality gates
  const gates = evaluateQualityGates(workflowResult, {
    completeness,
    accuracy,
    coverage,
    consistency,
    overallScore,
    confidence,
    gates: [],
  });
  
  return {
    completeness,
    accuracy,
    coverage,
    consistency,
    overallScore,
    confidence,
    gates,
  };
}

/**
 * Calculate completeness score (0-100)
 */
function calculateCompleteness(workflowResult: MultiPhaseWorkflowResult): number {
  const totalPhases = workflowResult.phases.length;
  const completedPhases = workflowResult.phases.filter(p => p.status === 'completed').length;
  
  if (totalPhases === 0) return 0;
  
  const phaseCompletion = (completedPhases / totalPhases) * 100;
  
  // Factor in agent success rate
  const agentCompletion = (workflowResult.summary.successfulAgents / workflowResult.summary.totalAgents) * 100;
  
  // Weighted average
  return Math.round(phaseCompletion * 0.6 + agentCompletion * 0.4);
}

/**
 * Calculate accuracy score (0-100)
 */
function calculateAccuracy(workflowResult: MultiPhaseWorkflowResult): number {
  const { successfulAgents, failedAgents, totalAgents } = workflowResult.summary;
  
  if (totalAgents === 0) return 0;
  
  // Base accuracy on success rate
  const successRate = (successfulAgents / totalAgents) * 100;
  
  // Penalty for failures
  const failurePenalty = (failedAgents / totalAgents) * 20;
  
  return Math.max(0, Math.round(successRate - failurePenalty));
}

/**
 * Calculate coverage score (0-100)
 */
function calculateCoverage(workflowResult: MultiPhaseWorkflowResult, context: WorkflowContext): number {
  // Coverage based on:
  // 1. Number of domains identified
  // 2. Variety of agents used
  // 3. Depth of analysis (sequential phases completed)
  
  const domainsIdentified = context.findings.domains.length;
  const domainScore = Math.min(domainsIdentified * 20, 50); // Max 50 points for 2.5+ domains
  
  const uniqueAgents = new Set(workflowResult.phases.flatMap(p => p.results.map(r => r.agentId))).size;
  const varietyScore = Math.min(uniqueAgents * 10, 30); // Max 30 points for 3+ agents
  
  const sequentialPhases = workflowResult.phases.filter(p => p.type === 'sequential' && p.status === 'completed').length;
  const depthScore = Math.min(sequentialPhases * 10, 20); // Max 20 points for 2+ sequential phases
  
  return Math.round(domainScore + varietyScore + depthScore);
}

/**
 * Calculate consistency score (0-100)
 */
function calculateConsistency(workflowResult: MultiPhaseWorkflowResult): number {
  // Consistency based on:
  // 1. No conflicting results
  // 2. Proper dependency resolution
  // 3. Uniform quality across phases
  
  let score = 100;
  
  // Check for failed dependencies
  const failedDependencies = workflowResult.phases.filter(
    p => p.status === 'failed' && p.results.length === 0
  ).length;
  score -= failedDependencies * 20;
  
  // Check for inconsistent phase results
  const phaseSuccessRates = workflowResult.phases.map(phase => {
    if (phase.results.length === 0) return 1;
    return phase.results.filter(r => r.status === 'ready').length / phase.results.length;
  });
  
  const variance = calculateVariance(phaseSuccessRates);
  score -= Math.round(variance * 30); // Penalty for high variance
  
  return Math.max(0, Math.round(score));
}

/**
 * Calculate variance of an array
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  
  return variance;
}

/**
 * Evaluate quality gates
 */
function evaluateQualityGates(
  workflowResult: MultiPhaseWorkflowResult,
  metrics: QualityMetrics
): QualityGate[] {
  const gates: QualityGate[] = [];
  
  // Gate 1: Minimum completeness
  gates.push({
    name: 'Completeness',
    passed: metrics.completeness >= 70,
    score: metrics.completeness,
    threshold: 70,
    message: metrics.completeness >= 70
      ? 'Workflow achieved sufficient completeness'
      : 'Workflow completeness below threshold',
    severity: metrics.completeness >= 70 ? 'info' : 'critical',
  });
  
  // Gate 2: Minimum accuracy
  gates.push({
    name: 'Accuracy',
    passed: metrics.accuracy >= 75,
    score: metrics.accuracy,
    threshold: 75,
    message: metrics.accuracy >= 75
      ? 'Agent execution accuracy is acceptable'
      : 'High agent failure rate detected',
    severity: metrics.accuracy >= 75 ? 'info' : 'warning',
  });
  
  // Gate 3: Minimum coverage
  gates.push({
    name: 'Coverage',
    passed: metrics.coverage >= 60,
    score: metrics.coverage,
    threshold: 60,
    message: metrics.coverage >= 60
      ? 'Analysis coverage is sufficient'
      : 'Limited analysis coverage',
    severity: metrics.coverage >= 60 ? 'info' : 'warning',
  });
  
  // Gate 4: Consistency
  gates.push({
    name: 'Consistency',
    passed: metrics.consistency >= 70,
    score: metrics.consistency,
    threshold: 70,
    message: metrics.consistency >= 70
      ? 'Results are consistent across phases'
      : 'Inconsistencies detected in results',
    severity: metrics.consistency >= 70 ? 'info' : 'warning',
  });
  
  // Gate 5: Overall quality
  gates.push({
    name: 'Overall Quality',
    passed: metrics.overallScore >= 70,
    score: metrics.overallScore,
    threshold: 70,
    message: metrics.overallScore >= 70
      ? 'Workflow meets quality standards'
      : 'Workflow quality below acceptable threshold',
    severity: metrics.overallScore >= 70 ? 'info' : 'critical',
  });
  
  return gates;
}

/**
 * Identify validation issues
 */
function identifyValidationIssues(
  workflowResult: MultiPhaseWorkflowResult,
  metrics: QualityMetrics
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  
  // Check for failed gates
  for (const gate of metrics.gates) {
    if (!gate.passed && gate.severity === 'critical') {
      issues.push({
        type: 'error',
        category: 'quality-gate',
        message: `Quality gate failed: ${gate.name} (${gate.score}/${gate.threshold})`,
        suggestion: `Improve ${gate.name.toLowerCase()} by re-running workflow or adjusting parameters`,
      });
    } else if (!gate.passed && gate.severity === 'warning') {
      issues.push({
        type: 'warning',
        category: 'quality-gate',
        message: `Quality gate warning: ${gate.name} (${gate.score}/${gate.threshold})`,
        suggestion: `Consider improving ${gate.name.toLowerCase()}`,
      });
    }
  }
  
  // Check for failed agents
  for (const phase of workflowResult.phases) {
    for (const result of phase.results) {
      if (result.status === 'error') {
        issues.push({
          type: 'error',
          category: 'agent-execution',
          message: `Agent ${result.agentId} failed: ${result.error}`,
          agentId: result.agentId,
          suggestion: 'Check agent configuration and availability',
        });
      }
    }
  }
  
  // Check for skipped phases
  const skippedPhases = workflowResult.phases.filter(p => p.status === 'skipped');
  if (skippedPhases.length > 0) {
    issues.push({
      type: 'info',
      category: 'workflow',
      message: `${skippedPhases.length} phase(s) were skipped`,
      suggestion: 'Review conditional phase logic if this was unexpected',
    });
  }
  
  return issues;
}

/**
 * Generate quality improvement recommendations
 */
function generateQualityRecommendations(
  metrics: QualityMetrics,
  issues: ValidationIssue[]
): string[] {
  const recommendations: string[] = [];
  
  // Recommendations based on metrics
  if (metrics.completeness < 70) {
    recommendations.push('Increase workflow completeness by ensuring all phases execute successfully');
  }
  
  if (metrics.accuracy < 75) {
    recommendations.push('Improve agent accuracy by validating agent configurations and dependencies');
  }
  
  if (metrics.coverage < 60) {
    recommendations.push('Enhance coverage by including more specialized agents or additional research phases');
  }
  
  if (metrics.consistency < 70) {
    recommendations.push('Improve consistency by ensuring proper dependency resolution and uniform agent quality');
  }
  
  // Recommendations based on issues
  const errorCount = issues.filter(i => i.type === 'error').length;
  if (errorCount > 0) {
    recommendations.push(`Resolve ${errorCount} error(s) to improve overall quality`);
  }
  
  const warningCount = issues.filter(i => i.type === 'warning').length;
  if (warningCount > 2) {
    recommendations.push('Address warnings to enhance workflow reliability');
  }
  
  // General recommendations
  if (metrics.overallScore < 80) {
    recommendations.push('Consider re-running workflow with adjusted parameters or additional agents');
  }
  
  return recommendations;
}

/**
 * Format quality metrics as readable string
 */
export function formatQualityMetrics(metrics: QualityMetrics): string {
  const lines: string[] = [];
  
  lines.push('Quality Metrics:');
  lines.push(`  Completeness: ${metrics.completeness}/100`);
  lines.push(`  Accuracy: ${metrics.accuracy}/100`);
  lines.push(`  Coverage: ${metrics.coverage}/100`);
  lines.push(`  Consistency: ${metrics.consistency}/100`);
  lines.push(`  Overall Score: ${metrics.overallScore}/100`);
  lines.push(`  Confidence: ${metrics.confidence}`);
  lines.push('');
  
  lines.push('Quality Gates:');
  for (const gate of metrics.gates) {
    const status = gate.passed ? '✓' : '✗';
    const icon = gate.severity === 'critical' ? '🔴' : gate.severity === 'warning' ? '⚠️' : '✅';
    lines.push(`  ${status} ${icon} ${gate.name}: ${gate.score}/${gate.threshold} - ${gate.message}`);
  }
  
  return lines.join('\n');
}

/**
 * Format validation result as readable string
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];
  
  lines.push(result.valid ? '✅ Validation Passed' : '❌ Validation Failed');
  lines.push('');
  
  lines.push(formatQualityMetrics(result.metrics));
  lines.push('');
  
  if (result.issues.length > 0) {
    lines.push('Issues:');
    for (const issue of result.issues) {
      const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
      lines.push(`  ${icon} [${issue.category}] ${issue.message}`);
      if (issue.suggestion) {
        lines.push(`     → ${issue.suggestion}`);
      }
    }
    lines.push('');
  }
  
  if (result.recommendations.length > 0) {
    lines.push('Recommendations:');
    for (const rec of result.recommendations) {
      lines.push(`  • ${rec}`);
    }
  }
  
  return lines.join('\n');
}
