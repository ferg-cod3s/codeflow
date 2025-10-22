#!/usr/bin/env node

/**
 * Test script for multi-phase workflow orchestrator
 */

import { buildSafeAgentRegistry } from './dist/agent-registry.js';
import { executeResearchWorkflow } from './dist/research-workflow.js';
import { formatResearchReport } from './dist/research-workflow.js';
import { formatValidationResult } from './dist/quality-validator.js';

async function testWorkflow() {
  console.log('🧪 Testing Multi-Phase Workflow Orchestrator\n');
  
  try {
    // Build agent registry
    console.log('📦 Building agent registry...');
    const registry = await buildSafeAgentRegistry();
    console.log(`✅ Loaded ${registry.size} agents\n`);
    
    // Test research workflow options
    const options = {
      query: 'How does the agent registry system work?',
      domain: 'codebase',
      includeExternalResearch: false,
      engageDomainSpecialists: false,
      maxSpecialists: 3,
    };
    
    console.log('🔬 Executing research workflow...');
    console.log(`   Query: ${options.query}`);
    console.log(`   Domain: ${options.domain}\n`);
    
    // Execute workflow
    const result = await executeResearchWorkflow(options, registry);
    
    // Display results
    console.log('\n' + '='.repeat(80));
    console.log('📊 WORKFLOW RESULTS');
    console.log('='.repeat(80) + '\n');
    
    console.log(`Workflow: ${result.workflow.workflow}`);
    console.log(`Total Phases: ${result.workflow.phases.length}`);
    console.log(`Total Duration: ${result.workflow.summary.totalDuration}ms`);
    console.log(`Quality Score: ${result.workflow.summary.qualityScore}/100`);
    console.log(`Confidence: ${result.workflow.summary.confidence}\n`);
    
    // Display phase results
    console.log('Phase Results:');
    for (const phase of result.workflow.phases) {
      const statusIcon = phase.status === 'completed' ? '✅' : 
                        phase.status === 'skipped' ? '⏭️' : '❌';
      console.log(`  ${statusIcon} ${phase.phaseName} (${phase.type})`);
      console.log(`     Status: ${phase.status}`);
      console.log(`     Agents: ${phase.results.length}`);
      if (phase.duration) {
        console.log(`     Duration: ${phase.duration}ms`);
      }
      if (phase.skippedReason) {
        console.log(`     Reason: ${phase.skippedReason}`);
      }
    }
    console.log('');
    
    // Display validation results
    if (result.validation) {
      console.log('\n' + '='.repeat(80));
      console.log('✓ VALIDATION RESULTS');
      console.log('='.repeat(80) + '\n');
      console.log(formatValidationResult(result.validation));
    }
    
    // Display research report
    console.log('\n' + '='.repeat(80));
    console.log('📄 RESEARCH REPORT');
    console.log('='.repeat(80) + '\n');
    console.log(formatResearchReport(result.report));
    
    console.log('\n✅ Test completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run test
testWorkflow();
