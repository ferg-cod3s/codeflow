#!/usr/bin/env node

import { buildAgentRegistry } from '../mcp/agent-registry.mjs';

/**
 * Debug script to test agent registry loading
 */

async function debugAgentRegistry() {
  console.log('🔍 Building agent registry...\n');

  const registry = await buildAgentRegistry();

  console.log(`📊 Registry built with ${registry.size} agents\n`);

  // Test specific agent
  const testAgentId = 'agent-architect';
  const agent = registry.get(testAgentId);

  if (!agent) {
    console.log(`❌ Agent '${testAgentId}' not found in registry`);
    console.log('Available agents:', Array.from(registry.keys()).slice(0, 10));
    return;
  }

  console.log(`✅ Found agent: ${testAgentId}`);
  console.log(`📋 Agent properties:`);
  console.log(`  - id: ${agent.id}`);
  console.log(`  - name: ${agent.name}`);
  console.log(`  - format: ${agent.format}`);
  console.log(`  - allowedDirectories: ${JSON.stringify(agent.allowedDirectories)}`);
  console.log(
    `  - has allowedDirectories: ${Array.isArray(agent.allowedDirectories) && agent.allowedDirectories.length > 0}`
  );

  // Check frontmatter
  console.log(
    `\n📄 Frontmatter allowed_directories: ${JSON.stringify(agent.frontmatter?.allowed_directories)}`
  );

  // Test a few more agents
  console.log(`\n🔍 Testing a few more agents:`);
  const testAgents = ['codebase-locator', 'thoughts-analyzer', 'security-scanner'];

  for (const agentId of testAgents) {
    const testAgent = registry.get(agentId);
    if (testAgent) {
      console.log(
        `  ${agentId}: allowedDirectories = ${JSON.stringify(testAgent.allowedDirectories)}`
      );
    } else {
      console.log(`  ${agentId}: NOT FOUND`);
    }
  }
}

debugAgentRegistry().catch(console.error);
