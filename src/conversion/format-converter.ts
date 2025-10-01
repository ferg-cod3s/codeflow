import { Agent, BaseAgent, ClaudeCodeAgent, OpenCodeAgent, Command, BaseCommand, OpenCodeCommand } from './agent-parser';

/**
 * Format conversion engine for agents
 */
export class FormatConverter {
  /**
   * Convert Base format to Claude Code format (v2.x.x specification)
   * Only allowed fields: name, description, tools (string), model (inherit|sonnet|opus|haiku)
   */
  baseToClaudeCode(agent: Agent): Agent {
    if (agent.format !== 'base') {
      throw new Error(`Expected base format, got ${agent.format}`);
    }

    const baseAgent = agent.frontmatter as BaseAgent;

    // Convert tools from object or permission to comma-separated string
    let toolsString: string | undefined;

    if (baseAgent.tools && typeof baseAgent.tools === 'object') {
      // Convert tools object to comma-separated string
      const enabledTools = Object.entries(baseAgent.tools)
        .filter(([, enabled]) => enabled)
        .map(([tool]) => tool);
      toolsString = enabledTools.length > 0 ? enabledTools.join(', ') : undefined;
    } else if ((baseAgent as any).permission && typeof (baseAgent as any).permission === 'object') {
      // Convert permission object to tools string
      const permissions = (baseAgent as any).permission;
      const allowedTools = Object.entries(permissions)
        .filter(([, value]) => value === 'allow')
        .map(([tool]) => tool);
      toolsString = allowedTools.length > 0 ? allowedTools.join(', ') : undefined;
    }

    // Validate and convert model to Claude Code format
    let model: string | undefined;
    if (baseAgent.model) {
      model = this.convertModelForClaudeCode(baseAgent.model);
    }

    // STRICT: Only include Claude Code v2.x.x allowed fields
    const claudeCodeFrontmatter: ClaudeCodeAgent = {
      name: baseAgent.name,
      description: baseAgent.description,
      ...(toolsString && { tools: toolsString }),
      ...(model && { model }),
    };

    // Explicitly strips: mode, temperature, capabilities, permission, tags, category, etc.

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
      name: baseAgent.name || agent.name, // Use base name or agent filename as fallback
      description: baseAgent.description,
      mode: baseAgent.mode || 'subagent', // Official default is 'subagent'
      model: baseAgent.model,
      temperature: baseAgent.temperature,
      // Use proper OpenCode permission format - convert from base permissions or tools
      permission: baseAgent.permissions?.opencode
        ? this.convertBaseOpenCodePermissions(baseAgent.permissions.opencode)
        : baseAgent.tools
          ? this.convertToolsToPermissions(baseAgent.tools)
          : undefined,
      // Preserve custom fields for compatibility
      ...(baseAgent.category && { category: baseAgent.category }),
      ...(baseAgent.tags && { tags: baseAgent.tags }),
      ...(baseAgent.allowed_directories && { allowed_directories: baseAgent.allowed_directories }),
    };

    // Convert model format for OpenCode if needed
    if (openCodeFrontmatter.model) {
      openCodeFrontmatter.model = this.convertModelForOpenCode(openCodeFrontmatter.model);
    }

    // Validate and normalize permissions
    if (openCodeFrontmatter.permission) {
      const validation = this.validatePermissions(openCodeFrontmatter.permission);
      if (!validation.valid) {
        throw new Error(
          `Invalid permissions for agent ${baseAgent.name}: ${validation.errors.join(', ')}`
        );
      }
    } else {
      // Add default permissions if none are present
      openCodeFrontmatter.permission = {
        edit: 'deny',
        bash: 'deny',
        webfetch: 'allow',
      };
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
      // Convert permission format back to tools format for base compatibility
      tools: frontmatter.permission
        ? this.convertPermissionsToTools(frontmatter.permission)
        : frontmatter.tools, // Fallback to tools if permission not available
      // Preserve custom OpenCode fields for future conversion back
      ...(frontmatter.category && { category: frontmatter.category }),
      ...(frontmatter.tags && { tags: frontmatter.tags }),
      ...(frontmatter.allowed_directories && {
        allowed_directories: frontmatter.allowed_directories,
      }),
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
   * Convert base OpenCode permissions to official OpenCode format
   */
  private convertBaseOpenCodePermissions(
    basePermissions: Record<string, any>
  ): Record<string, 'allow' | 'ask' | 'deny'> {
    const permissions: Record<string, 'allow' | 'ask' | 'deny'> = {};

    // If the base permissions have a 'tools' array, convert each tool to 'allow'
    if (basePermissions.tools && Array.isArray(basePermissions.tools)) {
      for (const tool of basePermissions.tools) {
        permissions[tool] = 'allow';
      }
    }

    return permissions;
  }

  /**
   * Convert tools object to permission format for official OpenCode specification
   * Uses centralized logic consistent with normalizePermissionFormat
   */
  private convertToolsToPermissions(
    tools: Record<string, boolean>
  ): Record<string, 'allow' | 'ask' | 'deny'> {
    // Use the same logic as normalizePermissionFormat for consistency
    const permissions: Record<string, 'allow' | 'ask' | 'deny'> = {
      edit: this.booleanToPermissionString(tools.edit || false),
      bash: this.booleanToPermissionString(tools.bash || false),
      webfetch: this.booleanToPermissionString(tools.webfetch !== false), // Default to true if not explicitly false
    };

    // Add any additional tools that aren't in the standard set
    for (const [tool, enabled] of Object.entries(tools)) {
      if (!['edit', 'bash', 'webfetch'].includes(tool)) {
        permissions[tool] = this.booleanToPermissionString(enabled);
      }
    }

    return permissions;
  }

  /**
   * Convert boolean to permission string (centralized helper)
   */
  private booleanToPermissionString(value: boolean): 'allow' | 'ask' | 'deny' {
    return value ? 'allow' : 'deny';
  }

  /**
   * Convert permission format back to tools format for compatibility
   */
  private convertPermissionsToTools(
    permissions: Record<string, 'allow' | 'ask' | 'deny'>
  ): Record<string, boolean> {
    const tools: Record<string, boolean> = {};

    for (const [tool, permission] of Object.entries(permissions)) {
      tools[tool] = permission === 'allow';
    }

    return tools;
  }

  /**
   * Convert model format for Claude Code (v2.x.x: inherit|sonnet|opus|haiku)
   */
  private convertModelForClaudeCode(model: string): string | undefined {
    // Map common model names to Claude Code format
    const modelMap: Record<string, string> = {
      'claude-sonnet': 'sonnet',
      'claude-opus': 'opus',
      'claude-haiku': 'haiku',
      'anthropic/claude-sonnet-4': 'sonnet',
      'anthropic/claude-opus-4': 'opus',
      'anthropic/claude-haiku-4': 'haiku',
      'inherit': 'inherit',
      'sonnet': 'sonnet',
      'opus': 'opus',
      'haiku': 'haiku',
    };

    // Check if model is already in valid format
    if (['inherit', 'sonnet', 'opus', 'haiku'].includes(model)) {
      return model;
    }

    // Try to map the model
    const mapped = modelMap[model.toLowerCase()];
    if (mapped) {
      return mapped;
    }

    // If we can't map it, default to inherit
    console.warn(`Unknown model '${model}', defaulting to 'inherit' for Claude Code`);
    return 'inherit';
  }

  /**
   * Convert model format for OpenCode (provider/model format)
   */
  private convertModelForOpenCode(model: string): string {
    // Map Claude Code models to OpenCode format
    const modelMap: Record<string, string> = {
      'sonnet': 'anthropic/claude-sonnet-4',
      'opus': 'anthropic/claude-opus-4',
      'haiku': 'anthropic/claude-haiku-4',
      'inherit': 'anthropic/claude-sonnet-4', // Default to sonnet
    };

    // If already in provider/model format, return as-is
    if (model.includes('/')) {
      return model;
    }

    // Try to map from Claude Code format
    const mapped = modelMap[model.toLowerCase()];
    if (mapped) {
      return mapped;
    }

    // If we can't map it, return as-is (might be valid OpenCode format already)
    return model;
  }

  /**
   * Convert Base command format to OpenCode command format
   */
  baseCommandToOpenCode(command: Command): Command {
    if (command.format !== 'base') {
      throw new Error(`Expected base format, got ${command.format}`);
    }

    const baseCommand = command.frontmatter as BaseCommand;

    // OpenCode command format with required mode: 'command'
    const openCodeFrontmatter: OpenCodeCommand = {
      name: baseCommand.name,
      description: baseCommand.description,
      mode: 'command',
      version: baseCommand.version,
      inputs: baseCommand.inputs,
      outputs: baseCommand.outputs,
      cache_strategy: baseCommand.cache_strategy,
      success_signals: baseCommand.success_signals,
      failure_modes: baseCommand.failure_modes,
      // Preserve legacy fields
      ...(baseCommand.usage && { usage: baseCommand.usage }),
      ...(baseCommand.examples && { examples: baseCommand.examples }),
      ...(baseCommand.constraints && { constraints: baseCommand.constraints }),
      ...(baseCommand.intended_followups && { intended_followups: baseCommand.intended_followups }),
    };

    return {
      ...command,
      format: 'opencode',
      frontmatter: openCodeFrontmatter,
    };
  }

  /**
   * Validate permission format for OpenCode compatibility
   */
  private validatePermissions(permissions: Record<string, any>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!permissions || typeof permissions !== 'object') {
      errors.push('Permission must be an object');
      return { valid: false, errors };
    }

    for (const [action, value] of Object.entries(permissions)) {
      if (!['allow', 'ask', 'deny'].includes(value as string)) {
        errors.push(`Permission for '${action}' must be 'allow', 'ask', or 'deny', got '${value}'`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
