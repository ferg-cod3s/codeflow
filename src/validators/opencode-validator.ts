import * as fs from 'fs-extra';
import * as path from 'path';
import { OpenCodeAgent, OpenCodeCommand, OpenCodeSkill, ValidationReport } from '../types/index.js';
import { parseMarkdownFrontmatter } from '../utils/yaml-utils.js';

export class OpenCodeValidator {
  async validateAgent(filePath: string): Promise<ValidationReport> {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, body } = parseMarkdownFrontmatter(content);
    
    const report: ValidationReport = {
      file: filePath,
      format: 'opencode-agent',
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Required fields validation
    if (!frontmatter.name) {
      report.errors.push({
        field: 'name',
        message: 'Name is required',
        severity: 'error'
      });
      report.valid = false;
    }

    if (!frontmatter.description) {
      report.errors.push({
        field: 'description',
        message: 'Description is required',
        severity: 'error'
      });
      report.valid = false;
    }

    // Mode validation
    if (frontmatter.mode && !['primary', 'subagent', 'all'].includes(frontmatter.mode)) {
      report.errors.push({
        field: 'mode',
        message: 'Mode must be one of: primary, subagent, all',
        severity: 'error'
      });
      report.valid = false;
    }

    // Temperature validation
    if (frontmatter.temperature !== undefined) {
      if (typeof frontmatter.temperature !== 'number' || frontmatter.temperature < 0 || frontmatter.temperature > 1) {
        report.errors.push({
          field: 'temperature',
          message: 'Temperature must be a number between 0 and 1',
          severity: 'error'
        });
        report.valid = false;
      }
    }

    // Tools validation
    if (frontmatter.tools && typeof frontmatter.tools !== 'object') {
      report.errors.push({
        field: 'tools',
        message: 'Tools must be an object',
        severity: 'error'
      });
      report.valid = false;
    }

    // Warnings
    if (!body || body.trim().length === 0) {
      report.warnings.push({
        field: 'prompt',
        message: 'Agent prompt/body is empty'
      });
    }

    if (frontmatter.mode === 'primary' && (!frontmatter.tools || Object.keys(frontmatter.tools).length === 0)) {
      report.warnings.push({
        field: 'tools',
        message: 'Primary agents should have tools enabled'
      });
    }

    // Suggestions
    if (frontmatter.mode === 'subagent' && frontmatter.tools && Object.keys(frontmatter.tools).length > 0) {
      report.suggestions.push('Consider limiting tools for subagents to maintain focus');
    }

    return report;
  }

  async validateCommand(filePath: string): Promise<ValidationReport> {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, body } = parseMarkdownFrontmatter(content);
    
    const report: ValidationReport = {
      file: filePath,
      format: 'opencode-command',
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Required fields validation
    if (!frontmatter.name) {
      report.errors.push({
        field: 'name',
        message: 'Name is required',
        severity: 'error'
      });
      report.valid = false;
    }

    if (!frontmatter.description) {
      report.errors.push({
        field: 'description',
        message: 'Description is required',
        severity: 'error'
      });
      report.valid = false;
    }

    // Template validation
    if (!body || body.trim().length === 0) {
      report.errors.push({
        field: 'template',
        message: 'Command template is required',
        severity: 'error'
      });
      report.valid = false;
    }

    // Subtask validation
    if (frontmatter.subtask !== undefined && typeof frontmatter.subtask !== 'boolean') {
      report.errors.push({
        field: 'subtask',
        message: 'Subtask must be a boolean',
        severity: 'error'
      });
      report.valid = false;
    }

    // Warnings
    if (body.includes('$ARGUMENTS') && body.includes('$1')) {
      report.warnings.push({
        field: 'template',
        message: 'Using both $ARGUMENTS and positional parameters may cause confusion'
      });
    }

    return report;
  }

  async validateSkill(filePath: string): Promise<ValidationReport> {
    const content = await fs.readFile(filePath, 'utf-8');
    const { frontmatter, body } = parseMarkdownFrontmatter(content);
    
    const report: ValidationReport = {
      file: filePath,
      format: 'opencode-skill',
      valid: true,
      errors: [],
      warnings: [],
      suggestions: []
    };

    // Required fields validation
    if (!frontmatter.name) {
      report.errors.push({
        field: 'name',
        message: 'Name is required',
        severity: 'error'
      });
      report.valid = false;
    }

    if (!frontmatter.description) {
      report.errors.push({
        field: 'description',
        message: 'Description is required',
        severity: 'error'
      });
      report.valid = false;
    }

    // NoReply validation
    if (frontmatter.noReply !== undefined && typeof frontmatter.noReply !== 'boolean') {
      report.errors.push({
        field: 'noReply',
        message: 'NoReply must be a boolean',
        severity: 'error'
      });
      report.valid = false;
    }

    // Warnings
    if (!body || body.trim().length === 0) {
      report.warnings.push({
        field: 'prompt',
        message: 'Skill prompt/body is empty'
      });
    }

    return report;
  }

  async validateDirectory(dirPath: string, format: 'opencode-agent' | 'opencode-command' | 'opencode-skill'): Promise<ValidationReport[]> {
    const files = await fs.readdir(dirPath);
    const markdownFiles = files.filter(file => file.endsWith('.md'));
    
    const reports: ValidationReport[] = [];
    
    for (const file of markdownFiles) {
      const filePath = path.join(dirPath, file);
      let report: ValidationReport;
      
      switch (format) {
        case 'opencode-agent':
          report = await this.validateAgent(filePath);
          break;
        case 'opencode-command':
          report = await this.validateCommand(filePath);
          break;
        case 'opencode-skill':
          report = await this.validateSkill(filePath);
          break;
      }
      
      reports.push(report);
    }
    
    return reports;
  }
}