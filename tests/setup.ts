/**
 * Test setup and utilities
 */

import { beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { rm, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

// Test directories
export const TEST_DIR = join(process.cwd(), '.test-tmp');
export const TEST_CATALOG = join(TEST_DIR, 'catalog');
export const TEST_OUTPUT = join(TEST_DIR, 'output');
export const TEST_CACHE = join(TEST_DIR, 'cache');

// Test utilities
export const testPaths = {
  agents: {
    claude: join(process.cwd(), '.claude', 'agents'),
    opencode: join(process.cwd(), '.opencode', 'agent'),
    source: join(process.cwd(), 'codeflow-agents')
  },
  commands: {
    claude: join(process.cwd(), '.claude', 'commands'), 
    opencode: join(process.cwd(), 'command'),
    source: join(process.cwd(), 'codeflow-commands')
  },
  mcp: {
    claude: join(process.cwd(), 'mcp-servers', 'claude'),
    warp: join(process.cwd(), 'mcp-servers', 'warp')
  }
};

// Global setup
export async function setupTests() {
  console.log('🧪 Setting up test environment...');
  
  // Create test directories
  await mkdir(TEST_DIR, { recursive: true });
  await mkdir(TEST_CATALOG, { recursive: true });
  await mkdir(TEST_OUTPUT, { recursive: true });
  await mkdir(TEST_CACHE, { recursive: true });
  
  // Set test environment variables
  process.env.NODE_ENV = 'test';
  process.env.TEST_MODE = 'true';
  process.env.CODEFLOW_TEST_DIR = TEST_DIR;
}

// Global cleanup
export async function cleanupTests() {
  console.log('🧹 Cleaning up test environment...');
  
  // Remove test directories
  if (existsSync(TEST_DIR)) {
    await rm(TEST_DIR, { recursive: true, force: true });
  }
}

// Test helpers
export function createMockAgent(name: string, format: 'claude' | 'opencode') {
  const baseAgent = {
    name,
    description: `Test ${name} agent`,
    model: format === 'claude' ? 'claude-3-5-sonnet-20241022' : 'anthropic/claude-3-5-sonnet-20241022',
    temperature: 0.7,
    category: 'test'
  };
  
  if (format === 'opencode') {
    return {
      ...baseAgent,
      mode: 'subagent',
      primary_objective: `Test objective for ${name}`,
      anti_objectives: ['Do harmful things'],
      tools: {
        read: true,
        list: true,
        grep: true,
        edit: false,
        write: false,
        bash: false,
        webfetch: false
      },
      permission: {
        read: 'allow',
        list: 'allow', 
        grep: 'allow',
        edit: 'deny',
        write: 'deny',
        bash: 'deny',
        webfetch: 'deny'
      }
    };
  }
  
  return baseAgent;
}

export function createMockCommand(name: string, format: 'claude' | 'opencode') {
  const baseCommand = {
    name,
    description: `Test ${name} command`,
    model: format === 'claude' ? 'claude-3-5-sonnet-20241022' : 'anthropic/claude-3-5-sonnet-20241022',
    temperature: 0.2,
    category: 'test'
  };
  
  if (format === 'opencode') {
    return {
      ...baseCommand,
      mode: 'command',
      params: {
        required: [],
        optional: []
      }
    };
  }
  
  return baseCommand;
}

// Async test helpers
export async function waitForFile(path: string, timeout = 5000): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (existsSync(path)) return true;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
}

export async function retryAsync<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry failed');
}