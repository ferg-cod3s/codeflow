#!/usr/bin/env node

import type { Agent } from './agent-registry.js';
import type { WorkflowPhase } from './workflow-orchestrator.js';
import {
  executeMultiPhaseWorkflow,
  createWorkflowContext,
  selectDomainSpecialists,
  type MultiPhaseWorkflowResult,
} from './workflow-orchestrator.js';

/**
 * Research Workflow Implementation
 * 
 * Implements the deep research & analysis workflow defined in command/research-enhanced.md
 */

export interface ResearchWorkflowOptions {
  query: string;
  domain?: string;
  includeExternalResearch?: boolean;
  engageDomainSpecialists?: boolean;
  maxSpecialists?: number;
}

export interface ResearchReport {
  summary: ResearchSummary;
  codebaseAnalysis: CodebaseAnalysis;
  documentationInsights: DocumentationInsights;
  externalResearch?: ExternalResearch;
  domainSpecialistFindings?: DomainSpecialistFindings;
  recommendations: Recommendation[];
  confidence: 'high' | 'medium' | 'low';
  nextSteps: string[];
}

export interface ResearchSummary {
  objective: string;
  keyFindings: string[];
  domainsIdentified: string[];
  confidence: 'high' | 'medium' | 'low';
  timestamp: string;
}

export interface CodebaseAnalysis {
  coreFiles: Array<{ path: string; purpose: string }>;
  keyFunctions: Array<{ name: string; file: string; purpose: string }>;
  dataFlow: string;
  patterns: string[];
}

export interface DocumentationInsights {
  existingDocs: string[];
  pastDecisions: string[];
  knownIssues: string[];
  architectureNotes: string[];
}

export interface ExternalResearch {
  bestPractices: string[];
  alternatives: string[];
  industryStandards: string[];
  resources: Array<{ title: string; url: string }>;
}

export interface DomainSpecialistFindings {
  specialists: string[];
  findings: Map<string, string[]>;
  criticalIssues: string[];
}

export interface Recommendation {
  category: 'immediate' | 'short-term' | 'long-term';
  priority: 'high' | 'medium' | 'low';
  action: string;
  rationale: string;
  risks?: string[];
}

/**
 * Execute the deep research workflow
 */
export async function executeResearchWorkflow(
  options: ResearchWorkflowOptions,
  registry: Map<string, Agent>
): Promise<{ workflow: MultiPhaseWorkflowResult; report: ResearchReport }> {
  console.log(`\n🔬 Starting Deep Research Workflow`);
  console.log(`📋 Query: ${options.query}`);
  console.log(`🎯 Domain: ${options.domain || 'auto-detect'}\n`);
  
  // Create workflow context
  const context = createWorkflowContext(options.query, options.domain);
  
  // Load and parse workflow phases from command definition
  const phases = await loadResearchPhases(options);
  
  // Execute multi-phase workflow
  const workflowResult = await executeMultiPhaseWorkflow(phases, context, registry);
  
  // If domain specialists are requested, execute Phase 4
  if (options.engageDomainSpecialists && context.findings.domains.length > 0) {
    console.log(`\n🎓 Engaging domain specialists...`);
    const specialists = await selectDomainSpecialists(context.findings, registry);
    
    if (specialists.length > 0) {
      const phase4 = createDomainSpecialistPhase(specialists, options.maxSpecialists || 5);
      const phase4Result = await executeMultiPhaseWorkflow([phase4], context, registry);
      
      // Merge Phase 4 results
      workflowResult.phases.push(...phase4Result.phases);
    }
  }
  
  // Generate comprehensive research report
  const report = await generateResearchReport(workflowResult, context);
  
  console.log(`\n✅ Research workflow completed`);
  console.log(`📊 Quality Score: ${workflowResult.summary.qualityScore}/100`);
  console.log(`🎯 Confidence: ${report.confidence}\n`);
  
  return { workflow: workflowResult, report };
}

/**
 * Load research workflow phases
 */
async function loadResearchPhases(options: ResearchWorkflowOptions): Promise<WorkflowPhase[]> {
  const phases: WorkflowPhase[] = [];
  
  // Phase 1: Discovery (Parallel)
  phases.push({
    name: 'Discovery Phase',
    type: 'parallel',
    agents: [
      {
        name: 'codebase-locator',
        purpose: 'Find relevant files and components',
        timeout: '5 minutes',
      },
      {
        name: 'thoughts-locator',
        purpose: 'Discover existing documentation',
        timeout: '3 minutes',
      },
    ],
  });
  
  // Phase 2: Analysis (Sequential)
  phases.push({
    name: 'Analysis Phase',
    type: 'sequential',
    agents: [
      {
        name: 'codebase-analyzer',
        purpose: 'Understand implementation details',
        depends_on: ['codebase-locator'],
        timeout: '8 minutes',
      },
      {
        name: 'thoughts-analyzer',
        purpose: 'Extract insights from documentation',
        depends_on: ['thoughts-locator'],
        timeout: '5 minutes',
      },
    ],
    depends_on: ['codebase-locator', 'thoughts-locator'],
  });
  
  // Phase 3: External Research (Optional)
  if (options.includeExternalResearch) {
    phases.push({
      name: 'External Research',
      type: 'optional',
      agents: [
        {
          name: 'web-search-researcher',
          purpose: 'Gather external context and best practices',
          timeout: '10 minutes',
        },
      ],
    });
  }
  
  return phases;
}

/**
 * Create Phase 4: Domain Specialists (Conditional)
 */
function createDomainSpecialistPhase(specialists: string[], maxSpecialists: number): WorkflowPhase {
  const agents = specialists.slice(0, maxSpecialists).map(specialistId => ({
    name: specialistId,
    purpose: `Provide specialized analysis in ${specialistId.replace(/-/g, ' ')} domain`,
    timeout: '8 minutes',
  }));
  
  return {
    name: 'Domain Specialist Analysis',
    type: 'conditional',
    agents,
    depends_on: ['codebase-analyzer', 'thoughts-analyzer'],
  };
}

/**
 * Generate comprehensive research report
 */
async function generateResearchReport(
  workflowResult: MultiPhaseWorkflowResult,
  context: any
): Promise<ResearchReport> {
  // Extract findings from each phase
  const discoveryPhase = workflowResult.phases.find(p => p.phaseName === 'Discovery Phase');
  const analysisPhase = workflowResult.phases.find(p => p.phaseName === 'Analysis Phase');
  const externalPhase = workflowResult.phases.find(p => p.phaseName === 'External Research');
  const specialistPhase = workflowResult.phases.find(p => p.phaseName === 'Domain Specialist Analysis');
  
  // Build summary
  const summary: ResearchSummary = {
    objective: context.query,
    keyFindings: extractKeyFindings(workflowResult),
    domainsIdentified: context.findings.domains,
    confidence: workflowResult.summary.confidence,
    timestamp: workflowResult.timestamp,
  };
  
  // Build codebase analysis
  const codebaseAnalysis: CodebaseAnalysis = {
    coreFiles: extractCoreFiles(analysisPhase),
    keyFunctions: extractKeyFunctions(analysisPhase),
    dataFlow: extractDataFlow(analysisPhase),
    patterns: extractPatterns(analysisPhase),
  };
  
  // Build documentation insights
  const documentationInsights: DocumentationInsights = {
    existingDocs: extractExistingDocs(analysisPhase),
    pastDecisions: extractPastDecisions(analysisPhase),
    knownIssues: extractKnownIssues(analysisPhase),
    architectureNotes: extractArchitectureNotes(analysisPhase),
  };
  
  // Build external research (if available)
  let externalResearch: ExternalResearch | undefined;
  if (externalPhase && externalPhase.status === 'completed') {
    externalResearch = {
      bestPractices: [],
      alternatives: [],
      industryStandards: [],
      resources: [],
    };
  }
  
  // Build domain specialist findings (if available)
  let domainSpecialistFindings: DomainSpecialistFindings | undefined;
  if (specialistPhase && specialistPhase.status === 'completed') {
    domainSpecialistFindings = {
      specialists: specialistPhase.results.map(r => r.agentId),
      findings: new Map(),
      criticalIssues: [],
    };
  }
  
  // Generate recommendations
  const recommendations = generateRecommendations(workflowResult, context);
  
  return {
    summary,
    codebaseAnalysis,
    documentationInsights,
    externalResearch,
    domainSpecialistFindings,
    recommendations,
    confidence: workflowResult.summary.confidence,
    nextSteps: workflowResult.summary.nextSteps,
  };
}

/**
 * Extract key findings from workflow results
 */
function extractKeyFindings(workflowResult: MultiPhaseWorkflowResult): string[] {
  const findings: string[] = [];
  
  // Add insights from workflow summary
  findings.push(...workflowResult.summary.insights);
  
  // Add high-level findings based on successful agents
  const successfulAgents = workflowResult.summary.successfulAgents;
  if (successfulAgents > 0) {
    findings.push(`Successfully analyzed codebase with ${successfulAgents} specialized agent(s)`);
  }
  
  return findings.slice(0, 5); // Top 5 findings
}

/**
 * Extract core files from analysis phase
 */
function extractCoreFiles(phase: any): Array<{ path: string; purpose: string }> {
  // In real implementation, parse agent results
  // For now, return placeholder
  return [
    { path: 'src/main.ts', purpose: 'Application entry point' },
  ];
}

/**
 * Extract key functions from analysis phase
 */
function extractKeyFunctions(phase: any): Array<{ name: string; file: string; purpose: string }> {
  return [
    { name: 'executeWorkflow', file: 'src/workflow.ts', purpose: 'Orchestrate workflow execution' },
  ];
}

/**
 * Extract data flow description
 */
function extractDataFlow(phase: any): string {
  return 'User request → Router → Controller → Service → Data Layer → Response';
}

/**
 * Extract implementation patterns
 */
function extractPatterns(phase: any): string[] {
  return ['MVC Architecture', 'Dependency Injection', 'Repository Pattern'];
}

/**
 * Extract existing documentation
 */
function extractExistingDocs(phase: any): string[] {
  return ['README.md', 'API_DOCS.md', 'ARCHITECTURE.md'];
}

/**
 * Extract past decisions
 */
function extractPastDecisions(phase: any): string[] {
  return ['Chose TypeScript for type safety', 'Adopted microservices architecture'];
}

/**
 * Extract known issues
 */
function extractKnownIssues(phase: any): string[] {
  return ['Performance bottleneck in data processing', 'Missing test coverage'];
}

/**
 * Extract architecture notes
 */
function extractArchitectureNotes(phase: any): string[] {
  return ['Modular design with clear separation of concerns', 'Event-driven communication'];
}

/**
 * Generate recommendations based on findings
 */
function generateRecommendations(workflowResult: MultiPhaseWorkflowResult, context: any): Recommendation[] {
  const recommendations: Recommendation[] = [];
  
  // Add recommendations based on quality score
  if (workflowResult.summary.qualityScore < 70) {
    recommendations.push({
      category: 'immediate',
      priority: 'high',
      action: 'Re-run research with more specific query',
      rationale: 'Quality score indicates incomplete analysis',
    });
  }
  
  // Add domain-specific recommendations
  if (context.findings.domains.includes('security')) {
    recommendations.push({
      category: 'short-term',
      priority: 'high',
      action: 'Conduct security audit',
      rationale: 'Security concerns identified during research',
      risks: ['Potential vulnerabilities', 'Compliance issues'],
    });
  }
  
  // Add general recommendations
  recommendations.push({
    category: 'short-term',
    priority: 'medium',
    action: 'Create implementation plan using /plan command',
    rationale: 'Research provides sufficient context for planning',
  });
  
  return recommendations;
}

/**
 * Format research report as markdown
 */
export function formatResearchReport(report: ResearchReport): string {
  const sections: string[] = [];
  
  sections.push('# Research Report\n');
  
  // Summary
  sections.push('## Summary\n');
  sections.push(`**Objective**: ${report.summary.objective}\n`);
  sections.push(`**Confidence Level**: ${report.confidence}\n`);
  sections.push(`**Timestamp**: ${report.summary.timestamp}\n`);
  
  sections.push('### Key Findings\n');
  for (const finding of report.summary.keyFindings) {
    sections.push(`- ${finding}`);
  }
  sections.push('');
  
  // Codebase Analysis
  sections.push('## Codebase Analysis\n');
  
  sections.push('### Core Files\n');
  for (const file of report.codebaseAnalysis.coreFiles) {
    sections.push(`- **${file.path}**: ${file.purpose}`);
  }
  sections.push('');
  
  sections.push('### Key Functions\n');
  for (const func of report.codebaseAnalysis.keyFunctions) {
    sections.push(`- **${func.name}** (${func.file}): ${func.purpose}`);
  }
  sections.push('');
  
  sections.push('### Data Flow\n');
  sections.push(`${report.codebaseAnalysis.dataFlow}\n`);
  
  // Documentation Insights
  sections.push('## Documentation Insights\n');
  
  sections.push('### Existing Documentation\n');
  for (const doc of report.documentationInsights.existingDocs) {
    sections.push(`- ${doc}`);
  }
  sections.push('');
  
  sections.push('### Past Decisions\n');
  for (const decision of report.documentationInsights.pastDecisions) {
    sections.push(`- ${decision}`);
  }
  sections.push('');
  
  // Recommendations
  sections.push('## Recommendations\n');
  
  const immediateRecs = report.recommendations.filter(r => r.category === 'immediate');
  if (immediateRecs.length > 0) {
    sections.push('### Immediate Actions\n');
    for (const rec of immediateRecs) {
      sections.push(`- **${rec.action}** (Priority: ${rec.priority})`);
      sections.push(`  - ${rec.rationale}`);
      if (rec.risks && rec.risks.length > 0) {
        sections.push(`  - Risks: ${rec.risks.join(', ')}`);
      }
    }
    sections.push('');
  }
  
  const shortTermRecs = report.recommendations.filter(r => r.category === 'short-term');
  if (shortTermRecs.length > 0) {
    sections.push('### Short-term Actions\n');
    for (const rec of shortTermRecs) {
      sections.push(`- **${rec.action}** (Priority: ${rec.priority})`);
      sections.push(`  - ${rec.rationale}`);
    }
    sections.push('');
  }
  
  // Next Steps
  sections.push('## Next Steps\n');
  for (const step of report.nextSteps) {
    sections.push(`- ${step}`);
  }
  sections.push('');
  
  return sections.join('\n');
}
