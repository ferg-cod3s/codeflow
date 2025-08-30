import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import yaml from 'js-yaml';

const agentDir = path.join(process.cwd(), 'agent');
const opencodeDir = path.join(agentDir, 'opencode');
const requiredKeys = ['description', 'mode', 'model', 'temperature', 'tools'];
const defaultTools = {
  read: true, grep: true, glob: true, list: true,
  bash: false, edit: false, write: false, patch: false,
  webfetch: false, todoread: false, todowrite: false
};

// Process main agent directory
for (const name of fs.readdirSync(agentDir)) {
  if (!name.endsWith('.md') || name === 'opencode') continue;
  const p = path.join(agentDir, name);
  processAgentFile(p, `agent/${name}`);
}

// Process opencode subdirectory
for (const name of fs.readdirSync(opencodeDir)) {
  if (!name.endsWith('.md')) continue;
  const p = path.join(opencodeDir, name);
  processAgentFile(p, `agent/opencode/${name}`);
}

function processAgentFile(p, displayPath) {
  let raw = fs.readFileSync(p, 'utf8');

  // Strip BOM and leading whitespace
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  raw = raw.replace(/^\s+/, '');

  let parsed;
  try {
    parsed = matter(raw, {
      engines: { 
        yaml: {
          parse: s => (yaml.load(s) ?? {}),
          stringify: s => yaml.dump(s, { lineWidth: 120 })
        }
      }
    });
  } catch (err) {
    console.log(`Skipping ${displayPath} due to YAML parsing error: ${err.message}`);
    return;
  }

  const data = { ...(parsed.data || {}) };

  if (!('description' in data)) data.description = 'TODO: add a short description for this agent.';
  if (!('mode' in data)) data.mode = 'subagent';
  if (!('model' in data)) data.model = 'anthropic/claude-3.5-sonnet';
  if (!('temperature' in data)) data.temperature = 0.1;

  if (!('tools' in data) || typeof data.tools !== 'object' || Array.isArray(data.tools)) {
    data.tools = { ...defaultTools };
  } else {
    // Ensure expected keys exist; preserve existing tool flags
    data.tools = { ...defaultTools, ...data.tools };
  }

  const updated = matter.stringify(parsed.content, data, {
    engines: { 
      yaml: {
        parse: yaml.load,
        stringify: s => yaml.dump(s, { lineWidth: 120 })
      }
    }
  });

  // Ensure file literally starts with '---'
  const finalText = updated.replace(/^\s+/, '');
  if (!finalText.startsWith('---')) {
    throw new Error(`Frontmatter did not serialize correctly for ${displayPath}`);
  }

  fs.writeFileSync(p, finalText, 'utf8');
  console.log(`Fixed: ${displayPath}`);
}