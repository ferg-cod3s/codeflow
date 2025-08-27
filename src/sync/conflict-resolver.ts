import { join } from "node:path";
import { writeFile, readFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import type { Agent } from "../conversion/agent-parser";

export interface AgentConflict {
  type: 'name' | 'content' | 'format' | 'location';
  agentName: string;
  description: string;
  sources: ConflictSource[];
  severity: 'low' | 'medium' | 'high';
  autoResolvable: boolean;
}

export interface ConflictSource {
  path: string;
  format: 'base' | 'claude-code' | 'opencode';
  agent: Agent;
  lastModified: Date;
  isGlobal: boolean;
  isUserCustomized: boolean;
}

export interface Resolution {
  action: 'merge' | 'overwrite' | 'ignore' | 'manual';
  chosenSource?: ConflictSource;
  mergedAgent?: Agent;
  explanation: string;
  preserveCustomizations: boolean;
}

export interface ConflictResolutionOptions {
  /** Strategy for automatic resolution */
  strategy?: 'preserve-user' | 'prefer-latest' | 'prefer-global' | 'manual-only';
  /** Whether to create backups before resolution */
  createBackups?: boolean;
  /** Whether to maintain audit trail */
  auditTrail?: boolean;
}

export class ConflictResolver {
  private auditFile: string;
  
  constructor(private options: ConflictResolutionOptions = {}) {
    this.options = {
      strategy: 'preserve-user',
      createBackups: true,
      auditTrail: true,
      ...options
    };
    
    this.auditFile = join(homedir(), '.claude', 'conflict-audit.log');
  }

  /**
   * Detect conflicts between agent sources
   */
  async detectConflicts(agentName: string, sources: ConflictSource[]): Promise<AgentConflict[]> {
    const conflicts: AgentConflict[] = [];

    if (sources.length < 2) {
      return conflicts; // No conflicts possible with single source
    }

    // Group sources by location type
    const globalSources = sources.filter(s => s.isGlobal);
    const projectSources = sources.filter(s => !s.isGlobal);
    const userCustomized = sources.filter(s => s.isUserCustomized);

    // Check for name conflicts (same agent in multiple formats)
    if (sources.length > 1) {
      const formats = new Set(sources.map(s => s.format));
      if (formats.size > 1) {
        conflicts.push({
          type: 'name',
          agentName,
          description: `Agent "${agentName}" exists in multiple formats: ${Array.from(formats).join(', ')}`,
          sources,
          severity: 'medium',
          autoResolvable: true
        });
      }
    }

    // Check for content conflicts (same format, different content)
    const formatGroups = this.groupSourcesByFormat(sources);
    for (const [format, formatSources] of formatGroups) {
      if (formatSources.length > 1) {
        const hasContentDifferences = await this.hasContentDifferences(formatSources);
        if (hasContentDifferences) {
          conflicts.push({
            type: 'content',
            agentName,
            description: `Multiple versions of agent "${agentName}" in ${format} format with different content`,
            sources: formatSources,
            severity: userCustomized.length > 0 ? 'high' : 'medium',
            autoResolvable: userCustomized.length === 0
          });
        }
      }
    }

    // Check for location conflicts (global vs project overrides)
    if (globalSources.length > 0 && projectSources.length > 0) {
      conflicts.push({
        type: 'location',
        agentName,
        description: `Agent "${agentName}" exists in both global and project locations`,
        sources,
        severity: 'low',
        autoResolvable: true
      });
    }

    return conflicts;
  }

  /**
   * Resolve a conflict using configured strategy
   */
  async resolveAgentConflict(conflict: AgentConflict): Promise<Resolution> {
    await this.logConflict(conflict);

    // Try automatic resolution first
    const autoResolution = await this.attemptAutoResolution(conflict);
    if (autoResolution) {
      await this.logResolution(conflict, autoResolution);
      return autoResolution;
    }

    // Fall back to manual resolution
    const manualResolution = await this.requestManualResolution(conflict);
    await this.logResolution(conflict, manualResolution);
    return manualResolution;
  }

  /**
   * Attempt automatic resolution based on strategy
   */
  private async attemptAutoResolution(conflict: AgentConflict): Promise<Resolution | null> {
    if (!conflict.autoResolvable || this.options.strategy === 'manual-only') {
      return null;
    }

    switch (this.options.strategy) {
      case 'preserve-user':
        return this.resolvePreserveUser(conflict);
      
      case 'prefer-latest':
        return this.resolvePreferLatest(conflict);
      
      case 'prefer-global':
        return this.resolvePreferGlobal(conflict);
      
      default:
        return null;
    }
  }

  /**
   * Preserve user customizations strategy
   */
  private async resolvePreserveUser(conflict: AgentConflict): Promise<Resolution> {
    const userCustomized = conflict.sources.find(s => s.isUserCustomized);
    
    if (userCustomized) {
      return {
        action: 'overwrite',
        chosenSource: userCustomized,
        explanation: 'Preserved user-customized version to maintain local modifications',
        preserveCustomizations: true
      };
    }

    // If no user customization, prefer project over global
    const projectSource = conflict.sources.find(s => !s.isGlobal);
    if (projectSource) {
      return {
        action: 'overwrite',
        chosenSource: projectSource,
        explanation: 'Preferred project-specific version over global default',
        preserveCustomizations: true
      };
    }

    // Fall back to latest
    return this.resolvePreferLatest(conflict);
  }

  /**
   * Prefer latest modification strategy
   */
  private resolvePreferLatest(conflict: AgentConflict): Resolution {
    const latestSource = conflict.sources.reduce((latest, current) => 
      current.lastModified > latest.lastModified ? current : latest
    );

    return {
      action: 'overwrite',
      chosenSource: latestSource,
      explanation: `Used most recently modified version from ${latestSource.path}`,
      preserveCustomizations: false
    };
  }

  /**
   * Prefer global configuration strategy
   */
  private resolvePreferGlobal(conflict: AgentConflict): Resolution {
    const globalSource = conflict.sources.find(s => s.isGlobal);
    
    if (globalSource) {
      return {
        action: 'overwrite',
        chosenSource: globalSource,
        explanation: 'Used global configuration to maintain consistency',
        preserveCustomizations: false
      };
    }

    // Fall back to latest if no global source
    return this.resolvePreferLatest(conflict);
  }

  /**
   * Request manual resolution from user
   */
  private async requestManualResolution(conflict: AgentConflict): Promise<Resolution> {
    console.log("\n🔄 Manual Conflict Resolution Required");
    console.log("═══════════════════════════════════════");
    console.log(`Agent: ${conflict.agentName}`);
    console.log(`Type: ${conflict.type}`);
    console.log(`Description: ${conflict.description}`);
    console.log(`Severity: ${conflict.severity.toUpperCase()}`);
    console.log("");

    console.log("Available Sources:");
    conflict.sources.forEach((source, index) => {
      console.log(`  ${index + 1}. ${source.path}`);
      console.log(`     Format: ${source.format}`);
      console.log(`     Modified: ${source.lastModified.toISOString()}`);
      console.log(`     Location: ${source.isGlobal ? 'Global' : 'Project'}`);
      console.log(`     Customized: ${source.isUserCustomized ? 'Yes' : 'No'}`);
      console.log("");
    });

    // For now, return a conservative resolution
    // In a full implementation, this would prompt the user for input
    const userCustomized = conflict.sources.find(s => s.isUserCustomized);
    if (userCustomized) {
      return {
        action: 'overwrite',
        chosenSource: userCustomized,
        explanation: 'Manual resolution: preserved user-customized version',
        preserveCustomizations: true
      };
    }

    // Default to ignoring the conflict and keeping current state
    return {
      action: 'ignore',
      explanation: 'Manual resolution required - conflict preserved for user review',
      preserveCustomizations: true
    };
  }

  /**
   * Apply resolution to filesystem
   */
  async applyResolution(conflict: AgentConflict, resolution: Resolution): Promise<void> {
    if (resolution.action === 'ignore') {
      return; // Nothing to apply
    }

    // Create backups if requested
    if (this.options.createBackups) {
      await this.createBackups(conflict);
    }

    switch (resolution.action) {
      case 'overwrite':
        if (resolution.chosenSource) {
          await this.applyOverwrite(conflict, resolution.chosenSource);
        }
        break;
      
      case 'merge':
        if (resolution.mergedAgent) {
          await this.applyMerge(conflict, resolution.mergedAgent);
        }
        break;
      
      case 'manual':
        // Create conflict markers or separate files for manual resolution
        await this.createManualResolutionFiles(conflict);
        break;
    }

    await this.logResolutionApplication(conflict, resolution);
  }

  /**
   * Create backups before applying resolution
   */
  private async createBackups(conflict: AgentConflict): Promise<void> {
    const backupDir = join(homedir(), '.claude', 'conflict-backups', 
      new Date().toISOString().slice(0, 10));
    
    await mkdir(backupDir, { recursive: true });

    for (const source of conflict.sources) {
      const backupName = `${conflict.agentName}-${source.format}-${Date.now()}.md`;
      const backupPath = join(backupDir, backupName);
      
      const content = await readFile(source.path, 'utf8');
      await writeFile(backupPath, content);
      
      console.log(`📦 Created backup: ${backupPath}`);
    }
  }

  /**
   * Apply overwrite resolution
   */
  private async applyOverwrite(conflict: AgentConflict, chosenSource: ConflictSource): Promise<void> {
    const content = await readFile(chosenSource.path, 'utf8');
    
    // Update all conflicting locations with chosen content
    for (const source of conflict.sources) {
      if (source.path !== chosenSource.path) {
        await writeFile(source.path, content);
        console.log(`✅ Applied resolution to ${source.path}`);
      }
    }
  }

  /**
   * Apply merge resolution
   */
  private async applyMerge(conflict: AgentConflict, mergedAgent: Agent): Promise<void> {
    // This would serialize and write the merged agent to all locations
    // Implementation would depend on agent serialization format
    console.log(`✅ Would apply merged agent for ${conflict.agentName}`);
  }

  /**
   * Create files for manual resolution
   */
  private async createManualResolutionFiles(conflict: AgentConflict): Promise<void> {
    const conflictDir = join(homedir(), '.claude', 'conflicts');
    await mkdir(conflictDir, { recursive: true });
    
    const conflictFile = join(conflictDir, `${conflict.agentName}-conflict.md`);
    
    const conflictContent = [
      `# Conflict Resolution Required: ${conflict.agentName}`,
      ``,
      `**Type:** ${conflict.type}`,
      `**Description:** ${conflict.description}`,
      `**Severity:** ${conflict.severity}`,
      ``,
      `## Available Sources`,
      ``,
      ...conflict.sources.map((source, index) => [
        `### ${index + 1}. ${source.path}`,
        `- Format: ${source.format}`,
        `- Modified: ${source.lastModified.toISOString()}`,
        `- Location: ${source.isGlobal ? 'Global' : 'Project'}`,
        `- Customized: ${source.isUserCustomized ? 'Yes' : 'No'}`,
        ``,
        `\`\`\`markdown`,
        // Would include actual agent content here
        `[Agent content from ${source.path}]`,
        `\`\`\``,
        ``
      ]).flat()
    ].join('\n');

    await writeFile(conflictFile, conflictContent);
    console.log(`📋 Created conflict resolution file: ${conflictFile}`);
  }

  /**
   * Helper methods
   */
  private groupSourcesByFormat(sources: ConflictSource[]): Map<string, ConflictSource[]> {
    const groups = new Map<string, ConflictSource[]>();
    
    for (const source of sources) {
      if (!groups.has(source.format)) {
        groups.set(source.format, []);
      }
      groups.get(source.format)!.push(source);
    }
    
    return groups;
  }

  private async hasContentDifferences(sources: ConflictSource[]): Promise<boolean> {
    if (sources.length < 2) return false;
    
    const contents = await Promise.all(
      sources.map(async source => {
        try {
          return await readFile(source.path, 'utf8');
        } catch {
          return '';
        }
      })
    );

    // Simple content comparison - could be more sophisticated
    const firstContent = contents[0];
    return contents.some(content => content !== firstContent);
  }

  private async logConflict(conflict: AgentConflict): Promise<void> {
    if (!this.options.auditTrail) return;
    
    await this.ensureAuditFile();
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'conflict_detected',
      agentName: conflict.agentName,
      conflictType: conflict.type,
      severity: conflict.severity,
      sourceCount: conflict.sources.length,
      sources: conflict.sources.map(s => ({ path: s.path, format: s.format }))
    };

    await this.appendToAuditLog(logEntry);
  }

  private async logResolution(conflict: AgentConflict, resolution: Resolution): Promise<void> {
    if (!this.options.auditTrail) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'conflict_resolved',
      agentName: conflict.agentName,
      action: resolution.action,
      explanation: resolution.explanation,
      preserveCustomizations: resolution.preserveCustomizations,
      chosenSource: resolution.chosenSource?.path
    };

    await this.appendToAuditLog(logEntry);
  }

  private async logResolutionApplication(conflict: AgentConflict, resolution: Resolution): Promise<void> {
    if (!this.options.auditTrail) return;
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: 'resolution_applied',
      agentName: conflict.agentName,
      action: resolution.action,
      affectedFiles: conflict.sources.map(s => s.path)
    };

    await this.appendToAuditLog(logEntry);
  }

  private async ensureAuditFile(): Promise<void> {
    const auditDir = join(this.auditFile, '..');
    await mkdir(auditDir, { recursive: true });
    
    if (!existsSync(this.auditFile)) {
      await writeFile(this.auditFile, '');
    }
  }

  private async appendToAuditLog(entry: any): Promise<void> {
    const logLine = JSON.stringify(entry) + '\n';
    const { appendFile } = await import("node:fs/promises");
    await appendFile(this.auditFile, logLine);
  }
}

/**
 * Utility function to check for conflicts in a set of agents
 */
export async function checkForConflicts(
  agentSources: Map<string, ConflictSource[]>,
  options?: ConflictResolutionOptions
): Promise<Map<string, AgentConflict[]>> {
  const resolver = new ConflictResolver(options);
  const conflicts = new Map<string, AgentConflict[]>();

  for (const [agentName, sources] of agentSources) {
    const agentConflicts = await resolver.detectConflicts(agentName, sources);
    if (agentConflicts.length > 0) {
      conflicts.set(agentName, agentConflicts);
    }
  }

  return conflicts;
}

/**
 * Batch resolve all conflicts for a set of agents
 */
export async function resolveAllConflicts(
  conflicts: Map<string, AgentConflict[]>,
  options?: ConflictResolutionOptions
): Promise<Map<string, Resolution[]>> {
  const resolver = new ConflictResolver(options);
  const resolutions = new Map<string, Resolution[]>();

  for (const [agentName, agentConflicts] of conflicts) {
    const agentResolutions: Resolution[] = [];
    
    for (const conflict of agentConflicts) {
      const resolution = await resolver.resolveAgentConflict(conflict);
      await resolver.applyResolution(conflict, resolution);
      agentResolutions.push(resolution);
    }
    
    resolutions.set(agentName, agentResolutions);
  }

  return resolutions;
}