/**
 * Prompt Optimization System for CodeFlow
 * 
 * Analyzes and optimizes existing prompts for efficiency, clarity, and effectiveness
 * Focuses on practical improvements rather than theoretical enhancements
 */

import fs from 'fs-extra';
import * as path from 'path';
import { ensureDir } from '../utils/file-utils.js';
import { parseMarkdownFrontmatter, stringifyMarkdownFrontmatter } from '../utils/yaml-utils.js';

export interface PromptOptimizationOptions {
  preserveStructure?: boolean;
  focusArea?: 'clarity' | 'efficiency' | 'completeness' | 'conciseness';
  aggressiveness?: 'conservative' | 'moderate' | 'aggressive';
  targetLength?: number; // Target prompt length in characters
}

export interface PromptAnalysis {
  currentLength: number;
  readabilityScore: number; // 0-100
  structureScore: number; // 0-100
  clarityScore: number; // 0-100
  efficiencyScore: number; // 0-100
  issues: PromptIssue[];
  recommendations: string[];
}

export interface PromptIssue {
  type: 'redundancy' | 'vagueness' | 'inconsistency' | 'inefficiency' | 'missing_context' | 'poor_structure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  line?: number;
  description: string;
  suggestion?: string;
}

export class PromptOptimizer {
  private options: Required<PromptOptimizationOptions>;

  constructor(options: PromptOptimizationOptions = {}) {
    this.options = {
      preserveStructure: true,
      focusArea: 'efficiency',
      aggressiveness: 'moderate',
      targetLength: 2000,
      ...options
    };
  }

  /**
   * Analyze a single prompt file for optimization opportunities
   */
  async analyzePrompt(filePath: string): Promise<PromptAnalysis> {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, body } = parseMarkdownFrontmatter(content);

    const analysis: PromptAnalysis = {
      currentLength: content.length,
      readabilityScore: this.calculateReadabilityScore(content),
      structureScore: this.calculateStructureScore(frontmatter, body),
      clarityScore: this.calculateClarityScore(content),
      efficiencyScore: this.calculateEfficiencyScore(content),
      issues: this.identifyIssues(content),
      recommendations: []
    };

    // Generate recommendations based on analysis
    analysis.recommendations = this.generateRecommendations(analysis);

    return analysis;
  }

  /**
   * Optimize a single prompt file
   */
  async optimizePrompt(filePath: string, outputPath?: string): Promise<{
    optimized: string;
    analysis: PromptAnalysis;
    improvements: string[];
  }> {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, body } = parseMarkdownFrontmatter(content);
    
    const analysis = await this.analyzePrompt(filePath);
    const optimizedBody = await this.applyOptimizations(content, frontmatter, body, analysis);

    const improvements = this.identifyImprovements(content, optimizedBody);

    if (outputPath) {
      const optimizedContent = stringifyMarkdownFrontmatter(frontmatter, optimizedBody);
      await fs.writeFile(outputPath, optimizedContent);
    }

    return {
      optimized: optimizedBody,
      analysis,
      improvements
    };
  }

  /**
   * Optimize all prompts in a directory
   */
  async optimizeDirectory(inputDir: string, outputDir: string): Promise<{
    totalFiles: number;
    optimizedFiles: number;
    totalImprovements: number;
    results: Array<{
      file: string;
      analysis: PromptAnalysis;
      improvements: string[];
    }>;
  }> {
    // Recursively find all markdown files
    const { readAllFiles } = await import('../utils/file-utils.js');
    const files = await readAllFiles('**/*.md', inputDir);
    const markdownFiles = files;

    let totalFiles = markdownFiles.length;
    let optimizedFiles = 0;
    let totalImprovements = 0;
    const results = [];

    for (const file of markdownFiles) {
      const inputPath = path.join(inputDir, file); // Convert relative to full path
      const outputPath = path.join(outputDir, file);

      // Ensure output directory exists
      const outputDirPath = path.dirname(outputPath);
      await ensureDir(outputDirPath);

      const result = await this.optimizePrompt(inputPath, outputPath);
      
      if (result.improvements.length > 0) {
        optimizedFiles++;
        totalImprovements += result.improvements.length;
      }

      results.push({
        file,
        analysis: result.analysis,
        improvements: result.improvements
      });
    }

    return {
      totalFiles,
      optimizedFiles,
      totalImprovements,
      results
    };
  }

  /**
   * Calculate readability score based on various factors
   */
  private calculateReadabilityScore(content: string): number {
    let score = 100;

    // Penalize very long prompts
    if (content.length > 5000) score -= 20;
    else if (content.length > 3000) score -= 10;

    // Penalize very short prompts
    if (content.length < 200) score -= 15;

    // Reward clear structure
    const hasClearSections = /\n#{1,3}/.test(content);
    if (hasClearSections) score += 10;

    // Penalize excessive jargon without explanation
    const jargonWords = ['synergistic', 'paradigm', 'leverage', 'ecosystem'];
    const jargonCount = jargonWords.reduce((count, word) => 
      count + (content.match(new RegExp(word, 'gi')) || []).length, 0);
    if (jargonCount > 5) score -= jargonCount * 2;

    // Reward concrete examples
    const hasExamples = /```|`[^`]*`/.test(content);
    if (hasExamples) score += 15;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate structure score based on frontmatter and organization
   */
  private calculateStructureScore(frontmatter: any, body: string): number {
    let score = 50; // Base score

    // Check for essential frontmatter fields
    const essentialFields = ['name', 'description', 'mode'];
    const hasEssentialFields = essentialFields.every(field => frontmatter[field]);
    if (hasEssentialFields) score += 20;

    // Check for proper tool configuration
    if (frontmatter.tools && typeof frontmatter.tools === 'object') {
      const toolCount = Object.keys(frontmatter.tools).length;
      if (toolCount > 0 && toolCount <= 10) score += 15;
    }

    // Check for reasonable permissions
    if (frontmatter.permission) {
      score += 10;
    }

    // Penalize missing structure
    if (!body.includes('#') && !body.includes('##')) score -= 10;

    // Reward clear role definition
    const hasRoleDefinition = /you are|act as/i.test(body);
    if (hasRoleDefinition) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate clarity score based on prompt clarity
   */
  private calculateClarityScore(content: string): number {
    let score = 50;

    // Reward specific, actionable instructions
    const specificPatterns = [
      /when X, do Y/gi,
      /if X, then Y/gi,
      /for each X, Y/gi
    ];
    specificPatterns.forEach(pattern => {
      if (pattern.test(content)) score += 10;
    });

    // Penalize vague language
    const vaguePhrases = [
      'as appropriate',
      'as needed',
      'to the extent possible',
      'consider various options',
      'use your judgment'
    ];
    vaguePhrases.forEach(phrase => {
      if (content.toLowerCase().includes(phrase)) score -= 10;
    });

    // Reward clear constraints
    const hasConstraints = /do not|must|should not|avoid|only/gi.test(content);
    if (hasConstraints) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate efficiency score based on prompt conciseness and focus
   */
  private calculateEfficiencyScore(content: string): number {
    let score = 50;

    // Reward conciseness
    const wordsPerChar = content.split(/\s+/).length / content.length;
    if (wordsPerChar > 0.15 && wordsPerChar < 0.25) score += 20;

    // Penalize redundancy
    const sentences = content.split(/[.!?]+/);
    const avgWordsPerSentence = sentences.reduce((total, sentence) => 
      total + sentence.split(/\s+/).length, 0) / sentences.length;
    
    if (avgWordsPerSentence > 25) score -= 15;

    // Reward clear objective
    const hasObjective = /objective|goal|purpose/gi.test(content);
    if (hasObjective) score += 15;

    // Penalize excessive examples without purpose
    const exampleMatches = content.match(/```[\s\S]*?[\s\S]*?```/g) || [];
    if (exampleMatches.length > 3) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Identify specific issues in the prompt
   */
  private identifyIssues(content: string): PromptIssue[] {
    const issues: PromptIssue[] = [];

    // Check for redundancy
    const lines = content.split('\n');
    const seenPhrases = new Set();
    
    lines.forEach((line, index) => {
      const cleanLine = line.toLowerCase().trim();
      
      // Check for duplicate phrases
      if (seenPhrases.has(cleanLine) && cleanLine.length > 10) {
        issues.push({
          type: 'redundancy',
          severity: 'medium',
          line: index + 1,
          description: `Duplicate phrase: "${cleanLine.substring(0, 50)}..."`,
          suggestion: 'Remove redundant phrases or combine similar ideas'
        });
      }
      seenPhrases.add(cleanLine);
    });

    // Check for vagueness
    const vaguePatterns = [
      /etc\.?/,
      /various/,
      /multiple options/,
      /as appropriate/,
      /as needed/
    ];

    vaguePatterns.forEach((pattern) => {
      const regex = new RegExp(pattern, 'gi');
      let match;
      while ((match = regex.exec(content)) !== null) {
        const lineIndex = content.substring(0, match.index).split('\n').length;
        issues.push({
          type: 'vagueness',
          severity: 'high',
          line: lineIndex + 1,
          description: `Vague phrase: "${match[0]}"`,
          suggestion: 'Replace with specific, actionable instructions'
        });
      }
    });

    // Check for inconsistencies
    const hasInconsistentTools = /tools?\s*:\s*(write|edit|bash)/i.test(content);
    if (hasInconsistentTools) {
      issues.push({
        type: 'inconsistency',
        severity: 'medium',
        description: 'Inconsistent tool formatting',
        suggestion: 'Use consistent tool formatting with proper boolean values'
      });
    }

    // Check for poor structure
    const hasPoorStructure = 
      !content.includes('#') || // No headers
      !content.includes('You are') && !content.includes('Act as'); // No role definition

    if (hasPoorStructure) {
      issues.push({
        type: 'poor_structure',
        severity: 'high',
        description: 'Poor prompt structure',
        suggestion: 'Add clear headers and role definition'
      });
    }

    // Check for missing context
    const hasMissingContext = 
      content.includes('user input') && !content.includes('context') ||
      content.includes('file') && !content.includes('directory');

    if (hasMissingContext) {
      issues.push({
        type: 'missing_context',
        severity: 'medium',
        description: 'Missing context for user inputs',
        suggestion: 'Add context handling instructions'
      });
    }

    return issues;
  }

  /**
   * Generate optimization recommendations based on analysis
   */
  private generateRecommendations(analysis: PromptAnalysis): string[] {
    const recommendations: string[] = [];

    if (analysis.readabilityScore < 60) {
      recommendations.push('Improve readability with shorter sentences and clearer language');
    }

    if (analysis.structureScore < 60) {
      recommendations.push('Add clear section headers and better organization');
    }

    if (analysis.clarityScore < 60) {
      recommendations.push('Replace vague instructions with specific, actionable steps');
    }

    if (analysis.efficiencyScore < 60) {
      recommendations.push('Remove redundant content and focus on essential instructions');
    }

    if (analysis.currentLength > this.options.targetLength!) {
      recommendations.push(`Reduce prompt length to under ${this.options.targetLength} characters for better focus`);
    }

    // High-priority recommendations
    const criticalIssues = analysis.issues.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.unshift('Address critical issues first: ' + 
        criticalIssues.map(issue => issue.description).join(', '));
    }

    return recommendations;
  }

  /**
   * Apply specific optimizations to content
   */
  private async applyOptimizations(
    content: string, 
    frontmatter: any, 
    body: string, 
    analysis: PromptAnalysis
  ): Promise<string> {
    let optimizedBody = body;

    // Apply optimizations based on focus area
    switch (this.options.focusArea) {
      case 'clarity':
        optimizedBody = this.improveClarity(body, analysis);
        break;
        
      case 'efficiency':
        optimizedBody = this.improveEfficiency(body, analysis);
        break;
        
      case 'completeness':
        optimizedBody = this.improveCompleteness(body, analysis);
        break;
        
      case 'conciseness':
        optimizedBody = this.improveConciseness(body, analysis);
        break;
    }

    // Apply length optimization if needed
    if (optimizedBody.length > this.options.targetLength!) {
      optimizedBody = this.truncateToTarget(optimizedBody, this.options.targetLength!);
    }

    return optimizedBody;
  }

  /**
   * Improve clarity of instructions
   */
  private improveClarity(content: string, analysis: PromptAnalysis): string {
    let optimized = content;

    // Replace vague phrases with specific alternatives
    const replacements = {
      'as appropriate': 'following these specific guidelines',
      'as needed': 'when these conditions are met',
      'various options': 'these specific options',
      'consider': 'evaluate and choose from',
      'etc.': 'specific examples listed below'
    };

    for (const [vague, specific] of Object.entries(replacements)) {
      const regex = new RegExp(vague, 'gi');
      optimized = optimized.replace(regex, specific);
    }

    // Add specific examples for vague instructions
    if (analysis.clarityScore < 70) {
      optimized = this.addSpecificExamples(optimized);
    }

    return optimized;
  }

  /**
   * Improve efficiency by removing redundancy
   */
  private improveEfficiency(content: string, analysis: PromptAnalysis): string {
    let optimized = content;

    // Remove duplicate lines
    const lines = optimized.split('\n');
    const seenLines = new Set();
    const uniqueLines = lines.filter(line => {
      const trimmed = line.trim();
      if (seenLines.has(trimmed) && trimmed.length > 5) {
        return false; // Skip duplicates
      }
      seenLines.add(trimmed);
      return true;
    });
    optimized = uniqueLines.join('\n');

    // Skip problematic optimizations for now
    // optimized = this.combineRelatedInstructions(optimized);
    // optimized = this.removeExcessiveExamples(optimized);

    return optimized;
  }

  /**
   * Improve completeness by adding missing elements
   */
  private improveCompleteness(content: string, analysis: PromptAnalysis): string {
    let optimized = content;

    // Add missing role definition if needed
    if (!/you are|act as/i.test(optimized)) {
      optimized = `You are an expert specialist.\n\n${optimized}`;
    }

    // Add clear objective if missing
    if (!/objective|goal|purpose/gi.test(optimized)) {
      optimized = `## Objective\n\n${optimized}`;
    }

    // Add constraints section if missing
    if (!/do not|must|should not|avoid|only/gi.test(optimized)) {
      optimized = `${optimized}\n\n## Constraints\n\n- Follow established patterns\n- Maintain security best practices\n- Ensure compatibility`;
    }

    return optimized;
  }

  /**
   * Improve conciseness by removing wordiness
   */
  private improveConciseness(content: string, analysis: PromptAnalysis): string {
    let optimized = content;

    // Remove filler words and phrases
    const fillerPatterns = [
      /\basically\s+/gi,
      /\in fact\s+/gi,
      /\as you can see\s+/gi,
      /\it is important to note\s+/gi,
      /\for the most part\s+/gi
    ];

    fillerPatterns.forEach(pattern => {
      optimized = optimized.replace(pattern, '');
    });

    // Clean up extra whitespace
    optimized = optimized.replace(/\n\s*\n\s*\n/g, '\n\n');
    optimized = optimized.replace(/[ \t]+/g, ' ');

    return optimized;
  }

  /**
   * Add specific examples to vague instructions
   */
  private addSpecificExamples(content: string): string {
    // Find vague instructions and add concrete examples
    const vagueInstructionRegex = /(when|if|for each)\s+([^.]*)(?=\s*[^.\n]*)/gi;
    
    return content.replace(vagueInstructionRegex, (match, p1, instruction, p2) => {
      if (p2) {
        return `${p1}${instruction}\n\nExample:\n\`\`\`\n${this.generateExampleForInstruction(instruction)}\n\`\`\`\n${p2}`;
      }
      return `${p1}${instruction}\n\nExample:\n\`\`\`\n${this.generateExampleForInstruction(instruction)}\n\`\`\``;
    });
  }

  /**
   * Generate appropriate example for a given instruction
   */
  private generateExampleForInstruction(instruction: string): string {
    const lowerInstruction = instruction.toLowerCase();
    
    if (lowerInstruction.includes('validate')) {
      return `if (input meets criteria):\n  return true\nelse:\n  return false\nwith error message`;
    }
    
    if (lowerInstruction.includes('process')) {
      return `input_data = "example input"\nprocessed_data = process_input(input_data)`;
    }
    
    if (lowerInstruction.includes('analyze')) {
      return `results = analyze_data(data)\nsummary = generate_summary(results)`;
    }
    
    return `// Example implementation for: ${instruction}`;
  }

  /**
   * Combine related instructions to reduce redundancy
   */
  private combineRelatedInstructions(content: string): string {
    const lines = content.split('\n');
    const combinedLines: string[] = [];
    let i = 0;

    while (i < lines.length) {
      const currentLine = lines[i].trim();
      
      // Look for related instructions in next few lines
      let relatedLines = [currentLine];
      let j = i + 1;
      
      while (j < lines.length && j < i + 3) { // Look ahead up to 3 lines
        const nextLine = lines[j].trim();
        
        // Check if lines are related (similar structure or topic)
        if (this.areInstructionsRelated(currentLine, nextLine)) {
          relatedLines.push(nextLine);
          i = j; // Skip the related line
        } else {
          break;
        }
        j++;
      }
      
      // Combine related lines
      if (relatedLines.length > 1) {
        const combined = currentLine; // For now, just keep the original line to avoid corruption
        combinedLines.push(combined);
        i += relatedLines.length;
      } else {
        combinedLines.push(currentLine);
        i++;
      }
    }

    return combinedLines.join('\n');
  }

  /**
   * Check if two instructions are related
   */
  private areInstructionsRelated(line1: string, line2: string): boolean {
    // Check for similar structure patterns
    const patterns = [
      /^when\s+/i, // Both start with "when"
      /^if\s+/i,
      /^for\s+/i,
      /^ensure\s+/i
    ];

    return patterns.some(pattern => 
      pattern.test(line1) && pattern.test(line2)
    ) || 
      // Check for similar topics
      this.getInstructionTopic(line1) === this.getInstructionTopic(line2);
  }

  /**
   * Extract topic from instruction
   */
  private getInstructionTopic(line: string): string {
    const topicWords = ['validate', 'process', 'analyze', 'create', 'update', 'delete', 'read', 'write'];
    const words = line.toLowerCase().split(/\s+/);
    
    return topicWords.find(word => words.includes(word)) || 'general';
  }

  /**
   * Remove excessive examples
   */
  private removeExcessiveExamples(content: string): string {
    const lines = content.split('\n');
    const cleanedLines: string[] = [];
    let inExampleBlock = false;
    let exampleCount = 0;

    for (const line of lines) {
      if (line.trim().startsWith('```')) {
        inExampleBlock = true;
        exampleCount++;
      } else if (line.trim().endsWith('```')) {
        inExampleBlock = false;
      } else if (inExampleBlock && exampleCount > 2) {
        // Skip excessive examples
        continue;
      }
      
      cleanedLines.push(line);
    }

    return cleanedLines.join('\n');
  }

  /**
   * Truncate content to target length while preserving structure
   */
  private truncateToTarget(content: string, targetLength: number): string {
    if (content.length <= targetLength) {
      return content;
    }

    // Find the last complete sentence before target
    const sentences = content.split(/[.!?]+/);
    let truncated = '';
    let currentLength = 0;

    for (const sentence of sentences) {
      const sentenceWithPunctuation = sentence + (sentence.match(/[.!?]$/) ? '' : '.');
      if (currentLength + sentenceWithPunctuation.length > targetLength) {
        break;
      }
      truncated += sentenceWithPunctuation;
      currentLength += sentenceWithPunctuation.length;
    }

    return truncated;
  }

  /**
   * Identify specific improvements made during optimization
   */
  private identifyImprovements(original: string, optimized: string): string[] {
    const improvements: string[] = [];

    // Check for length reduction
    const lengthReduction = original.length - optimized.length;
    if (lengthReduction > 100) {
      improvements.push(`Reduced length by ${lengthReduction} characters`);
    }

    // Check for clarity improvements
    const vaguePhrases = ['as appropriate', 'as needed', 'various options'];
    vaguePhrases.forEach(phrase => {
      const originalCount = (original.match(new RegExp(phrase, 'gi')) || []).length;
      const optimizedCount = (optimized.match(new RegExp(phrase, 'gi')) || []).length;
      if (optimizedCount < originalCount) {
        improvements.push(`Removed ${originalCount - optimizedCount} instances of vague phrase "${phrase}"`);
      }
    });

    // Check for structure improvements
    const originalHeaders = (original.match(/^#+/gm) || []).length;
    const optimizedHeaders = (optimized.match(/^#+/gm) || []).length;
    if (optimizedHeaders > originalHeaders) {
      improvements.push(`Added ${optimizedHeaders - originalHeaders} section headers for better structure`);
    }

    // Check for redundancy removal
    const originalLines = original.split('\n');
    const optimizedLines = optimized.split('\n');
    if (optimizedLines.length < originalLines.length) {
      improvements.push(`Removed ${originalLines.length - optimizedLines.length} redundant lines`);
    }

    // Check for example additions
    const originalExamples = (original.match(/```/g) || []).length / 2;
    const optimizedExamples = (optimized.match(/```/g) || []).length / 2;
    if (optimizedExamples > originalExamples) {
      improvements.push(`Added ${optimizedExamples - originalExamples} concrete examples`);
    }

    return improvements;
  }
}