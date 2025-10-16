#!/usr/bin/env bun

import { serve } from 'bun';
import { join } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

/**
 * Web Dashboard Server
 * Provides a modern web interface for Codeflow management
 */

interface DashboardConfig {
  port?: number;
  hostname?: string;
  theme?: string;
}

export async function startDashboardServer(config: DashboardConfig = {}) {
  const port = config.port || 3001;
  const hostname = config.hostname || 'localhost';

  console.log(`🚀 Starting Codeflow Web Dashboard on http://${hostname}:${port}`);

  const server = serve({
    port,
    hostname,
    async fetch(request: Request) {
      const url = new URL(request.url);

      // API endpoints
      if (url.pathname.startsWith('/api/')) {
        return handleApiRequest(request, url);
      }

      // Static files
      if (url.pathname === '/' || url.pathname === '/index.html') {
        return serveHtml();
      }

      if (url.pathname === '/dashboard.js') {
        return serveJavaScript();
      }

      if (url.pathname === '/dashboard.css') {
        return serveCss();
      }

      // 404
      return new Response('Not Found', { status: 404 });
    },
  });

  console.log(`✅ Dashboard available at http://${hostname}:${port}`);
  console.log(`📊 API endpoints available at http://${hostname}:${port}/api/*`);

  return server;
}

/**
 * Handle API requests
 */
async function handleApiRequest(request: Request, url: URL): Promise<Response> {
  const path = url.pathname.replace('/api', '');

  switch (path) {
    case '/status':
      return new Response(JSON.stringify(await getSystemStatus()), {
        headers: { 'Content-Type': 'application/json' },
      });

    case '/agents':
      return new Response(JSON.stringify(await getAgentsData()), {
        headers: { 'Content-Type': 'application/json' },
      });

    case '/commands':
      return new Response(JSON.stringify(await getCommandsData()), {
        headers: { 'Content-Type': 'application/json' },
      });

    case '/workflows':
      return new Response(JSON.stringify(await getWorkflowsData()), {
        headers: { 'Content-Type': 'application/json' },
      });

    default:
      return new Response(JSON.stringify({ error: 'API endpoint not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
  }
}

/**
 * Serve main HTML page
 */
function serveHtml(): Response {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Codeflow Dashboard</title>
    <link rel="stylesheet" href="/dashboard.css">
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 dark:bg-gray-900">
    <div id="app" class="min-h-screen">
        <header class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between items-center py-4">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Codeflow</h1>
                        </div>
                        <div class="ml-4">
                            <span class="text-sm text-gray-500 dark:text-gray-400">AI Workflow Management</span>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div id="status-indicator" class="flex items-center">
                            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Connected</span>
                        </div>
                    </div>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                                <span class="text-white text-sm font-semibold">A</span>
                            </div>
                        </div>
                        <div class="ml-4">
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Agents</dt>
                            <dd id="agents-count" class="text-2xl font-semibold text-gray-900 dark:text-white">--</dd>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                                <span class="text-white text-sm font-semibold">C</span>
                            </div>
                        </div>
                        <div class="ml-4">
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Commands</dt>
                            <dd id="commands-count" class="text-2xl font-semibold text-gray-900 dark:text-white">--</dd>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                                <span class="text-white text-sm font-semibold">W</span>
                            </div>
                        </div>
                        <div class="ml-4">
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Workflows</dt>
                            <dd id="workflows-count" class="text-2xl font-semibold text-gray-900 dark:text-white">--</dd>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                                <span class="text-white text-sm font-semibold">P</span>
                            </div>
                        </div>
                        <div class="ml-4">
                            <dt class="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Projects</dt>
                            <dd id="projects-count" class="text-2xl font-semibold text-gray-900 dark:text-white">--</dd>
                        </div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
                    </div>
                    <div id="activity-list" class="p-6">
                        <div class="animate-pulse space-y-4">
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white">Quick Actions</h3>
                    </div>
                    <div class="p-6">
                        <div class="grid grid-cols-2 gap-4">
                            <button onclick="runCommand('setup')" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                Setup Project
                            </button>
                            <button onclick="runCommand('sync')" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                Sync Agents
                            </button>
                            <button onclick="runCommand('status')" class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                Check Status
                            </button>
                            <button onclick="runCommand('catalog list')" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                Browse Catalog
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-lg font-medium text-gray-900 dark:text-white">Terminal Output</h3>
                </div>
                <div id="terminal-output" class="p-6 bg-gray-900 text-green-400 font-mono text-sm min-h-64">
                    <div id="terminal-content">
                        Welcome to Codeflow Dashboard. Click "Quick Actions" to get started.
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script src="/dashboard.js"></script>
</body>
</html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}

/**
 * Serve JavaScript
 */
function serveJavaScript(): Response {
  const js = `
// Dashboard JavaScript
let terminalContent = '';

async function init() {
    await loadDashboardData();
    setInterval(loadDashboardData, 5000); // Refresh every 5 seconds
}

async function loadDashboardData() {
    try {
        const [status, agents, commands, workflows] = await Promise.all([
            fetch('/api/status').then(r => r.json()),
            fetch('/api/agents').then(r => r.json()),
            fetch('/api/commands').then(r => r.json()),
            fetch('/api/workflows').then(r => r.json())
        ]);

        updateMetrics(status);
        updateActivity(status.recentActivity || []);
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

function updateMetrics(data) {
    document.getElementById('agents-count').textContent = data.agents || '--';
    document.getElementById('commands-count').textContent = data.commands || '--';
    document.getElementById('workflows-count').textContent = data.workflows || '--';
    document.getElementById('projects-count').textContent = data.projects || '--';
}

function updateActivity(activities) {
    const activityList = document.getElementById('activity-list');
    if (activities.length === 0) {
        activityList.innerHTML = '<p class="text-gray-500 dark:text-gray-400">No recent activity</p>';
        return;
    }

    activityList.innerHTML = activities.map(activity => \`
        <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
                <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900 dark:text-white truncate">\${activity.message}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">\${new Date(activity.timestamp).toLocaleTimeString()}</p>
            </div>
        </div>
    \`).join('');
}

async function runCommand(command) {
    const terminalOutput = document.getElementById('terminal-content');
    terminalContent += \`\\n$ codeflow \${command}\\n\`;
    terminalOutput.textContent = terminalContent;

    try {
        // In a real implementation, this would call the actual CLI
        // For now, just simulate the command execution
        terminalContent += \`Executing: codeflow \${command}...\\n\`;
        terminalOutput.textContent = terminalContent;

        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 1000));

        terminalContent += \`✅ Command completed successfully\\n\`;
        terminalOutput.textContent = terminalContent;

        // Refresh dashboard data
        await loadDashboardData();

    } catch (error) {
        terminalContent += \`❌ Command failed: \${error.message}\\n\`;
        terminalOutput.textContent = terminalContent;
    }

    // Auto-scroll to bottom
    const terminalDiv = document.getElementById('terminal-output');
    terminalDiv.scrollTop = terminalDiv.scrollHeight;
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', init);
`;

  return new Response(js, {
    headers: { 'Content-Type': 'application/javascript' },
  });
}

/**
 * Serve CSS
 */
function serveCss(): Response {
  const css = `
/* Dashboard Custom Styles */
#terminal-output {
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    line-height: 1.4;
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 1;
    }
    50% {
        opacity: .5;
    }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
    .dark\\:bg-gray-900 {
        background-color: rgb(17 24 39);
    }
}

/* Custom scrollbar for terminal */
#terminal-output::-webkit-scrollbar {
    width: 8px;
}

#terminal-output::-webkit-scrollbar-track {
    background: #1f2937;
}

#terminal-output::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 4px;
}

#terminal-output::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
}
`;

  return new Response(css, {
    headers: { 'Content-Type': 'text/css' },
  });
}

/**
 * Mock data functions (replace with real implementations)
 */
async function getSystemStatus() {
  return {
    agents: 33,
    commands: 15,
    workflows: 2,
    projects: 1,
    recentActivity: [
      { message: 'Agent synchronized successfully', timestamp: new Date() },
      { message: 'New command added to catalog', timestamp: new Date(Date.now() - 300000) },
      { message: 'Workflow completed', timestamp: new Date(Date.now() - 600000) },
    ],
  };
}

async function getAgentsData() {
  return { agents: [] };
}

async function getCommandsData() {
  return { commands: [] };
}

async function getWorkflowsData() {
  return { workflows: [] };
}
