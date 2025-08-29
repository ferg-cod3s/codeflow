import { Agent, BaseAgent, ClaudeCodeAgent, OpenCodeAgent } from "./agent-parser";

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
    const claudeCodeFrontmatter: ClaudeCodeAgent = { ...agent.frontmatter };
    
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
    const openCodeFrontmatter: OpenCodeAgent = { ...agent.frontmatter };
    
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
    const openCodeFrontmatter: OpenCodeAgent = { ...agent.frontmatter };
    
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
    const frontmatter = agent.frontmatter as OpenCodeAgent;
    const baseFrontmatter: BaseAgent = {
      description: frontmatter.description,
      mode: frontmatter.mode,
      model: frontmatter.model,
      temperature: frontmatter.temperature,
      tools: frontmatter.tools
    };
    
    // Copy any additional properties that aren't OpenCode-specific
    for (const [key, value] of Object.entries(frontmatter)) {
      if (!['usage', 'do_not_use_when', 'escalation', 'examples', 'prompts', 'constraints'].includes(key) &&
          !['description', 'mode', 'model', 'temperature', 'tools'].includes(key)) {
        baseFrontmatter[key] = value;
      }
    }
    
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
   * Convert agent to any target format
   */
  convertTo(agent: Agent, targetFormat: 'base' | 'claude-code' | 'opencode'): Agent {
    if (agent.format === targetFormat) {
      return agent; // No conversion needed
    }
    
    // Direct conversion routes
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
          case 'claude-code': return this.openCodeToClaudeCode(agent);
        }
        break;
    }
    
    throw new Error(`Cannot convert from ${agent.format} to ${targetFormat}`);
  }
  
  /**
   * Batch convert multiple agents to target format
   */
  convertBatch(agents: Agent[], targetFormat: 'base' | 'claude-code' | 'opencode'): Agent[] {
    return agents.map(agent => this.convertTo(agent, targetFormat));
  }
  
  /**
   * Test round-trip conversion to ensure no data loss
   */
  testRoundTrip(agent: Agent): { success: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      let converted = agent;
      const originalFormat = agent.format;
      
      // Convert through all formats and back to original
      const formats: ('base' | 'claude-code' | 'opencode')[] = ['base', 'claude-code', 'opencode'];
      const otherFormats = formats.filter(f => f !== originalFormat);
      
      for (const format of otherFormats) {
        converted = this.convertTo(converted, format);
        converted = this.convertTo(converted, originalFormat);
        
        // Check for data preservation
        const originalKeys = Object.keys(agent.frontmatter);
        const convertedKeys = Object.keys(converted.frontmatter);
        
        // Check for missing keys
        for (const key of originalKeys) {
          if (!convertedKeys.includes(key)) {
            errors.push(`Lost key '${key}' during ${format} round-trip conversion`);
          }
        }
        
        // Check for value preservation (simple comparison)
        for (const key of originalKeys) {
          const originalValue = agent.frontmatter[key];
          const convertedValue = converted.frontmatter[key];
          
          if (JSON.stringify(originalValue) !== JSON.stringify(convertedValue)) {
            errors.push(`Value changed for '${key}' during ${format} round-trip: ${JSON.stringify(originalValue)} -> ${JSON.stringify(convertedValue)}`);
          }
        }
        
        // Check content preservation
        if (agent.content !== converted.content) {
          errors.push(`Content changed during ${format} round-trip conversion`);
        }
      }
      
    } catch (error: any) {
      errors.push(`Round-trip conversion failed: ${error.message}`);
    }
    
    return {
      success: errors.length === 0,
      errors
    };
  }
  
  /**
   * Convert model format for OpenCode compatibility
   * Uses models.dev provider/model format (providerId/modelId)
   */
  private convertModelForOpenCode(model: string): string {
    // If already in provider/model format, return as-is
    if (model.includes('/')) {
      return model;
    }
    
    // Convert Claude models to anthropic provider format
    if (model.startsWith('claude-')) {
      // Use latest Claude Sonnet 4 from models.dev
      if (model.includes('sonnet') || model.includes('claude-3-5-sonnet')) {
        return 'anthropic/claude-sonnet-4-20250514';
      }
      // For other Claude models, add anthropic provider prefix
      return `anthropic/${model}`;
    }
    
    // Convert GitHub Copilot models (check these first to avoid conflicts)
    if (model.startsWith('github-copilot-') || model.startsWith('gpt-4') || model.startsWith('gpt-5')) {
      // Handle already prefixed models
      if (model.startsWith('github-copilot-')) {
        return `github-copilot/${model.replace('github-copilot-', '')}`;
      }
      // Handle models that should use GitHub Copilot provider
      return `github-copilot/${model}`;
    }
    
    // Convert OpenAI models (general gpt- models that aren't gpt-4 or gpt-5)
    if (model.startsWith('gpt-') || model.startsWith('o1-')) {
      return `openai/${model}`;
    }
    
    // Convert Google models  
    if (model.startsWith('gemini-')) {
      return `google/${model}`;
    }
    
    // Default: return as-is with warning comment
    console.warn(`Unknown model format for OpenCode conversion: ${model}`);
    return model;
  }
}