// Base format types (current agent format)
export interface BaseAgent {
  name: string;
  description: string;
  mode: 'primary' | 'subagent';
  temperature?: number;
  category?: string;
  tags?: string[];
  primary_objective?: string;
  anti_objectives?: string[];
  intended_followups?: string[];
  allowed_directories?: string[];
  tools?: Record<string, boolean>;
  permission?: Record<string, string | boolean>;
  model?: string;
}

export interface BaseCommand {
  name: string;
  description: string;
  // Add command-specific fields as needed
}

export interface BaseSkill {
  name: string;
  description: string;
  noReply?: boolean;
  // Add skill-specific fields as needed
}

export interface ParsedFrontmatter {
  [key: string]: any;
}