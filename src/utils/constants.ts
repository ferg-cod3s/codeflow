import * as path from 'path';
import * as os from 'os';

/**
 * Global OpenCode directory path
 * Used for user-wide agent/command/skill installation
 */
export const OPENCODE_GLOBAL_DIR = path.join(os.homedir(), '.config', 'opencode');

/**
 * Local OpenCode directory name
 * Used for project-specific agent/command/skill installation
 */
export const OPENCODE_LOCAL_DIR = '.opencode';