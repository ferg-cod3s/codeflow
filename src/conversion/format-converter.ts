import {
  Agent,
  BaseAgent,
  ClaudeCodeAgent,
  OpenCodeAgent,
  Command,
  BaseCommand,
  OpenCodeCommand,
} from './agent-parser';

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
        .filter(([, enabled]) => enabled === true)
        .map(([tool]) => tool);
      toolsString = enabledTools.length > 0 ? enabledTools.join(', ') : undefined;
    } else if (baseAgent.permission && typeof baseAgent.permission === 'object') {
      // Convert permission object to tools string
      const permissions = baseAgent.permission as Record<string, any>;
      const allowedTools = Object.entries(permissions)
        .filter(([, value]) => value === 'allow')
        .map(([tool]) => tool);
      toolsString = allowedTools.length > 0 ? allowedTools.join(', ') : undefined;
    }

    // Validate and convert model to Claude Code format
    // Default to 'inherit' so agents use whatever model is active (Sonnet in plan, Haiku in code, etc.)
    let model: string = 'inherit';
    if (baseAgent.model) {
      const convertedModel = this.convertModelForClaudeCode(baseAgent.model);
      if (convertedModel) {
        model = convertedModel;
      }
    }

    // STRICT: Only include Claude Code v2.x.x allowed fields
    const claudeCodeFrontmatter: ClaudeCodeAgent = {
      name: baseAgent.name,
      description: baseAgent.description,
      ...(toolsString && { tools: toolsString }),
      model, // Always include model (defaults to 'inherit')
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
      permission: this.extractPermissions(baseAgent),
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
      // Add default permissions if none are present - following security best practices
      openCodeFrontmatter.permission = {
        edit: 'deny', // Require explicit permission for file editing
        bash: 'deny', // Require explicit permission for command execution
        webfetch: 'allow', // Generally safe to allow web fetching
        read: 'allow', // Allow reading files by default
        write: 'deny', // Require explicit permission for writing
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
  convert(agent: Agent, targetFormat: 'base' | 'claude-code' | 'opencode' | 'cursor'): Agent {
    if (agent.format === targetFormat) {
      return agent;
    }

    // Check if this is a command by looking at the frontmatter mode
    const isCommand = (agent.frontmatter as any).mode === 'command';

    switch (agent.format) {
      case 'base':
        switch (targetFormat) {
          case 'cursor':
            // Cursor uses same format as Claude Code, but commands need special handling
            if (isCommand) {
              const convertedCmd = this.baseCommandToOpenCode(agent as Command);
              return { ...convertedCmd, format: 'claude-code' } as Agent;
            }
            return this.baseToClaudeCode(agent);
          case 'claude-code':
            // Commands convert to OpenCode format first, then adapt to Claude Code
            if (isCommand) {
              const convertedCmd = this.baseCommandToOpenCode(agent as Command);
              return { ...convertedCmd, format: 'claude-code' } as Agent;
            }
            return this.baseToClaudeCode(agent);
          case 'opencode':
            return isCommand
              ? (this.baseCommandToOpenCode(agent as Command) as Agent)
              : this.baseToOpenCode(agent);
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
      case 'cursor':
        // Cursor uses same format as claude-code
        switch (targetFormat) {
          case 'base':
            return this.claudeCodeToBase(agent);
          case 'opencode':
            return this.claudeCodeToOpenCode(agent);
          case 'claude-code':
            return this.baseToClaudeCode(agent); // Cursor uses same format as Claude Code
          case 'cursor':
            return agent; // Same format
        }
        break;
      case 'opencode':
        switch (targetFormat) {
          case 'base':
            return this.openCodeToBase(agent);
          case 'cursor':
            return this.baseToClaudeCode(agent); // Cursor uses same format as Claude Code
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
    _sourceDir: string,
    _targetFormat: 'base' | 'claude-code' | 'opencode' | 'cursor',
    _outputDir: string
  ): void {
    // Implementation remains the same
  }

  /**
   * Convert a batch of agents to target format
   */
  convertBatch(
    agents: Agent[],
    targetFormat: 'base' | 'claude-code' | 'opencode' | 'cursor'
  ): Agent[] {
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
   * Extract permissions from base agent in priority order:
   * 1. Complex permission objects (bash: {...}, edit: 'allow', etc.) - FLATTENED for OpenCode
   * 2. permissions.opencode field
   * 3. tools object (boolean flags)
   */
  private extractPermissions(baseAgent: BaseAgent): Record<string, any> | undefined {
    const basePermission = (baseAgent as any).permission;

    // Priority 1: Check if permission field exists with complex objects or simple strings
    if (basePermission && typeof basePermission === 'object') {
      const extracted: Record<string, 'allow' | 'ask' | 'deny'> = {};

      for (const [key, value] of Object.entries(basePermission)) {
        // Flatten nested permission objects for OpenCode compatibility
        extracted[key] = this.flattenNestedPermission(value);
      }

      if (Object.keys(extracted).length > 0) {
        // Ensure webfetch is present with default value if missing
        if (!extracted.webfetch) {
          extracted.webfetch = 'allow';
        }
        return extracted;
      }
    }

    // Priority 2: Check permissions.opencode field
    if (baseAgent.permissions?.opencode) {
      return this.convertBaseOpenCodePermissions(baseAgent.permissions.opencode);
    }

    // Priority 3: Fall back to tools object
    if (baseAgent.tools) {
      return this.convertToolsToPermissions(baseAgent.tools);
    }

    return undefined;
  }

  /**
   * Flatten nested permission objects to simple allow/deny strings
   * Example: wildcard allow with specific denies -> "allow" (use most permissive value)
   */
  private flattenNestedPermission(permission: any): 'allow' | 'ask' | 'deny' {
    if (typeof permission === 'string') {
      return permission as 'allow' | 'ask' | 'deny';
    }

    if (typeof permission === 'object' && permission !== null) {
      // For OpenCode, we need to flatten to a single value
      // Strategy: Use the wildcard "*" value if present, otherwise use "allow" if any rule allows
      if ('*' in permission) {
        return permission['*'] as 'allow' | 'ask' | 'deny';
      }

      // Check if any rule allows access
      const values = Object.values(permission);
      if (values.includes('allow')) {
        return 'allow';
      }
      if (values.includes('ask')) {
        return 'ask';
      }
      return 'deny';
    }

    return 'deny'; // Safe default
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
      inherit: 'inherit',
      sonnet: 'sonnet',
      opus: 'opus',
      haiku: 'haiku',
      // Map OpenCode models to inherit for Claude Code (they're not compatible)
      'opencode/grok-code': 'inherit',
      'opencode/code-supernova': 'inherit',
      'opencode/grok-code-fast-1': 'inherit',
      'opencode/gpt-5': 'inherit',
      'github-copilot/gpt-5': 'inherit',
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
   * Uses free OpenCode models from models.dev by default
   */
  private convertModelForOpenCode(model: string): string {
    // Map Claude Code models to free OpenCode models from models.json
    const modelMap: Record<string, string> = {
      sonnet: 'opencode/grok-code', // Free OpenCode model (default)
      opus: 'opencode/code-supernova', // More capable free model
      haiku: 'opencode/grok-code', // Fast free model
      inherit: 'opencode/grok-code', // Default to free model
      'anthropic/claude-sonnet-4': 'opencode/grok-code',
      'anthropic/claude-opus-4': 'opencode/code-supernova',
      'anthropic/claude-haiku-4': 'opencode/grok-code',
      'gpt-5': 'github-copilot/gpt-5', // GPT-5 from github-copilot provider
    };

    // If already in OpenCode format, validate it exists
    if (model.startsWith('opencode/')) {
      // Validate against models.json
      const validModels = [
        'opencode/grok-code',
        'opencode/code-supernova',
        'opencode/grok-code-fast-1',
      ];

      // Special handling for gpt-5 - redirect to github-copilot provider
      if (model === 'opencode/gpt-5') {
        console.warn(
          `Model '${model}' is not available in opencode provider, using github-copilot provider instead`
        );
        return 'github-copilot/gpt-5';
      }

      if (validModels.includes(model)) {
        return model;
      }
      // If invalid OpenCode model, default to grok-code
      console.warn(`Unknown OpenCode model '${model}', defaulting to 'opencode/grok-code'`);
      return 'opencode/grok-code';
    }

    // Try to map from Claude Code or Anthropic format
    const mapped = modelMap[model.toLowerCase()];
    if (mapped) {
      return mapped;
    }

    // If we can't map it, default to free OpenCode grok-code model
    console.warn(`Unknown model '${model}', defaulting to 'opencode/grok-code' for OpenCode`);
    return 'opencode/grok-code';
  }

  /**
   * Convert Base command format to OpenCode command format
   * Ensures compliance with OPENCODE_BEST_PRACTICES.md
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
      version: baseCommand.version || '1.0.0',
      inputs: baseCommand.inputs,
      outputs: baseCommand.outputs,
      cache_strategy: baseCommand.cache_strategy || {
        type: 'content_based',
        ttl: 600,
        max_size: 100,
      },
      success_signals: baseCommand.success_signals || ['Command completed successfully'],
      failure_modes: baseCommand.failure_modes || ['Command execution failed'],
      // Preserve legacy fields
      ...(baseCommand.usage && { usage: baseCommand.usage }),
      ...(baseCommand.examples && { examples: baseCommand.examples }),
      ...(baseCommand.constraints && { constraints: baseCommand.constraints }),
      ...(baseCommand.intended_followups && { intended_followups: baseCommand.intended_followups }),
    };

    // Ensure command body includes $ARGUMENTS placeholder for best practices
    let commandBody = command.content || '';

    // CRITICAL: All commands MUST include $ARGUMENTS placeholder
    if (!commandBody.includes('$ARGUMENTS')) {
      // If command has no content, create basic structure
      if (!commandBody.trim()) {
        commandBody = '# Command execution\n\n$ARGUMENTS ';
      } else {
        // Add $ARGUMENTS at the end if not present, with proper spacing
        commandBody += '\n\n$ARGUMENTS ';
      }
    }

    // Add security validation and error handling
    commandBody = this.addSecurityAndErrorHandling(commandBody);

    return {
      ...command,
      format: 'opencode',
      frontmatter: openCodeFrontmatter,
      content: commandBody,
    };
  }

  /**
   * Add security validation and error handling to command content
   * Ensures compliance with security best practices
   */
  private addSecurityAndErrorHandling(commandBody: string): string {
    let enhancedBody = commandBody;

    // Add error handling at the beginning if missing
    if (!enhancedBody.includes('set -e') && !enhancedBody.includes('set -euo pipefail')) {
      enhancedBody = 'set -euo pipefail\n\n' + enhancedBody;
    }

    // Add argument validation for dangerous operations
    const dangerousPatterns = [
      {
        pattern: /\brm\s+-rf\s+\$ARGUMENTS\b/g,
        replacement: 'echo "Error: Dangerous rm -rf with $ARGUMENTS not allowed"',
      },
      {
        pattern: /\bsudo\s+/g,
        replacement: 'echo "Error: sudo commands not allowed in automated execution"',
      },
      {
        pattern: /\bchmod\s+777\b/g,
        replacement: 'echo "Error: chmod 777 not allowed for security reasons"',
      },
    ];

    for (const { pattern, replacement } of dangerousPatterns) {
      enhancedBody = enhancedBody.replace(pattern, replacement);
    }

    // Add validation for shell command templates
    enhancedBody = enhancedBody.replace(/!`([^`]*)`/g, (match, command) => {
      // Add error handling to shell commands if not present
      if (!command.includes('||') && !command.includes('&&')) {
        return '!`' + command + ' || echo "Shell command failed: ' + command + '"`';
      }
      return match;
    });

    // Enhanced template substitution
    enhancedBody = this.enhanceTemplateSubstitution(enhancedBody);

    // Add recommended patterns if missing
    enhancedBody = this.addRecommendedPatterns(enhancedBody);

    return enhancedBody;
  }

  /**
   * Enhanced template substitution for shell commands and file references
   * Follows OPENCODE_BEST_PRACTICES.md template patterns
   */
  private enhanceTemplateSubstitution(commandBody: string): string {
    let enhancedBody = commandBody;

    // Handle shell command templates (!`command`)
    enhancedBody = enhancedBody.replace(/!`([^`]*)`/g, (match, command) => {
      // Ensure shell commands have proper error handling
      if (!command.includes('||') && !command.includes('&&') && !command.includes('2>/dev/null')) {
        return '!`' + command + ' 2>/dev/null || echo "Command failed: ' + command + '"`';
      }
      return match;
    });

    // Handle file references (@file or @path)
    enhancedBody = enhancedBody.replace(/@([a-zA-Z0-9_\-./]+)/g, (match, filePath) => {
      // Validate file path to prevent directory traversal
      if (filePath.includes('..') || filePath.startsWith('/')) {
        return '# Invalid file path: ' + filePath;
      }
      return match; // Keep the reference but add validation in execution
    });

    // Handle environment variable references (${VAR} or $VAR)
    enhancedBody = enhancedBody.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      // Add validation for common environment variables
      const safeVars = ['HOME', 'PWD', 'USER', 'PATH', 'DATE', 'TIME'];
      if (safeVars.includes(varName.toUpperCase())) {
        return match;
      }
      return '# Unsafe environment variable: ' + varName;
    });

    // Add date/time handling patterns
    enhancedBody = this.addDateTimePatterns(enhancedBody);

    return enhancedBody;
  }

  /**
   * Add date/time handling patterns following best practices
   */
  private addDateTimePatterns(commandBody: string): string {
    let enhancedBody = commandBody;

    // Replace DATE and TIME placeholders with proper shell commands
    if (enhancedBody.includes('DATE') || enhancedBody.includes('TIME')) {
      if (!enhancedBody.includes('date') && !enhancedBody.includes('$(date')) {
        enhancedBody = enhancedBody.replace(/\bDATE\b/g, '$(date -u +"%Y-%m-%d")');
        enhancedBody = enhancedBody.replace(/\bTIME\b/g, '$(date -u +"%Y-%m-%dT%H:%M:%SZ")');
      }
    }

    // Add timestamp generation for logging
    if (enhancedBody.includes('log') || enhancedBody.includes('LOG')) {
      if (!enhancedBody.includes('TIMESTAMP')) {
        enhancedBody = enhancedBody.replace(
          /\bTIMESTAMP\b/g,
          '$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")'
        );
      }
    }

    return enhancedBody;
  }

  /**
   * Add recommended patterns for better functionality
   */
  private addRecommendedPatterns(commandBody: string): string {
    let enhancedBody = commandBody;

    // Add shell command example if missing
    if (!enhancedBody.includes('!`') && !enhancedBody.includes('shell command')) {
      enhancedBody += '\n\n## Example Usage\n\n!`echo "Processing arguments: $ARGUMENTS"`\n';
    }

    // Add file reference example if missing
    if (!enhancedBody.includes('@') && !enhancedBody.includes('file reference')) {
      enhancedBody += '\n## File References\n\nUse @filename to reference files in arguments\n';
    }

    // Add error handling example if missing
    if (!enhancedBody.includes('error') && !enhancedBody.includes('try')) {
      enhancedBody += '\n## Error Handling\n\nArguments are validated before processing\n';
    }

    return enhancedBody;
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
      // Allow nested objects for complex permission rules (e.g., bash wildcards)
      if (typeof value === 'object' && value !== null) {
        // Validate nested permission values
        for (const [subAction, subValue] of Object.entries(value)) {
          if (!['allow', 'ask', 'deny'].includes(subValue as string)) {
            errors.push(
              `Nested permission for '${action}.${subAction}' must be 'allow', 'ask', or 'deny', got '${subValue}'`
            );
          }
        }
      } else if (!['allow', 'ask', 'deny'].includes(value as string)) {
        errors.push(`Permission for '${action}' must be 'allow', 'ask', or 'deny', got '${value}'`);
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
