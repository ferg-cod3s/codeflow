#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import CatalogIndexBuilder from '../src/catalog/index-builder.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

async function main() {
  console.log('🏗️  Building catalog index from local sources...\n');
  
  const builder = new CatalogIndexBuilder(projectRoot);
  
  try {
    // Build index from local files
    const index = await builder.buildFromLocal();
    
    // Save the catalog index
    await builder.save(index);
    
    console.log('\n📦 Catalog Contents:');
    console.log('═══════════════════');
    
    // Display agents by category
    const agentsByCategory = {};
    index.items.filter(i => i.kind === 'agent').forEach(item => {
      const category = item.tags[0] || 'uncategorized';
      if (!agentsByCategory[category]) {
        agentsByCategory[category] = [];
      }
      agentsByCategory[category].push(item.name);
    });
    
    console.log('\n📋 Agents by Category:');
    Object.entries(agentsByCategory).forEach(([category, agents]) => {
      console.log(`  ${category}: ${agents.length} agents`);
      agents.slice(0, 3).forEach(agent => {
        console.log(`    - ${agent}`);
      });
      if (agents.length > 3) {
        console.log(`    ... and ${agents.length - 3} more`);
      }
    });
    
    // Display commands
    console.log('\n⚡ Commands:');
    const commands = index.items.filter(i => i.kind === 'command');
    commands.forEach(cmd => {
      console.log(`  - ${cmd.name}: ${cmd.description.substring(0, 60)}...`);
    });
    
    console.log('\n✅ Catalog index built successfully!');
    console.log('📄 Output: CATALOG_INDEX.json');
    
  } catch (error) {
    console.error('❌ Failed to build catalog:', error);
    process.exit(1);
  }
}

main().catch(console.error);