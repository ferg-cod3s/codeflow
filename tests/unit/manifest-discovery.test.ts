import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { join } from 'node:path';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import {
  findAgentManifest,
  copyAgentManifest,
  discoverAndCopyManifest,
  hasValidManifest,
  type ManifestDiscoveryOptions,
  type ManifestCopyOptions
} from '../../src/utils/manifest-discovery';

describe('Manifest Discovery Utilities', () => {
  let tempDir: string;
  let projectDir: string;
  let codeflowDir: string;
  let manifestContent: string;

  beforeEach(async () => {
    // Create temporary directory structure
    tempDir = join(tmpdir(), `codeflow-test-${Date.now()}`);
    projectDir = join(tempDir, 'my-project');
    codeflowDir = join(tempDir, 'codeflow-repo');

    // Create directories
    await mkdir(projectDir, { recursive: true });
    await mkdir(codeflowDir, { recursive: true });

    // Create sample manifest content
    manifestContent = JSON.stringify({
      canonical_agents: [
        {
          name: 'test-agent',
          description: 'Test agent for unit tests',
          category: 'test',
          sources: {
            base: 'codeflow-agents/test/test-agent.md',
            'claude-code': 'claude-agents/test-agent.md',
            opencode: 'opencode-agents/test-agent.md'
          }
        }
      ],
      total_agents: 1,
      last_updated: new Date().toISOString()
    }, null, 2);

    // Create manifest in codeflow repo
    await writeFile(join(codeflowDir, 'AGENT_MANIFEST.json'), manifestContent);
  });

  afterEach(async () => {
    // Clean up temporary directories
    if (existsSync(tempDir)) {
      await rm(tempDir, { recursive: true, force: true });
    }
  });

  describe('findAgentManifest', () => {
    it('should find manifest in current directory', async () => {
      // Create manifest in project directory
      await writeFile(join(projectDir, 'AGENT_MANIFEST.json'), manifestContent);

      // Change to project directory (simulate process.cwd())
      const originalCwd = process.cwd();
      process.chdir(projectDir);

      try {
        const result = await findAgentManifest();
        expect(result.path.replace('/private', '')).toBe(join(projectDir, 'AGENT_MANIFEST.json').replace('/private', ''));
        expect(result.isLegacy).toBe(false);
        expect(result.level).toBe(0);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should find manifest in parent directory', async () => {
      // Create manifest in project directory (parent of subDir)
      await writeFile(join(projectDir, 'AGENT_MANIFEST.json'), manifestContent);
      
      // Create subdirectory in project
      const subDir = join(projectDir, 'subproject');
      await mkdir(subDir, { recursive: true });

      // Change to subdirectory
      const originalCwd = process.cwd();
      process.chdir(subDir);

      try {
        const result = await findAgentManifest();
        expect(result.path.replace('/private', '')).toBe(join(projectDir, 'AGENT_MANIFEST.json').replace('/private', ''));
        expect(result.isLegacy).toBe(false);
        expect(result.level).toBe(1);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should find legacy manifest location', async () => {
      // Create legacy manifest location
      await mkdir(join(projectDir, '.codeflow'), { recursive: true });
      await writeFile(join(projectDir, '.codeflow', 'AGENT_MANIFEST.json'), manifestContent);

      const originalCwd = process.cwd();
      process.chdir(projectDir);

      try {
        const result = await findAgentManifest();
        expect(result.path.replace('/private', '')).toBe(join(projectDir, '.codeflow', 'AGENT_MANIFEST.json').replace('/private', ''));
        expect(result.isLegacy).toBe(true);
        expect(result.level).toBe(0);
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should throw error when manifest not found', async () => {
      const originalCwd = process.cwd();
      process.chdir(tempDir); // Directory with no manifest

      try {
        await expect(findAgentManifest()).rejects.toThrow('AGENT_MANIFEST.json not found');
      } finally {
        process.chdir(originalCwd);
      }
    });

    it('should respect maxDepth option', async () => {
      const deepDir = join(projectDir, 'level1', 'level2', 'level3');
      await mkdir(deepDir, { recursive: true });

      const originalCwd = process.cwd();
      process.chdir(deepDir);

      try {
        // Should not find manifest beyond maxDepth
        await expect(findAgentManifest({ maxDepth: 2 })).rejects.toThrow('AGENT_MANIFEST.json not found');
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('copyAgentManifest', () => {
    it('should copy manifest successfully', async () => {
      const sourcePath = join(codeflowDir, 'AGENT_MANIFEST.json');
      const destPath = join(projectDir, 'AGENT_MANIFEST.json');

      await copyAgentManifest(sourcePath, destPath);

      expect(existsSync(destPath)).toBe(true);
    });

    it('should throw error for non-existent source', async () => {
      const sourcePath = join(codeflowDir, 'non-existent.json');
      const destPath = join(projectDir, 'AGENT_MANIFEST.json');

      await expect(copyAgentManifest(sourcePath, destPath)).rejects.toThrow('Source manifest not found');
    });

    it('should respect overwrite option', async () => {
      const sourcePath = join(codeflowDir, 'AGENT_MANIFEST.json');
      const destPath = join(projectDir, 'AGENT_MANIFEST.json');

      // Create destination file first
      await writeFile(destPath, 'existing content');

      // Should not overwrite by default
      await expect(copyAgentManifest(sourcePath, destPath, { overwrite: false })).rejects.toThrow('already exists');

      // Should overwrite when explicitly set
      await copyAgentManifest(sourcePath, destPath, { overwrite: true });
      expect(existsSync(destPath)).toBe(true);
    });
  });

  describe('discoverAndCopyManifest', () => {
    it('should discover and copy manifest', async () => {
      // Create manifest in project directory (to be discovered from subDir)
      await writeFile(join(projectDir, 'AGENT_MANIFEST.json'), manifestContent);
      
      // Create a subdirectory to test upward search
      const subDir = join(projectDir, 'subproject');
      await mkdir(subDir, { recursive: true });
      
      // Change to subdirectory and discover from there
      const originalCwd = process.cwd();
      process.chdir(subDir);

      try {
        await discoverAndCopyManifest(projectDir);
        
        const copiedManifest = join(projectDir, 'AGENT_MANIFEST.json');
        expect(existsSync(copiedManifest)).toBe(true);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('hasValidManifest', () => {
    it('should return true for existing manifest', () => {
      expect(hasValidManifest(codeflowDir)).toBe(true);
    });

    it('should return false for non-existent manifest', () => {
      expect(hasValidManifest(join(tempDir, 'empty-dir'))).toBe(false);
    });
  });
});
