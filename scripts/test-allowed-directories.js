#!/usr/bin/env node

import { buildAgentRegistry } from '../mcp/agent-registry.mjs';
import { spawnAgentTask } from '../mcp/agent-spawner.mjs';

/**
 * Test script to verify allowed directories functionality
 */

async function testAllowedDirectories() {
  console.log('🧪 Testing allowed directories functionality...\n');

  // Build the agent registry
  const registry = await buildAgentRegistry();

  // Test with agent-architect (should have allowed directories)
  const testAgentId = 'agent-architect';
  const agent = registry.get(testAgentId);

  if (!agent) {
    console.log(`❌ Test agent '${testAgentId}' not found in registry`);
    return;
  }

  console.log(`📋 Testing agent: ${testAgentId}`);
  console.log(`📂 Allowed directories: ${JSON.stringify(agent.allowedDirectories, null, 2)}`);

  // Test path checking
  const testPaths = [
    '/Users/johnferguson/Github/test.txt', // Should be allowed
    '/Users/johnferguson/Documents/test.txt', // Should be denied
    '/tmp/test.txt', // Should be denied
    '/Users/johnferguson/Github/projects/myproject', // Should be allowed
  ];

  console.log('\n🔍 Testing path access:');
  testPaths.forEach((path) => {
    const isAllowed = agent.allowedDirectories.some((allowedDir) =>
      path.startsWith(allowedDir.replace(/\\/g, '/'))
    );
    console.log(`  ${isAllowed ? '✅' : '❌'} ${path}`);
  });

  // Test spawning the agent
  console.log('\n🚀 Testing agent spawning...');
  try {
    const result = await spawnAgentTask(testAgentId, 'Test task for directory access', registry);
    console.log(`✅ Agent spawned successfully`);
    console.log(
      `📋 Execution context includes allowed directories: ${result.executionContext.allowedDirectories.length > 0}`
    );
    console.log(
      `🔒 Path checking function available: ${typeof result.executionContext.isPathAllowed === 'function'}`
    );
  } catch (error) {
    console.log(`❌ Failed to spawn agent: ${error.message}`);
  }

  console.log('\n✅ Allowed directories test completed!');
}

// Run the test
testAllowedDirectories().catch(console.error);
