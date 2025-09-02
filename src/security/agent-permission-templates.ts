/**
 * Agent Permission Templates
 * 
 * Defines standardized permission/tool templates for different agent roles
 * based on the principle of least privilege access patterns.
 * 
 * Updated to work with existing formats:
 * - OpenCode agents use detailed `tools:` blocks with boolean values
 * - Claude Code agents use comma-separated `tools:` strings
 */

export interface AgentRoleTemplate {
  opencode: {
    tools: Record<string, boolean>;
    description: string;
  };
  claude: {
    tools: string[];
    description: string;
  };
}

/**
 * Permission templates for different agent roles based on current usage patterns
 */
export const AGENT_PERMISSION_TEMPLATES: Record<string, AgentRoleTemplate> = {
  // Read-only agents for code review and analysis
  reviewer: {
    opencode: {
      tools: {
        read: true,
        grep: true,
        glob: true,
        list: true,
        write: false,
        edit: false,
        bash: false,
        patch: false,
        webfetch: false
      },
      description: "Read-only access for code review and analysis"
    },
    claude: {
      tools: ['read', 'grep', 'glob', 'list'],
      description: "Read-only access for code review and analysis"
    }
  },

  // Search-only agents for file and content discovery
  analyzer: {
    opencode: {
      tools: {
        grep: true,
        glob: true,
        list: true,
        read: true,
        write: false,
        edit: false,
        bash: false,
        patch: false,
        webfetch: false
      },
      description: "Search and read access for content discovery"
    },
    claude: {
      tools: ['grep', 'glob', 'list', 'read'],
      description: "Search and read access for content discovery"
    }
  },

  // Full development capability agents
  builder: {
    opencode: {
      tools: {
        write: true,
        edit: true,
        bash: true,
        patch: true,
        read: true,
        grep: true,
        glob: true,
        list: true,
        webfetch: true
      },
      description: "Full development and modification capabilities"
    },
    claude: {
      tools: ['write', 'edit', 'bash', 'patch', 'read', 'grep', 'glob', 'list', 'webfetch'],
      description: "Full development and modification capabilities"
    }
  },

  // Search-focused agents with minimal permissions
  locator: {
    opencode: {
      tools: {
        grep: true,
        glob: true,
        list: true,
        read: false,
        write: false,
        edit: false,
        bash: false,
        patch: false,
        webfetch: false
      },
      description: "Minimal search-only access for file discovery"
    },
    claude: {
      tools: ['grep', 'glob', 'list'],
      description: "Minimal search-only access for file discovery"
    }
  },

  // Research agents that need web access but no modification capability
  researcher: {
    opencode: {
      tools: {
        read: true,
        grep: true,
        glob: true,
        list: true,
        webfetch: true,
        write: false,
        edit: false,
        bash: false,
        patch: false
      },
      description: "Read and web access for research tasks"
    },
    claude: {
      tools: ['read', 'grep', 'glob', 'list', 'webfetch'],
      description: "Read and web access for research tasks"
    }
  }
};

/**
 * Determine agent role based on agent name, filename, or description
 */
export function determineAgentRole(agentIdentifier: string, description?: string): string {
  const identifier = agentIdentifier.toLowerCase();
  const desc = description?.toLowerCase() || '';

  // Check for specific role indicators in name/filename
  if (identifier.includes('reviewer') || identifier.includes('review')) {
    return 'reviewer';
  }
  
  if (identifier.includes('locator') || identifier.includes('finder')) {
    return 'locator';
  }
  
  if (identifier.includes('research') || identifier.includes('search')) {
    return 'researcher';
  }

  if (identifier.includes('analyzer') || identifier.includes('analysis')) {
    return 'analyzer';
  }

  // Check description for role indicators
  if (desc.includes('review') || desc.includes('feedback') || desc.includes('quality')) {
    return 'reviewer';
  }

  if (desc.includes('locate') || desc.includes('find') || desc.includes('discover')) {
    return 'locator';
  }

  if (desc.includes('research') || desc.includes('web') || desc.includes('search')) {
    return 'researcher';
  }

  if (desc.includes('analy') || desc.includes('understand') || desc.includes('examine')) {
    return 'analyzer';
  }

  // Default to builder role for development-related agents
  return 'builder';
}

/**
 * Get permission template for a specific agent role and format
 */
export function getPermissionTemplate(role: string, format: 'opencode' | 'claude'): AgentRoleTemplate[typeof format] {
  const template = AGENT_PERMISSION_TEMPLATES[role];
  if (!template) {
    throw new Error(`Unknown agent role: ${role}`);
  }
  return template[format];
}

/**
 * Validate that agent permissions follow least-privilege principles
 */
export function validateAgentPermissions(
  role: string, 
  format: 'opencode' | 'claude', 
  permissions: Record<string, boolean> | string[]
): { valid: boolean; violations: string[] } {
  const template = getPermissionTemplate(role, format);
  const violations: string[] = [];

  if (format === 'opencode') {
    const perms = permissions as Record<string, boolean>;
    const expectedTools = template.tools as Record<string, boolean>;

    // Check for overly permissive tools
    for (const [tool, expected] of Object.entries(expectedTools)) {
      if (!expected && perms[tool] === true) {
        violations.push(`Agent has ${tool}=true but role ${role} should have ${tool}=false`);
      }
    }
  } else {
    const perms = permissions as string[];
    const expectedTools = template.tools as string[];

    // Check for extra permissions not in template
    for (const tool of perms) {
      if (!expectedTools.includes(tool)) {
        violations.push(`Agent has '${tool}' permission but role ${role} should not have this tool`);
      }
    }
  }

  return {
    valid: violations.length === 0,
    violations
  };
}

/**
 * Get list of all available agent roles
 */
export function getAvailableRoles(): string[] {
  return Object.keys(AGENT_PERMISSION_TEMPLATES);
}

/**
 * Get role statistics for debugging and analysis
 */
export function getRoleStatistics(): Record<string, { toolCount: number; hasWebAccess: boolean; hasWriteAccess: boolean }> {
  const stats: Record<string, { toolCount: number; hasWebAccess: boolean; hasWriteAccess: boolean }> = {};

  for (const [role, template] of Object.entries(AGENT_PERMISSION_TEMPLATES)) {
    const claudeTools = template.claude.tools;
    stats[role] = {
      toolCount: claudeTools.length,
      hasWebAccess: claudeTools.includes('webfetch'),
      hasWriteAccess: claudeTools.includes('write') || claudeTools.includes('edit')
    };
  }

  return stats;
}