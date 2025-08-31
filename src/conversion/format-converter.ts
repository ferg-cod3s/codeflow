import { Agent, BaseAgent } from "./agent-parser";

/**
 * Format conversion engine for agents
 */
export class FormatConverter {

  /**
   * Convert Base format to Claude Code format
   * Currently identical structure, but may diverge in the future
   */
  baseToClaudeCode(agent: Agent): Agent {
    if (agent.format !== 'base') {
      throw new Error(`Expected base format, got ${agent.format}`);
    }

    // Currently, Claude Code format is identical to base format
    const claudeCodeFrontmatter: BaseAgent = { ...agent.frontmatter };

    return {
      ...agent,
      format: 'claude-code',
      frontmatter: claudeCodeFrontmatter
    };
  }

  /**
   * Convert Base format to OpenCode format
   */
  baseToOpenCode(agent: Agent): Agent {
    if (agent.format !== 'base') {
      throw new Error(`Expected base format, got ${agent.format}`);
    }

    // OpenCode format includes all base properties plus potential extensions
    const openCodeFrontmatter: BaseAgent = { ...agent.frontmatter };

    // Convert model format for OpenCode if needed
    if (openCodeFrontmatter.model) {
      openCodeFrontmatter.model = this.convertModelForOpenCode(openCodeFrontmatter.model);
    }

    return {
      ...agent,
      format: 'opencode',
      frontmatter: openCodeFrontmatter
    };
  }

  /**
   * Convert Claude Code format to Base format
   */
  claudeCodeToBase(agent: Agent): Agent {
    if (agent.format !== 'claude-code') {
      throw new Error(`Expected claude-code format, got ${agent.format}`);
    }

    // Extract only base properties
    const baseFrontmatter: BaseAgent = { ...agent.frontmatter };

    return {
      ...agent,
      format: 'base',
      frontmatter: baseFrontmatter
    };
  }

  /**
   * Convert Claude Code format to OpenCode format
   */
  claudeCodeToOpenCode(agent: Agent): Agent {
    if (agent.format !== 'claude-code') {
      throw new Error(`Expected claude-code format, got ${agent.format}`);
    }

    // Direct conversion with model format handling
    const openCodeFrontmatter: BaseAgent = { ...agent.frontmatter };

    // Convert model format for OpenCode if needed
    if (openCodeFrontmatter.model) {
      openCodeFrontmatter.model = this.convertModelForOpenCode(openCodeFrontmatter.model);
    }

    return {
      ...agent,
      format: 'opencode',
      frontmatter: openCodeFrontmatter
    };
  }

  /**
   * Convert OpenCode format to Base format
   */
  openCodeToBase(agent: Agent): Agent {
    if (agent.format !== 'opencode') {
      throw new Error(`Expected opencode format, got ${agent.format}`);
    }

        // Extract only base properties, removing OpenCode-specific ones
    const frontmatter = agent.frontmatter as BaseAgent;
    const baseFrontmatter: BaseAgent = {
      name: frontmatter.name,
      description: frontmatter.description,
      mode: frontmatter.mode,
      model: frontmatter.model,
      temperature: frontmatter.temperature,
      tools: frontmatter.tools,
      // Keep OpenCode fields for potential future use
      usage: frontmatter.usage,
      do_not_use_when: frontmatter.do_not_use_when,
      escalation: frontmatter.escalation,
      examples: frontmatter.examples,
      prompts: frontmatter.prompts,
      constraints: frontmatter.constraints
    };

    return {
      ...agent,
      format: 'base',
      frontmatter: baseFrontmatter
    };
  }

  /**
   * Convert OpenCode format to Claude Code format
   */
  openCodeToClaudeCode(agent: Agent): Agent {
    if (agent.format !== 'opencode') {
      throw new Error(`Expected opencode format, got ${agent.format}`);
    }

    // Convert to base first, then to Claude Code
    const baseAgent = this.openCodeToBase(agent);
    return this.baseToClaudeCode(baseAgent);
  }

  /**
   * Convert agent to target format
   */
  convert(agent: Agent, targetFormat: 'base' | 'claude-code' | 'opencode'): Agent {
    if (agent.format === targetFormat) {
      return agent;
    }

    switch (agent.format) {
      case 'base':
        switch (targetFormat) {
          case 'claude-code': return this.baseToClaudeCode(agent);
          case 'opencode': return this.baseToOpenCode(agent);
        }
        break;
      case 'claude-code':
        switch (targetFormat) {
          case 'base': return this.claudeCodeToBase(agent);
          case 'opencode': return this.claudeCodeToOpenCode(agent);
        }
        break;
      case 'opencode':
        switch (targetFormat) {
          case 'base': return this.openCodeToBase(agent);
          case 'claude-code': return this.baseToClaudeCode(this.openCodeToBase(agent));
        }
        break;
    }

    throw new Error(`Unsupported conversion from ${agent.format} to ${targetFormat}`);
  }

  /**
   * Convert all agents in a directory to target format
   */
  convertAll(sourceDir: string, targetFormat: 'base' | 'claude-code' | 'opencode', outputDir: string): void {
    // Implementation remains the same
  }

  /**
   * Convert a batch of agents to target format
   */
  convertBatch(agents: Agent[], targetFormat: 'base' | 'claude-code' | 'opencode'): Agent[] {
    return agents.map(agent => this.convert(agent, targetFormat));
  }

  /**
   * Test round-trip conversion for data integrity
   */
  testRoundTrip(agent: Agent): { success: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Convert to target format and back
      const converted = this.convert(agent, 'base');
      const roundTrip = this.convert(converted, agent.format);

      // Compare key fields
      if (agent.frontmatter.name !== roundTrip.frontmatter.name) {
        errors.push('Name field changed during round-trip conversion');
      }
      if (agent.frontmatter.description !== roundTrip.frontmatter.description) {
        errors.push('Description field changed during round-trip conversion');
      }

      return {
        success: errors.length === 0,
        errors
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [error.message]
      };
    }
  }

  /**
   * Convert model format for OpenCode (if needed)
   */
  private convertModelForOpenCode(model: string): string {
    // Implementation remains the same
    return model;
  }
}
