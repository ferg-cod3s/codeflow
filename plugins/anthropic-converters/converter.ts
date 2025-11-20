import * as path from 'path';
import { readFile, writeFile, readAllFiles, ensureDir } from './utils/file-utils';
import { parseMarkdownFrontmatter, stringifyMarkdownFrontmatter } from './utils/yaml-utils';

export interface AnthropicSkill {
  name: string;
  description: string;
  license?: string;
  prompt: string;
}

export interface OpenCodePlugin {
  name: string;
  version: string;
  description: string;
  main: string;
  type: 'skill' | 'agent' | 'command';
  opencode?: {
    category?: string;
    tags?: string[];
    author?: string;
    repository?: string;
  };
  files: {
    [key: string]: string;
  };
}

export class AnthropicConverter {
  private convertedPlugins = new Map<string, OpenCodePlugin>();

  async convertPlugin(
    pluginDir: string, 
    outputDir: string, 
    dryRun: boolean = false
  ): Promise<{
    converted: number;
    failed: number;
    errors: string[];
    warnings: string[];
  }> {
    const result = {
      converted: 0,
      failed: 0,
      errors: [] as string[],
      warnings: [] as string[]
    };

    try {
      const pluginName = path.basename(pluginDir);
      console.log(`🔄 Converting plugin: ${pluginName}`);

      // Read the SKILL.md file
      const skillFile = path.join(pluginDir, 'SKILL.md');
      let skillContent: string;

      try {
        skillContent = await readFile(skillFile);
      } catch (error) {
        result.failed++;
        result.errors.push(`${path.basename(pluginDir)}: SKILL.md not found`);
        return result;
      }

      // Parse the skill
      const anthropicSkill = await this.parseSkill(skillContent);
      
      // Convert to OpenCode format
      const openCodePlugin = await this.convertToOpenCode(pluginName, anthropicSkill, pluginDir);
      
      // Create output directory
      const pluginOutputDir = path.join(outputDir, pluginName);
      if (!dryRun) {
        await ensureDir(pluginOutputDir);
      }

      // Write package.json
      const packageJsonPath = path.join(pluginOutputDir, 'package.json');
      if (!dryRun) {
        await writeFile(packageJsonPath, JSON.stringify(openCodePlugin, null, 2));
      }

      // Write main plugin file
      const mainFilePath = path.join(pluginOutputDir, openCodePlugin.main);
      if (!dryRun) {
        await writeFile(mainFilePath, this.generateMainPluginContent(openCodePlugin));
      }

      // Write README
      const readmePath = path.join(pluginOutputDir, 'README.md');
      if (!dryRun) {
        await writeFile(readmePath, this.generateReadme(openCodePlugin));
      }

      // Copy additional files
      await this.copyAdditionalFiles(pluginDir, pluginOutputDir, openCodePlugin, dryRun);

      result.converted++;
      console.log(`✅ Converted: ${pluginName}`);
      
      // Store for reference
      this.convertedPlugins.set(pluginName, openCodePlugin);

    } catch (error) {
      result.failed++;
      result.errors.push(`${path.basename(pluginDir)}: ${error}`);
      console.error(`❌ Failed: ${path.basename(pluginDir)} - ${error}`);
    }

    return result;
  }

  async convertMultiplePlugins(
    plugins: string[],
    baseInputDir: string,
    outputDir: string,
    dryRun: boolean = false
  ): Promise<{
    converted: number;
    failed: number;
    errors: string[];
    warnings: string[];
  }> {
    const totalResult = {
      converted: 0,
      failed: 0,
      errors: [] as string[],
      warnings: [] as string[]
    };

    for (const plugin of plugins) {
      const pluginDir = path.join(baseInputDir, plugin);
      const result = await this.convertPlugin(pluginDir, outputDir, dryRun);
      
      totalResult.converted += result.converted;
      totalResult.failed += result.failed;
      totalResult.errors.push(...result.errors);
      totalResult.warnings.push(...result.warnings);
    }

    return totalResult;
  }

  private async parseSkill(content: string): Promise<AnthropicSkill> {
    const { frontmatter, body } = parseMarkdownFrontmatter(content);
    
    return {
      name: frontmatter.name || 'unknown',
      description: frontmatter.description || '',
      license: frontmatter.license,
      prompt: body.trim()
    };
  }

  private async convertToOpenCode(
    pluginName: string, 
    skill: AnthropicSkill,
    pluginDir: string
  ): Promise<OpenCodePlugin> {
    // Detect plugin type based on content and directory structure
    const pluginType = this.detectPluginType(skill, pluginDir);
    
    const openCodePlugin: OpenCodePlugin = {
      name: pluginName,
      version: '1.0.0',
      description: skill.description,
      main: 'index.js',
      type: pluginType,
      opencode: {
        category: this.inferCategory(skill, pluginDir),
        tags: this.extractTags(skill),
        author: 'Anthropic',
        repository: 'https://github.com/anthropics/anthropic-agent-skills'
      },
      files: {}
    };

    // Add additional files from plugin directory
    await this.scanAdditionalFiles(pluginDir, openCodePlugin);

    return openCodePlugin;
  }

  private detectPluginType(skill: AnthropicSkill, pluginDir: string): 'skill' | 'agent' | 'command' {
    // Analyze content to determine type
    const prompt = skill.prompt.toLowerCase();
    const name = skill.name.toLowerCase();

    // Agent indicators
    if (prompt.includes('agent') || prompt.includes('subagent') || 
        prompt.includes('mode:') || prompt.includes('tools:') ||
        name.includes('-agent') || name.includes('sdk')) {
      return 'agent';
    }

    // Command indicators  
    if (prompt.includes('command') || prompt.includes('execute') ||
        prompt.includes('run') || name.includes('-dev')) {
      return 'command';
    }

    // Default to skill
    return 'skill';
  }

  private inferCategory(skill: AnthropicSkill, pluginDir: string): string {
    const name = skill.name.toLowerCase();
    const description = skill.description.toLowerCase();

    if (name.includes('security') || description.includes('security')) return 'security';
    if (name.includes('frontend') || description.includes('frontend')) return 'frontend';
    if (name.includes('dev') || description.includes('development')) return 'development';
    if (name.includes('mcp') || description.includes('mcp')) return 'mcp';
    if (name.includes('art') || description.includes('art')) return 'art';
    if (name.includes('brand') || description.includes('brand')) return 'branding';
    
    return 'general';
  }

  private extractTags(skill: AnthropicSkill): string[] {
    const tags: string[] = [];
    const text = (skill.name + ' ' + skill.description).toLowerCase();

    if (text.includes('algorithmic')) tags.push('algorithmic', 'generative');
    if (text.includes('brand')) tags.push('branding', 'design');
    if (text.includes('security')) tags.push('security', 'scanning');
    if (text.includes('frontend')) tags.push('frontend', 'ui');
    if (text.includes('mcp')) tags.push('mcp', 'server');
    if (text.includes('development')) tags.push('development', 'workflow');
    if (text.includes('art')) tags.push('art', 'creative');
    if (text.includes('theme')) tags.push('theme', 'styling');

    return tags.length > 0 ? tags : ['utility'];
  }

  private async scanAdditionalFiles(pluginDir: string, plugin: OpenCodePlugin): Promise<void> {
    try {
      const files = await readAllFiles('**/*', pluginDir);
      
      for (const file of files) {
        if (file === 'SKILL.md') continue; // Skip main skill file
        
        const filePath = path.join(pluginDir, file);
        try {
          const content = await readFile(filePath);
          plugin.files[file] = content;
        } catch (error) {
          // Skip files that can't be read
          console.warn(`Warning: Could not read file ${file}`);
        }
      }
    } catch (error) {
      // If we can't scan files, that's okay
      console.warn(`Warning: Could not scan additional files in ${pluginDir}`);
    }
  }

  private generateMainPluginContent(plugin: OpenCodePlugin): string {
    const hasFiles = Object.keys(plugin.files).length > 0;
    
    return `// OpenCode Plugin: ${plugin.name}
// Converted from Anthropic Agent Skill
// Version: ${plugin.version}

${plugin.type === 'agent' ? `
// Agent Configuration
const agentConfig = {
  name: "${plugin.name}",
  description: "${plugin.description}",
  mode: "subagent",
  tools: ${hasFiles ? '{ file_operations: true }' : '{}'}
};
` : plugin.type === 'command' ? `
// Command Configuration  
const commandConfig = {
  name: "${plugin.name}",
  description: "${plugin.description}",
  template: "default"
};
` : `
// Skill Configuration
const skillConfig = {
  name: "${plugin.name}",
  description: "${plugin.description}",
  noReply: false
};
`}

// Main plugin logic
module.exports = {
  name: "${plugin.name}",
  version: "${plugin.version}",
  description: "${plugin.description}",
  type: "${plugin.type}",
  
  ${plugin.type === 'agent' ? 'agentConfig' : plugin.type === 'command' ? 'commandConfig' : 'skillConfig'},
  
  // Plugin initialization
  async initialize() {
    console.log(\`Initialized \${this.name} plugin\`);
  },
  
  // Main execution
  async execute(input) {
    // Plugin execution logic here
    return {
      success: true,
      result: "Plugin executed successfully"
    };
  }
};
`;
  }

  private generateReadme(plugin: OpenCodePlugin): string {
    const hasFiles = Object.keys(plugin.files).length > 0;
    
    return `# ${plugin.name}

${plugin.description}

## Overview

This OpenCode plugin was converted from an Anthropic Agent Skill. It provides ${plugin.type} functionality for the OpenCode ecosystem.

## Installation

\`\`\`bash
npm install ${plugin.name}
\`\`\`

## Usage

\`\`\`javascript
const ${plugin.name} = require('${plugin.name}');

// Initialize plugin
await ${plugin.name}.initialize();

// Execute plugin
const result = await ${plugin.name}.execute(input);
\`\`\`

## Configuration

${plugin.type === 'agent' ? `
### Agent Configuration

- **Name**: ${plugin.name}
- **Description**: ${plugin.description}
- **Mode**: subagent
- **Tools**: ${hasFiles ? 'File operations enabled' : 'Standard tools'}
` : plugin.type === 'command' ? `
### Command Configuration

- **Name**: ${plugin.name}
- **Description**: ${plugin.description}
- **Template**: Default
` : `
### Skill Configuration

- **Name**: ${plugin.name}
- **Description**: ${plugin.description}
- **No Reply**: false
`}

## Files

${hasFiles ? 
`This plugin includes the following additional files:
${Object.keys(plugin.files).map(file => \`- \`${file}\`\`).join('\\n')}
` : 
'This is a standalone plugin with no additional files.'}

## Category

${plugin.opencode?.category || 'General'}

## Tags

${plugin.opencode?.tags?.join(', ') || 'utility'}

## Author

${plugin.opencode?.author || 'Unknown'}

## Repository

${plugin.opencode?.repository || 'Unknown'}

## License

This plugin was converted from an Anthropic Agent Skill. Please refer to the original license terms.

## Conversion Details

- **Source**: Anthropic Agent Skills
- **Target**: OpenCode Plugin Format
- **Version**: ${plugin.version}
- **Type**: ${plugin.type}
- **Converted**: ${new Date().toISOString()}
`;
  }
}