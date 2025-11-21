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

  private async copyAdditionalFiles(pluginDir: string, pluginOutputDir: string, plugin: OpenCodePlugin, dryRun: boolean): Promise<void> {
    // Writes files collected in plugin.files to the output directory, preserving subpaths.
    const fileEntries = Object.entries(plugin.files || {});
    for (const [relativePath, content] of fileEntries) {
      const destPath = path.join(pluginOutputDir, relativePath);
      const destDir = path.dirname(destPath);
      try {
        if (!dryRun) {
          await ensureDir(destDir);
          await writeFile(destPath, content);
        }
      } catch (err) {
        console.warn(`Warning: Could not write file ${destPath}`);
      }
    }
  }

  private generateMainPluginContent(plugin: OpenCodePlugin): string {
    const header = `// OpenCode Plugin: ${plugin.name}\n// Converted from Anthropic Agent Skill\n// Version: ${plugin.version}\n\n`;

    if (plugin.type === 'agent') {
      const cfg = {
        name: plugin.name,
        description: plugin.description,
        opencode: plugin.opencode || {}
      };

      return header + `// Agent Configuration\nconst agentConfig = ${JSON.stringify(cfg, null, 2)};\n\nmodule.exports = { agentConfig };\n`;
    }

    if (plugin.type === 'command') {
      return header + `// Command plugin entry\nmodule.exports = function runCommand(args) {\n  // Implement command logic here\n  console.log('Running command for ${plugin.name}', args);\n};\n`;
    }

    // Default: skill
    return header + 'module.exports = ' + JSON.stringify({ name: plugin.name, description: plugin.description }, null, 2) + ';\n';
  }

  private generateReadme(plugin: OpenCodePlugin): string {
    const lines = [
      `# ${plugin.name}`,
      '',
      plugin.description || '',
      '',
      '## Plugin type',
      '',
      `- ${plugin.type}`
    ];

    if (plugin.opencode) {
      if (plugin.opencode.category) lines.push('', '## Category', '', `- ${plugin.opencode.category}`);
      if (plugin.opencode.tags && plugin.opencode.tags.length) lines.push('', '## Tags', '', plugin.opencode.tags.map(t => `- ${t}`).join('\n'));
      if (plugin.opencode.author) lines.push('', '## Author', '', `- ${plugin.opencode.author}`);
      if (plugin.opencode.repository) lines.push('', '## Repository', '', plugin.opencode.repository);
    }

    return lines.join('\n');
  }
}