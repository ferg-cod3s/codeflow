import * as path from 'path';
import { BaseCommand, OpenCodeCommand } from '../types/index.js';
import { readFile, writeFile, readAllFiles } from '../utils/file-utils.js';
import { parseMarkdownFrontmatter, stringifyMarkdownFrontmatter } from '../utils/yaml-utils.js';

export class CommandConverter {
  async convertCommands(inputDir: string, outputDir: string, dryRun: boolean = false): Promise<{
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

    const commandFiles = await readAllFiles('**/*.md', inputDir);
    
    for (const file of commandFiles) {
      try {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file);
        
        const content = await readFile(inputPath);
        const converted = await this.convertSingleCommand(content);
        
        if (!dryRun) {
          await writeFile(outputPath, converted);
        }
        
        result.converted++;
        console.log(`✅ Converted: ${file}`);
      } catch (error) {
        result.failed++;
        result.errors.push(`${file}: ${error}`);
        console.error(`❌ Failed: ${file} - ${error}`);
      }
    }
    
    return result;
  }

  private async convertSingleCommand(content: string): Promise<string> {
    const { frontmatter, body } = parseMarkdownFrontmatter(content);
    
    // Map base command fields to OpenCode format
    const openCodeCommand: OpenCodeCommand = {
      name: frontmatter.name,
      description: frontmatter.description,
      template: body.trim(),
      agent: frontmatter.agent,
      model: frontmatter.model,
      subtask: frontmatter.subtask
    };

    // Filter out undefined values
    const cleanCommand = Object.fromEntries(
      Object.entries(openCodeCommand).filter(([_, value]) => value !== undefined)
    );

    return stringifyMarkdownFrontmatter(cleanCommand, body);
  }
}