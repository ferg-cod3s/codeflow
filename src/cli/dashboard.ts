#!/usr/bin/env bun

import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { DashboardDisplay } from './display/dashboard-display.js';
import { getTheme } from './themes/theme-manager.js';
import type { DashboardData } from './display/dashboard-display.js';

/**
 * Interactive Dashboard Command
 * Provides real-time monitoring and management of Codeflow operations
 */

export async function dashboard(projectPath?: string) {
  const resolvedPath = projectPath || process.cwd();
  const display = new DashboardDisplay(getTheme(), 120);

  // Gather dashboard data
  const dashboardData = await gatherDashboardData(resolvedPath);

  // Render dashboard
  console.clear();
  console.log(display.render(dashboardData));

  // TODO: Add interactive mode with key bindings for real-time updates
  // For now, just display static dashboard
}

/**
 * Gather comprehensive dashboard data
 */
async function gatherDashboardData(projectPath: string): Promise<DashboardData> {
  const alerts: DashboardData['alerts'] = [];
  const metrics: DashboardData['metrics'] = [];
  const sections: DashboardData['sections'] = [];

  // Check project health
  const projectHealth = await checkProjectHealth(projectPath);
  if (projectHealth.issues.length > 0) {
    alerts.push(
      ...projectHealth.issues.map((issue) => ({
        type: issue.severity as 'error' | 'warning' | 'info',
        message: issue.message,
        timestamp: new Date(),
      }))
    );
  }

  // Gather metrics
  metrics.push(
    {
      label: 'Agents Available',
      value: await countAgents(projectPath),
      status: 'success',
    },
    {
      label: 'Commands Active',
      value: await countCommands(projectPath),
      status: 'success',
    },
    {
      label: 'Sync Status',
      value: projectHealth.isSynced ? 'Synced' : 'Outdated',
      status: projectHealth.isSynced ? 'success' : 'warning',
    }
  );

  // Add sections
  sections.push(
    {
      title: 'Project Overview',
      content: `Path: ${projectPath}\nStatus: ${projectHealth.isSynced ? '✅ Synchronized' : '⚠️ Needs sync'}\nLast Check: ${new Date().toLocaleTimeString()}`,
      priority: 'high',
      status: projectHealth.isSynced ? 'success' : 'warning',
    },
    {
      title: 'Available Actions',
      content: [
        '• codeflow sync - Update agents and commands',
        '• codeflow status - Check detailed synchronization status',
        '• codeflow catalog list - Browse available extensions',
        '• codeflow research "<query>" - Start AI-assisted research',
        '• codeflow setup - Initialize project with agents',
      ].join('\n'),
      priority: 'medium',
    }
  );

  // Add workflow section if agents are running
  const workflowData = await getWorkflowStatus(projectPath);
  if (workflowData.nodes && workflowData.nodes.length > 0) {
    sections.push({
      title: 'Active Workflows',
      content: `${workflowData.nodes.length} agents currently active`,
      priority: 'high',
      status: workflowData.nodes.some((n: any) => n.status === 'error')
        ? 'error'
        : ('info' as const),
    });
  }

  return {
    title: 'Codeflow Dashboard',
    sections,
    metrics,
    alerts,
    workflow: workflowData.nodes.length > 0 ? workflowData : undefined,
  };
}

/**
 * Check project health and synchronization status
 */
async function checkProjectHealth(projectPath: string) {
  const issues: Array<{ severity: 'error' | 'warning' | 'info'; message: string }> = [];
  let isSynced = true;

  // Check for required directories
  const requiredDirs = ['.claude', '.opencode'];
  for (const dir of requiredDirs) {
    if (!existsSync(join(projectPath, dir))) {
      issues.push({
        severity: 'warning',
        message: `Missing ${dir} directory - run 'codeflow setup' to initialize`,
      });
      isSynced = false;
    }
  }

  // Check for codeflow-agents source
  const codeflowRoot = join(import.meta.dir, '../..');
  if (!existsSync(join(codeflowRoot, 'codeflow-agents'))) {
    issues.push({
      severity: 'error',
      message: 'Codeflow agents source not found - CLI may be corrupted',
    });
  }

  return { isSynced, issues };
}

/**
 * Count available agents
 */
async function countAgents(projectPath: string): Promise<number> {
  const codeflowRoot = join(import.meta.dir, '../..');
  const sourceDir = join(codeflowRoot, 'codeflow-agents');

  if (!existsSync(sourceDir)) return 0;

  try {
    const entries = await readdir(sourceDir, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).length;
  } catch {
    return 0;
  }
}

/**
 * Count available commands
 */
async function countCommands(projectPath: string): Promise<number> {
  const codeflowRoot = join(import.meta.dir, '../..');
  const commandDir = join(codeflowRoot, 'command');

  if (!existsSync(commandDir)) return 0;

  try {
    const files = await readdir(commandDir);
    return files.filter((file) => file.endsWith('.md')).length;
  } catch {
    return 0;
  }
}

/**
 * Get current workflow status (mock data for now)
 */
async function getWorkflowStatus(projectPath: string) {
  // TODO: Implement actual workflow monitoring
  // For now, return empty workflow
  return {
    nodes: [],
    connections: [],
  };
}
