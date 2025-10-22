import { readdir, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

export interface BuildManifestOptions {
  /** Output file path (defaults to AGENT_MANIFEST.json) */
  output?: string;
  /** Dry run - show what would be generated without writing */
  dryRun?: boolean;
  /** Verbose output */
  verbose?: boolean;
  /** Project root directory (defaults to process.cwd()) */
  projectRoot?: string;
}

export interface AgentManifest {
  canonical_agents: Array<{
    name: string;
    description: string;
    category: string;
    sources: {
      base: string;
      'claude-code': string;
      opencode: string;
    };
  }>;
  total_agents: number;
  last_updated: string;
  canonical_directories: string[];
  format_info: {
    base: {
      description: string;
      model_format: string;
      primary_use: string;
    };
    'claude-code': {
      description: string;
      model_format: string;
      primary_use: string;
    };
    opencode: {
      description: string;
      model_format: string;
      primary_use: string;
    };
  };
}

/**
 * Simple categorization based on name patterns
 */
function getCategoryFromName(name: string): string {
  if (name.includes('codebase')) return 'core-workflow';
  if (name.includes('research')) return 'core-workflow';
  if (name.includes('web-search')) return 'core-workflow';
  if (name.includes('operations')) return 'operations';
  if (name.includes('development') || name.includes('migrations')) return 'development';
  if (name.includes('quality') || name.includes('testing') || name.includes('performance'))
    return 'quality-testing';
  if (name.includes('security')) return 'security';
  if (name.includes('ux') || name.includes('ui')) return 'design-ux';
  if (name.includes('content') || name.includes('localization')) return 'content';
  if (name.includes('growth') || name.includes('seo')) return 'growth';
  if (name.includes('infrastructure') || name.includes('deployment') || name.includes('devops'))
    return 'infrastructure';
  return 'specialized';
}

/**
 * Scan codeflow-agents directory and build manifest
 */
interface DiscoveredAgent {
  name: string;
  category: string;
}

async function scanAgentsDirectory(projectRoot: string): Promise<DiscoveredAgent[]> {
  const agentsDir = join(projectRoot, 'codeflow-agents');

  if (!existsSync(agentsDir)) {
    throw new Error(`Codeflow agents directory not found: ${agentsDir}`);
  }

  const agents: DiscoveredAgent[] = [];
  const categories = await readdir(agentsDir);

  for (const category of categories) {
    const categoryPath = join(agentsDir, category);
    if (!existsSync(categoryPath)) continue;

    const files = await readdir(categoryPath);
    const mdFiles = files.filter((f) => f.endsWith('.md'));

    for (const file of mdFiles) {
      const agentName = file.replace('.md', '');
      agents.push({ name: agentName, category });
    }
  }

  return agents.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Build the agent manifest
 */
export async function buildManifest(options: BuildManifestOptions = {}): Promise<void> {
  const {
    output = 'AGENT_MANIFEST.json',
    dryRun = false,
    verbose = false,
    projectRoot = process.cwd(),
  } = options;

  if (verbose) {
    console.log('🏗️ Generating agent manifest...\n');
  }

  try {
    // Scan for agents
    const agents = await scanAgentsDirectory(projectRoot);

    if (verbose) {
      console.log(`Found ${agents.length} canonical agents:`);
    }

    const manifest: AgentManifest = {
      canonical_agents: agents.map((agent) => ({
        name: agent.name,
        description: `Agent: ${agent.name.replace(/-|_/g, ' ')}`,
        // Prefer the real directory name discovered from filesystem; fallback to heuristic if needed
        category: agent.category || getCategoryFromName(agent.name),
        sources: {
          base: `codeflow-agents/${agent.category}/${agent.name}.md`,
          'claude-code': `.claude/agents/${agent.name}.md`,
          opencode: `.opencode/agent/${agent.name}.md`,
        },
      })),
      total_agents: agents.length,
      last_updated: new Date().toISOString(),
      canonical_directories: ['codeflow-agents/', '.claude/agents/', '.opencode/agent/'],
      format_info: {
        base: {
          description: 'Base format for MCP integration',
          model_format: 'anthropic/model-name',
          primary_use: 'MCP server integration',
        },
        'claude-code': {
          description: 'Claude Code format',
          model_format: 'anthropic/model-name',
          primary_use: 'Claude Code client integration',
        },
        opencode: {
          description: 'OpenCode format',
          model_format: 'provider/model-name',
          primary_use: 'OpenCode client integration',
        },
      },
    };

    if (dryRun) {
      console.log('🔍 Dry run - would generate manifest:');
      console.log(JSON.stringify(manifest, null, 2));
      return;
    }

    // Ensure output directory exists
    const outputDir = dirname(output);
    if (outputDir !== '.' && !existsSync(outputDir)) {
      await mkdir(outputDir, { recursive: true });
    }

    // Write the manifest
    await writeFile(output, JSON.stringify(manifest, null, 2));

    console.log('\n✅ Agent manifest created successfully!');
    console.log(`📝 ${output} contains ${manifest.total_agents} agents`);

    // Display summary by category
    const categories: Record<string, number> = {};
    manifest.canonical_agents.forEach((agent) => {
      const cat = agent.category;
      categories[cat] = (categories[cat] || 0) + 1;
    });

    console.log('\n📊 Agents by category:');
    Object.entries(categories).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count} agents`);
    });
  } catch (error: any) {
    console.error(`❌ Failed to build manifest: ${error.message}`);
    throw error;
  }
}
