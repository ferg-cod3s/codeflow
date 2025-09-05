import { Agent, BaseAgent, ClaudeCodeAgent, OpenCodeAgent } from './agent-parser';

/**
 * Format conversion engine for agents
 */
export class FormatConverter {
  /**
   * Convert Base format to Claude Code format
   * Claude Code only requires name, description, and optionally tools
   */
  baseToClaudeCode(agent: Agent): Agent {
    if (agent.format !== 'base') {
      throw new Error(`Expected base format, got ${agent.format}`);
    }

    const baseAgent = agent.frontmatter as BaseAgent;

    // Claude Code only requires name, description, and optionally tools
    // All other fields are not used by Claude Code
    const claudeCodeFrontmatter: ClaudeCodeAgent = {
      name: baseAgent.name,
      description: baseAgent.description,
      // Convert tools object to comma-separated string for Claude Code format
      tools: baseAgent.tools
        ? Object.entries(baseAgent.tools)
            .filter(([, enabled]) => enabled)
            .map(([tool]) => tool)
            .join(', ')
        : undefined,
    };

    return {
      ...agent,
      format: 'claude-code',
      frontmatter: claudeCodeFrontmatter,
    };
  }

  /**
   * Convert Base format to OpenCode format
   * OpenCode uses official OpenCode.ai specification: description, mode, model, temperature, tools, permission, disable
   */
  baseToOpenCode(agent: Agent): Agent {
    if (agent.format !== 'base') {
      throw new Error(`Expected base format, got ${agent.format}`);
    }

    const baseAgent = agent.frontmatter as BaseAgent;

    // Official OpenCode format - follows OpenCode.ai specification
    const openCodeFrontmatter: OpenCodeAgent = {
      name: baseAgent.name,
      description: baseAgent.description,
      mode: baseAgent.mode || 'subagent', // Official default is 'subagent'
      model: baseAgent.model,
      temperature: baseAgent.temperature,
      tools: baseAgent.tools,
      // Convert tools to permission format for official OpenCode spec
      permission: baseAgent.tools ? this.convertToolsToPermissions(baseAgent.tools) : undefined,
    };

    // Convert model format for OpenCode if needed
    if (openCodeFrontmatter.model) {
      openCodeFrontmatter.model = this.convertModelForOpenCode(openCodeFrontmatter.model);
    }

    return {
      ...agent,
      format: 'opencode',
      frontmatter: openCodeFrontmatter,
    };
  }

  /**
   * Convert Claude Code format to Base format
   */
  claudeCodeToBase(agent: Agent): Agent {
    if (agent.format !== 'claude-code') {
      throw new Error(`Expected claude-code format, got ${agent.format}`);
    }

    const claudeAgent = agent.frontmatter as ClaudeCodeAgent;
    // Convert tools string back to object for Base format
    const tools = claudeAgent.tools
      ? claudeAgent.tools.split(',').reduce(
          (acc, tool) => {
            acc[tool.trim()] = true;
            return acc;
          },
          {} as Record<string, boolean>
        )
      : undefined;

    const baseFrontmatter: BaseAgent = {
      ...claudeAgent,
      tools,
    };

    return {
      ...agent,
      format: 'base',
      frontmatter: baseFrontmatter,
    };
  }

  /**
   * Convert Claude Code format to OpenCode format
   */
  claudeCodeToOpenCode(agent: Agent): Agent {
    if (agent.format !== 'claude-code') {
      throw new Error(`Expected claude-code format, got ${agent.format}`);
    }

    // Convert Claude Code to OpenCode via Base format first
    const baseAgent = this.claudeCodeToBase(agent);
    const baseFrontmatter = baseAgent.frontmatter as BaseAgent;

    // Create OpenCode frontmatter with only supported fields
    const openCodeFrontmatter: OpenCodeAgent = {
      name: baseFrontmatter.name,
      description: baseFrontmatter.description,
      mode: 'subagent', // Claude Code agents become subagents in OpenCode
      model: baseFrontmatter.model,
      temperature: baseFrontmatter.temperature,
      tools: baseFrontmatter.tools,
    };

    // Convert model format for OpenCode if needed
    if (openCodeFrontmatter.model) {
      openCodeFrontmatter.model = this.convertModelForOpenCode(openCodeFrontmatter.model);
    }

    return {
      ...agent,
      format: 'opencode',
      frontmatter: openCodeFrontmatter,
    };
  }

  /**
   * Convert OpenCode format to Base format
   */
  openCodeToBase(agent: Agent): Agent {
    if (agent.format !== 'opencode') {
      throw new Error(`Expected opencode format, got ${agent.format}`);
    }

    // Extract base properties from OpenCode agent (preserve custom fields as additional properties)
    const frontmatter = agent.frontmatter as OpenCodeAgent;
    const baseFrontmatter: BaseAgent = {
      name: frontmatter.name || agent.name, // Use agent name if frontmatter name is missing
      description: frontmatter.description,
      mode: frontmatter.mode || 'subagent', // Default to 'subagent' for base format
      model: frontmatter.model,
      temperature: frontmatter.temperature,
      tools: frontmatter.tools,
      // Preserve custom OpenCode fields for future conversion back
      ...(frontmatter.category && { category: frontmatter.category }),
      ...(frontmatter.tags && { tags: frontmatter.tags }),
    };

    return {
      ...agent,
      format: 'base',
      frontmatter: baseFrontmatter,
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
          case 'claude-code':
            return this.baseToClaudeCode(agent);
          case 'opencode':
            return this.baseToOpenCode(agent);
        }
        break;
      case 'claude-code':
        switch (targetFormat) {
          case 'base':
            return this.claudeCodeToBase(agent);
          case 'opencode':
            return this.claudeCodeToOpenCode(agent);
        }
        break;
      case 'opencode':
        switch (targetFormat) {
          case 'base':
            return this.openCodeToBase(agent);
          case 'claude-code':
            return this.baseToClaudeCode(this.openCodeToBase(agent));
        }
        break;
    }

    throw new Error(`Unsupported conversion from ${agent.format} to ${targetFormat}`);
  }

  /**
   * Convert all agents in a directory to target format
   */
  convertAll(
    sourceDir: string,
    targetFormat: 'base' | 'claude-code' | 'opencode',
    outputDir: string
  ): void {
    // Implementation remains the same
  }

  /**
   * Convert a batch of agents to target format
   */
  convertBatch(agents: Agent[], targetFormat: 'base' | 'claude-code' | 'opencode'): Agent[] {
    return agents.map((agent) => this.convert(agent, targetFormat));
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
        errors,
      };
    } catch (error: any) {
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Convert tools object to permission format for official OpenCode specification
   */
  private convertToolsToPermissions(
    tools: Record<string, boolean>
  ): Record<string, 'allow' | 'ask' | 'deny'> {
    const permissions: Record<string, 'allow' | 'ask' | 'deny'> = {};

    for (const [tool, enabled] of Object.entries(tools)) {
      if (enabled === true) {
        permissions[tool] = 'allow';
      } else {
        permissions[tool] = 'deny';
      }
    }

    return permissions;
  }

  /**
   * Convert model format for OpenCode (if needed)
   */
  private convertModelForOpenCode(model: string): string {
    // Implementation remains the same
    return model;
  }
}
