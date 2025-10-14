import { join } from "node:path";
import { existsSync, writeFileSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolveProjectPath } from "./utils";

// Agentic CLI configuration
// Note: agents.model is OPTIONAL. If omitted, downstream generators will not
// write a model field and will defer to platform presets/defaults instead.
// Supplying a value enables explicit model pinning (validated against
// config/opencode-models.json if present).
interface AgenticConfig {
  thoughts: string;
  agents: {
    model?: string;
  };
}

function getDefaultConfig(): AgenticConfig {
  return {
    thoughts: "thoughts",
    agents: {
      // Intentionally no default model. Leaving this empty allows
      // platform-specific defaults/presets to apply.
    }
  };
}

/**
 * Load OpenCode model allowlist from config/opencode-models.json if present.
 * Accepts either an array of strings or an object { models: string[] }.
 * Returns Set of allowed models, null if file missing, or throws nothing (logs warnings) on parse error.
 */
function loadOpenCodeModelAllowlist(): Set<string> | null {
  try {
    const allowlistPath = join(process.cwd(), 'config', 'opencode-models.json');
    if (!existsSync(allowlistPath)) return null;
    const raw = readFileSync(allowlistPath, 'utf-8');
    const parsed = JSON.parse(raw);
    let models: string[] | undefined;
    if (Array.isArray(parsed)) {
      models = parsed as string[];
    } else if (parsed && Array.isArray(parsed.models)) {
      models = parsed.models as string[];
    }
    if (!models) {
      console.warn('config/opencode-models.json present but not an array or {"models": []}. Ignoring.');
      return null;
    }
    return new Set(models.filter((m) => typeof m === 'string'));
  } catch (err) {
    console.warn('Failed to load config/opencode-models.json. Proceeding without enforcement.', err);
    return null;
  }
}

async function readConfig(projectPath: string): Promise<AgenticConfig> {
  const configPath = join(projectPath, ".opencode", "agentic.json");

  if (!existsSync(configPath)) {
    return getDefaultConfig();
  }

  try {
    const configContent = await readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    const allowlist = loadOpenCodeModelAllowlist();
    let model: string | undefined = config.agents?.model;
    if (allowlist && model && !allowlist.has(model)) {
      console.warn(
        `Warning: Model '${model}' is not allowed by config/opencode-models.json. The value will be ignored.\n` +
        `To use a custom model, add it to config/opencode-models.json or choose an allowed model.`
      );
      model = undefined;
    }

    // Merge with defaults to ensure top-level fields exist; omit model if undefined
    return {
      thoughts: config.thoughts || "thoughts",
      agents: {
        ...(model ? { model } : {})
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

  // Validate model value against allowlist if setting agents.model (or alias agent.model)
  if (key === 'agents.model' || key === 'agent.model') {
    const allowlist = loadOpenCodeModelAllowlist();
    if (allowlist && !allowlist.has(value)) {
      console.error(
        `❌ Model '${value}' is not allowed. It must be one of the models in config/opencode-models.json.`
      );
      return;
    }
  }

  // Set the new value
  setNestedValue(currentConfig, key, value);
  writeConfig(resolvedProjectPath, currentConfig);

  console.log(`✅ Set ${key} = ${value}`);
}
