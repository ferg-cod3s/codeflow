import * as path from 'path';
import { BaseSkill, OpenCodeSkill } from '../types/index';
import { readFile, writeFile, readAllFiles } from '../utils/file-utils';
import { parseMarkdownFrontmatter, stringifyMarkdownFrontmatter } from '../utils/yaml-utils';

export class SkillConverter {
  async convertSkills(inputDir: string, outputDir: string, dryRun: boolean = false): Promise<{
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

    const skillFiles = await readAllFiles('**/*.md', inputDir);
    
    for (const file of skillFiles) {
      try {
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, file);
        
        const content = await readFile(inputPath);
        const converted = await this.convertSingleSkill(content);
        
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

  private async convertSingleSkill(content: string): Promise<string> {
    const { frontmatter, body } = parseMarkdownFrontmatter(content);
    
    // Map base skill fields to OpenCode format
    const openCodeSkill: OpenCodeSkill = {
      name: frontmatter.name,
      description: frontmatter.description,
      noReply: frontmatter.noReply,
      prompt: body.trim()
    };

    // Filter out undefined values
    const cleanSkill = Object.fromEntries(
      Object.entries(openCodeSkill).filter(([_, value]) => value !== undefined)
    );

    return stringifyMarkdownFrontmatter(cleanSkill, body);
  }
}