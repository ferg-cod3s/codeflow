import { getCodeflowRoot } from './src/utils/path-resolver.js';
import { join, existsSync } from 'node:path';
import { readdir } from 'node:fs/promises';

console.log('CodeFlow Root:', getCodeflowRoot());

const commandDir = join(getCodeflowRoot(), 'command');
const baseAgentsDir = join(getCodeflowRoot(), 'base-agents');
const baseSkillsDir = join(getCodeflowRoot(), 'base-skills');

console.log('Command dir exists:', existsSync(commandDir), commandDir);
console.log('Base agents dir exists:', existsSync(baseAgentsDir), baseAgentsDir);
console.log('Base skills dir exists:', existsSync(baseSkillsDir), baseSkillsDir);

if (existsSync(commandDir)) {
  const files = await readdir(commandDir);
  console.log('Command files:', files.length, files);
}

if (existsSync(baseAgentsDir)) {
  const files = await readdir(baseAgentsDir);
  console.log('Base agents files:', files.length, files.slice(0, 5));
}

if (existsSync(baseSkillsDir)) {
  const files = await readdir(baseSkillsDir);
  console.log('Base skills files:', files.length, files.slice(0, 5));
}
