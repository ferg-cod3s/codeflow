// OpenCode format types
export interface OpenCodeAgent {
  name: string;
  description: string;
  mode?: 'primary' | 'subagent' | 'all';
  model?: string;
  temperature?: number;
  tools?: Record<string, boolean>;
  permission?: Record<string, string | boolean>;
  prompt?: string;
}

export interface OpenCodeCommand {
  name: string;
  description: string;
  template: string;
  agent?: string;
  model?: string;
  subtask?: boolean;
}

export interface OpenCodeSkill {
  name: string;
  description: string;
  noReply?: boolean;
  prompt?: string;
}

export interface ConversionOptions {
  source: 'base-agents' | 'commands' | 'skills';
  target: 'opencode';
  output: string;
  validation: 'strict' | 'lenient' | 'off';
  mapping: 'default' | 'custom';
  dryRun: boolean;
}

export interface ConversionResult {
  success: boolean;
  converted: number;
  failed: number;
  warnings: string[];
  errors: string[];
  output: string;
}

export interface ValidationReport {
  file: string;
  format: 'opencode-agent' | 'opencode-command' | 'opencode-skill';
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
}