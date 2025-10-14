#!/usr/bin/env node

import { existsSync } from 'fs';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { homedir, platform } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, type = 'info') {
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✅${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    error: `${colors.red}❌${colors.reset}`,
    step: `${colors.cyan}→${colors.reset}`,
  };

  console.log(`${prefix[type] || prefix.info} ${message}`);
}

// Get Claude Desktop config path based on platform
function getClaudeConfigPath() {
  const home = homedir();
  const plat = platform();

  switch (plat) {
    case 'darwin': // macOS
      return join(home, 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
    case 'win32': // Windows
      return join(
        process.env.APPDATA || join(home, 'AppData', 'Roaming'),
        'Claude',
        'claude_desktop_config.json'
      );
    default: // Linux
      return join(home, '.config', 'Claude', 'claude_desktop_config.json');
  }
}

// Get OpenCode config path
function _getOpenCodeConfigPath() {
  const home = homedir();
  return join(home, '.config', 'opencode', 'config.json');
}

// Install MCP for Claude Desktop
async function installClaudeMCP() {
  log('Installing MCP for Claude Desktop...', 'info');

  const configPath = getClaudeConfigPath();
  const configDir = dirname(configPath);

  // Create directory if it doesn't exist
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
    log(`Created config directory: ${configDir}`, 'step');
  }

  // Read existing config or create new one
  let config = {};
  if (existsSync(configPath)) {
    try {
      const content = await readFile(configPath, 'utf-8');
      config = JSON.parse(content);
      log('Found existing Claude Desktop configuration', 'step');
    } catch (_error) {
      log('Creating new Claude Desktop configuration', 'warning');
      config = {};
    }
  }

  // Ensure mcpServers exists
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  // Add codeflow MCP server
  const serverPath = join(projectRoot, 'mcp', 'codeflow-server.mjs');

  config.mcpServers['codeflow-tools'] = {
    command: 'bun',
    args: ['run', serverPath],
    env: {},
  };

  // Save configuration
  await writeFile(configPath, JSON.stringify(config, null, 2));

  log(`Claude Desktop MCP configured at: ${configPath}`, 'success');
  log('Configuration details:', 'info');
  log(`  Server: codeflow-tools`, 'step');
  log(`  Command: bun run ${serverPath}`, 'step');
  log('', 'info');
  log('Next steps for Claude Desktop:', 'info');
  log('  1. Restart Claude Desktop application', 'step');
  log('  2. Navigate to your project directory', 'step');
  log('  3. The MCP tools will be available automatically', 'step');

  return true;
}

// Install for OpenCode (just verify structure)
async function installOpenCodeSetup() {
  log('Setting up OpenCode integration...', 'info');

  const home = homedir();
  const globalOpenCodeDir = join(home, '.config', 'opencode');
  const globalAgentDir = join(globalOpenCodeDir, 'agent');
  const globalCommandDir = join(globalOpenCodeDir, 'command');

  // Create directories if they don't exist
  if (!existsSync(globalAgentDir)) {
    await mkdir(globalAgentDir, { recursive: true });
    log(`Created global agent directory: ${globalAgentDir}`, 'step');
  }

  if (!existsSync(globalCommandDir)) {
    await mkdir(globalCommandDir, { recursive: true });
    log(`Created global command directory: ${globalCommandDir}`, 'step');
  }

  // Check if agents and commands are synced
  const { readdirSync } = await import('fs');
  const agentCount = readdirSync(globalAgentDir).filter((f) => f.endsWith('.md')).length;
  const commandCount = readdirSync(globalCommandDir).filter((f) => f.endsWith('.md')).length;

  log(`Found ${agentCount} agents in ${globalAgentDir}`, 'info');
  log(`Found ${commandCount} commands in ${globalCommandDir}`, 'info');

  if (agentCount === 0 || commandCount === 0) {
    log('', 'warning');
    log('No agents or commands found in global OpenCode directories!', 'warning');
    log('Run the following to sync agents and commands:', 'info');
    log('  codeflow sync --global', 'step');
  } else {
    log('', 'success');
    log('OpenCode setup is complete!', 'success');
    log(`  ✓ ${agentCount} agents installed`, 'step');
    log(`  ✓ ${commandCount} commands installed`, 'step');
  }

  log('', 'info');
  log('Next steps for OpenCode:', 'info');
  log('  1. Ensure OpenCode is installed', 'step');
  log('  2. The agents and commands are now available globally', 'step');
  log('  3. Use them in any project with OpenCode', 'step');

  return true;
}

// Install for Warp Terminal
async function installWarpMCP() {
  log('Installing MCP for Warp Terminal...', 'info');

  const home = homedir();
  const plat = platform();
  let configPath;

  switch (plat) {
    case 'darwin': // macOS
      configPath = join(home, '.warp', 'mcp_config.json');
      break;
    case 'win32': // Windows
      configPath = join(
        process.env.APPDATA || join(home, 'AppData', 'Roaming'),
        'Warp',
        'mcp_config.json'
      );
      break;
    default: // Linux
      configPath = join(home, '.config', 'warp', 'mcp_config.json');
  }

  const configDir = dirname(configPath);

  // Create directory if it doesn't exist
  if (!existsSync(configDir)) {
    await mkdir(configDir, { recursive: true });
    log(`Created config directory: ${configDir}`, 'step');
  }

  // Read existing config or create new one
  let config = {};
  if (existsSync(configPath)) {
    try {
      const content = await readFile(configPath, 'utf-8');
      config = JSON.parse(content);
      log('Found existing Warp configuration', 'step');
    } catch (_error) {
      log('Creating new Warp configuration', 'warning');
      config = {};
    }
  }

  // Ensure mcpServers exists
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  // Add codeflow MCP server
  const serverPath = join(projectRoot, 'mcp', 'codeflow-server.mjs');

  config.mcpServers['codeflow-tools'] = {
    name: 'Codeflow Tools',
    command: 'bun',
    args: ['run', serverPath],
    env: {},
    description: 'Codeflow workflow automation tools',
  };

  // Save configuration
  await writeFile(configPath, JSON.stringify(config, null, 2));

  log(`Warp MCP configured at: ${configPath}`, 'success');
  log('', 'info');
  log('Next steps for Warp:', 'info');
  log('  1. Open Warp Settings → AI → Tools (MCP)', 'step');
  log('  2. Click "Reload" or restart Warp', 'step');
  log('  3. Navigate to your project directory', 'step');
  log('  4. Use Warp AI with codeflow tools', 'step');

  return true;
}

// Main installation function
async function main() {
  console.log(
    `${colors.bright}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.cyan}     Codeflow MCP Installation & Setup${colors.reset}`
  );
  console.log(
    `${colors.bright}${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`
  );
  console.log('');

  const args = process.argv.slice(2);
  const target = args[0] || 'all';

  try {
    switch (target) {
      case 'claude':
      case 'claude-desktop':
        await installClaudeMCP();
        break;

      case 'opencode':
        await installOpenCodeSetup();
        break;

      case 'warp':
        await installWarpMCP();
        break;

      case 'all':
        log('Installing MCP for all supported clients...', 'info');
        console.log('');

        // Install for Claude Desktop
        console.log(`${colors.bright}→ Claude Desktop${colors.reset}`);
        await installClaudeMCP();
        console.log('');

        // Install for OpenCode
        console.log(`${colors.bright}→ OpenCode${colors.reset}`);
        await installOpenCodeSetup();
        console.log('');

        // Install for Warp
        console.log(`${colors.bright}→ Warp Terminal${colors.reset}`);
        await installWarpMCP();
        console.log('');

        log('All MCP installations completed!', 'success');
        break;

      default:
        log(`Unknown target: ${target}`, 'error');
        console.log('');
        console.log('Usage: bun run scripts/install-mcp.js [target]');
        console.log('');
        console.log('Targets:');
        console.log('  all           - Install for all supported clients (default)');
        console.log('  claude        - Install for Claude Desktop only');
        console.log('  opencode      - Set up for OpenCode only');
        console.log('  warp          - Install for Warp Terminal only');
        process.exit(1);
    }

    console.log('');
    console.log(
      `${colors.bright}${colors.green}═══════════════════════════════════════════════════${colors.reset}`
    );
    console.log(`${colors.bright}${colors.green}     Installation Complete!${colors.reset}`);
    console.log(
      `${colors.bright}${colors.green}═══════════════════════════════════════════════════${colors.reset}`
    );
  } catch (error) {
    log(`Installation failed: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  }
}

// Run the installer
main().catch(console.error);
