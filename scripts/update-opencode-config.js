#!/usr/bin/env node

import { readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';

const configPath = `${homedir()}/.config/opencode/opencode.json`;

try {
  const config = JSON.parse(await readFile(configPath, 'utf8'));

  // Add agent and command configuration
  config.agents = {
    enabled: true,
    directories: [`${homedir()}/.config/opencode/agent`, './.opencode/agent'],
  };

  config.commands = {
    enabled: true,
    directories: [`${homedir()}/.config/opencode/command`, './.opencode/command'],
  };

  await writeFile(configPath, JSON.stringify(config, null, 2));
  console.log('✅ Updated opencode.json with agent and command configuration');
} catch (error) {
  console.error('❌ Failed to update opencode.json:', error.message);
  process.exit(1);
}
