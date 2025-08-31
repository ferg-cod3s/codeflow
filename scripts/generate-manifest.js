#!/usr/bin/env node

import { readdir, writeFile } from 'fs/promises';
import path from 'path';

console.log('🏗️ Generating agent manifest...\n');

// Get all agent names from the base directory
const agentFiles = await readdir('agent');
const agents = agentFiles
  .filter(file => file.endsWith('.md'))
  .map(file => path.basename(file, '.md'))
  .sort();

console.log(`Found ${agents.length} canonical agents:`);

const manifest = {
  canonical_agents: agents.map(agentName => ({
    name: agentName,
    description: `Agent: ${agentName.replace(/-|_/g, ' ')}`,
    category: getCategoryFromName(agentName),
    sources: {
      base: `agent/${agentName}.md`,
      "claude-code": `claude-agents/${agentName}.md`,
      opencode: `opencode-agents/${agentName}.md`
    }
  })),
  total_agents: agents.length,
  last_updated: new Date().toISOString(),
  canonical_directories: [
    "agent/",
    "claude-agents/", 
    "opencode-agents/"
  ],
  format_info: {
    base: {
      description: "Base format for MCP integration",
      model_format: "anthropic/model-name",
      primary_use: "MCP server integration"
    },
    "claude-code": {
      description: "Claude Code format",
      model_format: "anthropic/model-name", 
      primary_use: "Claude Code client integration"
    },
    opencode: {
      description: "OpenCode format",
      model_format: "provider/model-name",
      primary_use: "OpenCode client integration"
    }
  }
};

// Simple categorization based on name patterns
function getCategoryFromName(name) {
  if (name.includes('codebase')) return 'core-workflow';
  if (name.includes('thoughts')) return 'core-workflow';  
  if (name.includes('web-search')) return 'core-workflow';
  if (name.includes('operations')) return 'operations';
  if (name.includes('development') || name.includes('migrations')) return 'development';
  if (name.includes('quality') || name.includes('testing') || name.includes('performance')) return 'quality-testing';
  if (name.includes('security')) return 'security';
  if (name.includes('ux') || name.includes('ui')) return 'design-ux';
  if (name.includes('content') || name.includes('localization')) return 'content';
  if (name.includes('growth') || name.includes('seo')) return 'growth';
  if (name.includes('infrastructure') || name.includes('deployment') || name.includes('devops')) return 'infrastructure';
  return 'specialized';
}

// Write the manifest
await writeFile('AGENT_MANIFEST.json', JSON.stringify(manifest, null, 2));

console.log('\n✅ Agent manifest created successfully!');
console.log(`📝 AGENT_MANIFEST.json contains ${manifest.total_agents} agents`);

// Display summary by category
const categories = {};
manifest.canonical_agents.forEach(agent => {
  const cat = agent.category;
  categories[cat] = (categories[cat] || 0) + 1;
});

console.log('\n📊 Agents by category:');
Object.entries(categories).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count} agents`);
});