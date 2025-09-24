#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

console.log('🏗️ Updating agent manifest...\n');

// Function to recursively find all .md files in a directory
async function findAgentFiles(dir) {
  const agents = new Map();
  
  async function scanDir(currentDir, baseDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);
      
      if (entry.isDirectory()) {
        await scanDir(fullPath, baseDir);
      } else if (entry.name.endsWith('.md') && !entry.name.startsWith('README')) {
        const agentName = entry.name.replace('.md', '');
        const category = path.dirname(relativePath);
        agents.set(agentName, {
          name: agentName,
          category: category === '.' ? 'general' : category,
          path: relativePath
        });
      }
    }
  }
  
  await scanDir(dir, dir);
  return agents;
}

// Get category from directory structure
function normalizeCategory(category) {
  const categoryMap = {
    'ai-innovation': 'ai-innovation',
    'business-analytics': 'business-analytics',
    'design-ux': 'design-ux',
    'development': 'development',
    'generalist': 'generalist',
    'operations': 'operations',
    'product-strategy': 'product-strategy',
    'quality-testing': 'quality-testing'
  };
  
  return categoryMap[category] || category;
}

// Extract description from agent file
async function getAgentDescription(filePath) {
  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // Look for description in frontmatter
    let inFrontmatter = false;
    let description = '';
    
    for (const line of lines) {
      if (line === '---') {
        if (inFrontmatter) break;
        inFrontmatter = true;
        continue;
      }
      
      if (inFrontmatter && line.startsWith('description:')) {
        description = line.substring('description:'.length).trim();
        // Handle multi-line descriptions
        let nextIndex = lines.indexOf(line) + 1;
        while (nextIndex < lines.length && lines[nextIndex].startsWith('  ')) {
          description += ' ' + lines[nextIndex].trim();
          nextIndex++;
        }
        break;
      }
    }
    
    // Clean up description
    description = description.replace(/^["']|["']$/g, '').trim();
    
    // If description is too long or spans multiple lines incorrectly, take first sentence
    if (description.includes('.')) {
      description = description.split('.')[0] + '.';
    }
    
    return description || `Agent for ${filePath.split('/').pop().replace('.md', '').replace(/-/g, ' ')}`;
  } catch (error) {
    console.warn(`Warning: Could not read description from ${filePath}`);
    return `Agent for ${filePath.split('/').pop().replace('.md', '').replace(/-/g, ' ')}`;
  }
}

try {
  // Find all agents in codeflow-agents directory
  const codeflowAgentsDir = path.join(projectRoot, 'codeflow-agents');
  const agents = await findAgentFiles(codeflowAgentsDir);
  
  console.log(`Found ${agents.size} agents in codeflow-agents/`);
  
  // Build the canonical agents array
  const canonicalAgents = [];
  
  for (const [agentName, agentInfo] of agents) {
    const fullPath = path.join(codeflowAgentsDir, agentInfo.path);
    const description = await getAgentDescription(fullPath);
    
    canonicalAgents.push({
      name: agentName,
      description: description.substring(0, 200), // Limit description length
      category: normalizeCategory(agentInfo.category),
      sources: {
        base: `codeflow-agents/${agentInfo.path}`,
        "claude-code": `.claude/agents/${agentName}.md`,
        opencode: `.opencode/agent/${agentName}.md`
      }
    });
  }
  
  // Sort agents by name
  canonicalAgents.sort((a, b) => a.name.localeCompare(b.name));
  
  // Create the manifest
  const manifest = {
    canonical_agents: canonicalAgents,
    total_agents: canonicalAgents.length,
    last_updated: new Date().toISOString()
  };
  
  // Write the manifest
  const manifestPath = path.join(projectRoot, 'AGENT_MANIFEST.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  
  console.log(`\n✅ Agent manifest updated successfully!`);
  console.log(`📝 AGENT_MANIFEST.json contains ${manifest.total_agents} agents`);
  
  // Display summary by category
  const categories = {};
  manifest.canonical_agents.forEach(agent => {
    const cat = agent.category;
    categories[cat] = (categories[cat] || 0) + 1;
  });
  
  console.log('\n📊 Agents by category:');
  Object.entries(categories)
    .sort(([a], [b]) => a.localeCompare(b))
    .forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} agents`);
    });
    
  // Show the 4 missing agents that were added
  const missingAgents = ['compliance-expert', 'cost-optimizer', 'release-manager', 'test-generator'];
  const addedAgents = canonicalAgents.filter(a => missingAgents.includes(a.name));
  
  if (addedAgents.length > 0) {
    console.log('\n🆕 Newly cataloged agents:');
    addedAgents.forEach(agent => {
      console.log(`  - ${agent.name} (${agent.category})`);
    });
  }
  
} catch (error) {
  console.error('❌ Error updating manifest:', error);
  process.exit(1);
}