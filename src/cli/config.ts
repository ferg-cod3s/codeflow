import { join } from "node:path";
import { existsSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolveProjectPath } from "./utils";

interface AgenticConfig {
  thoughts: string;
  agents: {
    model: string;
  };
}

function getDefaultConfig(): AgenticConfig {
  return {
    thoughts: "thoughts",
    agents: {
      model: "opencode/grok-code"
    }
  };
}

async function readConfig(projectPath: string): Promise<AgenticConfig> {
  const configPath = join(projectPath, ".opencode", "agentic.json");

  if (!existsSync(configPath)) {
    return getDefaultConfig();
  }

  try {
    const configContent = await readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    // Merge with defaults to ensure all fields exist
    return {
      thoughts: config.thoughts || "thoughts",
      agents: {
        model: config.agents?.model || "opencode/grok-code"
      }
    };
  } catch (error) {
    console.warn(`Warning: Could not read config file at ${configPath}, using defaults`);
    return getDefaultConfig();
  }
}

function writeConfig(projectPath: string, config: AgenticConfig): void {
  const opencodeDir = join(projectPath, ".opencode");
  const configPath = join(opencodeDir, "agentic.json");

  // Ensure .opencode directory exists
  if (!existsSync(opencodeDir)) {
    throw new Error(`No .opencode directory found at ${opencodeDir}. Run 'agentic init' first.`);
  }

  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function setNestedValue(obj: any, path: string, value: string): void {
  const keys = path.split('.');
  let current = obj;

  // Handle special case: "agent.model" should map to "agents.model"
  if (keys[0] === 'agent' && keys[1] === 'model') {
    keys[0] = 'agents';
  }

  // Navigate to the parent of the target property
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }

  // Set the final value
  const finalKey = keys[keys.length - 1];
  current[finalKey] = value;
}

function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.');

  // Handle special case: "agent.model" should map to "agents.model"
  if (keys[0] === 'agent' && keys[1] === 'model') {
    keys[0] = 'agents';
  }

  let current = obj;
  for (const key of keys) {
    if (!(key in current)) {
      return undefined;
    }
    current = current[key];
  }

  return typeof current === 'string' ? current : undefined;
}

export async function config(projectPath: string | undefined, key?: string, value?: string): Promise<void> {
  // Resolve the project path
  const resolvedProjectPath = resolveProjectPath(projectPath);

  const currentConfig = await readConfig(resolvedProjectPath);

  if (!key) {
    // No key provided, show current config
    console.log("Current configuration:");
    console.log(JSON.stringify(currentConfig, null, 2));
    return;
  }

  if (!value) {
    // Key provided but no value, show current value
    const currentValue = getNestedValue(currentConfig, key);
    if (currentValue === undefined) {
      console.log(`Configuration key '${key}' not found`);
    } else {
      console.log(`${key}: ${currentValue}`);
    }
    return;
  }

  // Set the new value
  setNestedValue(currentConfig, key, value);
  writeConfig(resolvedProjectPath, currentConfig);

  console.log(`✅ Set ${key} = ${value}`);
}
