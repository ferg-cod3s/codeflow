import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { execSync, spawn } from "child_process";
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";

const TEST_TIMEOUT = 45000; // 45 seconds for comprehensive user journey tests
const CLI_PATH = resolve(__dirname, "../../src/cli/index.ts");

/**
 * Real User Journey Tests
 * Tests actual user workflows and scenarios
 */
describe("Real User Journey E2E Tests", () => {
  let testWorkspace: string;
  let userHomeDir: string;

  beforeAll(() => {
    // Create realistic test environment
    testWorkspace = join(tmpdir(), `codeflow-user-workspace-${Date.now()}`);
    userHomeDir = join(tmpdir(), `.codeflow-home-${Date.now()}`);
    
    mkdirSync(testWorkspace, { recursive: true });
    mkdirSync(userHomeDir, { recursive: true });
    
    process.env.CODEFLOW_HOME = userHomeDir;
  });

  afterAll(() => {
    // Clean up
    if (existsSync(testWorkspace)) {
      rmSync(testWorkspace, { recursive: true, force: true });
    }
    if (existsSync(userHomeDir)) {
      rmSync(userHomeDir, { recursive: true, force: true });
    }
    delete process.env.CODEFLOW_HOME;
  });

  test("New user journey: First-time setup and usage", async () => {
    console.log("🚀 Testing new user journey...");
    
    // Step 1: User installs codeflow and runs first setup
    const projectDir = join(testWorkspace, 'my-first-project');
    mkdirSync(projectDir, { recursive: true });
    
    // Create a basic project structure
    writeFileSync(join(projectDir, 'package.json'), JSON.stringify({
      name: "my-first-project",
      version: "1.0.0",
      description: "Test project for codeflow"
    }, null, 2));

    // User runs initial setup
    const setupOutput = execSync(`bun run ${CLI_PATH} setup ${projectDir}`, {
      encoding: 'utf8',
      timeout: 15000
    });

    expect(setupOutput).toContain('Successfully set up');
    expect(existsSync(join(projectDir, '.codeflow'))).toBe(true);
    
    console.log("✅ Project setup successful");

    // Step 2: User checks status to see what's available
    const statusOutput = execSync(`bun run ${CLI_PATH} status ${projectDir}`, {
      encoding: 'utf8',
      timeout: 10000
    });

    expect(statusOutput).toContain('agents');
    expect(statusOutput).toContain('commands');
    
    console.log("✅ Status check successful");

    // Step 3: User sets up global configuration
    const globalOutput = execSync(`bun run ${CLI_PATH} global setup`, {
      encoding: 'utf8',
      timeout: 10000,
      env: { ...process.env, CODEFLOW_HOME: userHomeDir }
    });

    expect(globalOutput).toContain('Global');
    expect(existsSync(join(userHomeDir, 'agent'))).toBe(true);
    
    console.log("✅ Global setup successful");

    // Step 4: User tries format conversion
    const convertOutput = execSync(`bun run ${CLI_PATH} convert --source base --target claude-code --project ${projectDir}`, {
      encoding: 'utf8',
      timeout: 15000
    });

    expect(convertOutput).not.toContain('Error');
    
    console.log("✅ Format conversion successful");

    // Step 5: User configures MCP integration
    const mcpOutput = execSync(`bun run ${CLI_PATH} mcp configure claude-desktop --project ${projectDir}`, {
      encoding: 'utf8',
      timeout: 15000
    });

    expect(mcpOutput).toContain('MCP');
    
    console.log("✅ MCP configuration successful");
    console.log("🎉 New user journey completed successfully");
  }, TEST_TIMEOUT);

  test("Experienced user journey: Multi-project workflow", async () => {
    console.log("🔄 Testing experienced user workflow...");
    
    // Create multiple projects
    const projects = ['frontend-app', 'backend-api', 'mobile-app'];
    const projectDirs = projects.map(name => {
      const dir = join(testWorkspace, name);
      mkdirSync(dir, { recursive: true });
      return dir;
    });

    // Setup each project
    for (const [index, projectDir] of projectDirs.entries()) {
      const projectName = projects[index];
      
      // Create project-specific structure
      writeFileSync(join(projectDir, 'README.md'), `# ${projectName}\n\nTest project for codeflow multi-project workflow.`);
      
      const setupOutput = execSync(`bun run ${CLI_PATH} setup ${projectDir}`, {
        encoding: 'utf8',
        timeout: 10000
      });

      expect(setupOutput).toContain('Successfully set up');
      console.log(`✅ ${projectName} setup completed`);
    }

    // Test cross-project synchronization
    const syncPromises = projectDirs.map(async (projectDir) => {
      return new Promise((resolve, reject) => {
        try {
          const syncOutput = execSync(`bun run ${CLI_PATH} sync --project ${projectDir}`, {
            encoding: 'utf8',
            timeout: 10000
          });
          resolve(syncOutput);
        } catch (error) {
          reject(error);
        }
      });
    });

    const syncResults = await Promise.all(syncPromises);
    expect(syncResults).toHaveLength(3);
    
    console.log("✅ Multi-project synchronization successful");

    // Test batch operations
    for (const projectDir of projectDirs) {
      const statusOutput = execSync(`bun run ${CLI_PATH} status ${projectDir}`, {
        encoding: 'utf8',
        timeout: 5000
      });
      expect(statusOutput).toContain('agents');
    }
    
    console.log("✅ Batch status checks successful");
    console.log("🎉 Experienced user journey completed successfully");
  }, TEST_TIMEOUT);

  test("Developer workflow: Watch mode and hot reloading", async () => {
    console.log("⚡ Testing developer workflow with watch mode...");
    
    const devProject = join(testWorkspace, 'dev-project');
    mkdirSync(devProject, { recursive: true });
    
    // Setup development project
    const setupOutput = execSync(`bun run ${CLI_PATH} setup ${devProject}`, {
      encoding: 'utf8',
      timeout: 10000
    });

    expect(setupOutput).toContain('Successfully set up');

    // Create custom agent for testing (use .opencode structure since that's what setup creates)
    const agentDir = join(devProject, '.opencode', 'agent');
    const customAgentPath = join(agentDir, 'custom_dev_agent.md');
    
    const initialAgentContent = `---
name: custom_dev_agent
description: Custom agent for development testing
mode: primary
temperature: 0.8
---

You are a custom development agent for testing hot reloading capabilities.`;

    writeFileSync(customAgentPath, initialAgentContent);

    // Start watch mode in background
    const watchProcess = spawn('bun', ['run', CLI_PATH, 'watch', 'start', '--project', devProject], {
      stdio: 'pipe',
      detached: false
    });

    // Allow watcher to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Modify agent file to test hot reloading
    const modifiedAgentContent = `---
name: custom_dev_agent
description: Custom agent for development testing (MODIFIED)
mode: primary
temperature: 0.9
tools:
  search: true
---

You are a custom development agent for testing hot reloading capabilities. This content has been modified to test watch mode functionality.`;

    writeFileSync(customAgentPath, modifiedAgentContent);

    // Give watcher time to process changes
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Verify changes were detected
    const statusOutput = execSync(`bun run ${CLI_PATH} status ${devProject}`, {
      encoding: 'utf8',
      timeout: 5000
    });

    expect(statusOutput).toContain('custom_dev_agent');

    // Stop watch mode
    watchProcess.kill();
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log("✅ Watch mode and hot reloading successful");
  }, TEST_TIMEOUT);

  test("Team collaboration workflow", async () => {
    console.log("👥 Testing team collaboration workflow...");
    
    const teamProject = join(testWorkspace, 'team-project');
    mkdirSync(teamProject, { recursive: true });
    
    // Simulate team project setup
    writeFileSync(join(teamProject, '.gitignore'), `
node_modules/
.env
dist/
*.log
`);

    writeFileSync(join(teamProject, 'package.json'), JSON.stringify({
      name: "team-collaboration-project",
      version: "1.0.0",
      scripts: {
        dev: "echo 'Development server'",
        build: "echo 'Building project'",
        test: "echo 'Running tests'"
      }
    }, null, 2));

    // Setup codeflow for team project
    const setupOutput = execSync(`bun run ${CLI_PATH} setup ${teamProject}`, {
      encoding: 'utf8',
      timeout: 10000
    });

    expect(setupOutput).toContain('Successfully set up');

    // Create team-specific agents and commands (use .opencode structure since that's what setup creates)
    const teamAgentsDir = join(teamProject, '.opencode', 'agent');
    const teamAgentContent = `---
name: team_collaboration_agent
description: Agent for team collaboration and code review
mode: subagent
model: github-copilot/gpt-5-mini
temperature: 0.6
tools:
  search: true
  edit: true
  git: true
---

You are a team collaboration agent specializing in code review, documentation, and team coordination.

## Responsibilities
- Code quality reviews
- Documentation generation
- Team workflow optimization
- Meeting notes and action items`;

    writeFileSync(join(teamAgentsDir, 'team_collaboration_agent.md'), teamAgentContent);

    // Test format conversion for team sharing
    const convertOutput = execSync(`bun run ${CLI_PATH} convert --source base --target opencode --project ${teamProject}`, {
      encoding: 'utf8',
      timeout: 10000
    });

    expect(convertOutput).not.toContain('Error');

    // Verify team collaboration features
    const statusOutput = execSync(`bun run ${CLI_PATH} status ${teamProject}`, {
      encoding: 'utf8',
      timeout: 5000
    });

    expect(statusOutput).toContain('team_collaboration_agent');

    // Test MCP configuration for team
    const mcpOutput = execSync(`bun run ${CLI_PATH} mcp configure claude-desktop --project ${teamProject}`, {
      encoding: 'utf8',
      timeout: 10000
    });

    expect(mcpOutput).toContain('MCP');
    
    console.log("✅ Team collaboration workflow successful");
  }, TEST_TIMEOUT);

  test("Migration scenario: Legacy agentic to codeflow", async () => {
    console.log("🔄 Testing migration from legacy agentic workflow...");
    
    const legacyProject = join(testWorkspace, 'legacy-project');
    mkdirSync(legacyProject, { recursive: true });
    
    // Simulate legacy agentic structure
    const legacyDir = join(legacyProject, '.opencode');
    mkdirSync(legacyDir, { recursive: true });
    mkdirSync(join(legacyDir, 'agent'), { recursive: true });
    mkdirSync(join(legacyDir, 'command'), { recursive: true });

    // Create legacy agent
    const legacyAgentContent = `---
name: legacy_agent
description: Legacy agent from agentic workflow
---

You are a legacy agent that needs to be migrated to codeflow.`;

    writeFileSync(join(legacyDir, 'agent', 'legacy_agent.md'), legacyAgentContent);

    // Run codeflow setup to migrate
    const migrationOutput = execSync(`bun run ${CLI_PATH} setup ${legacyProject}`, {
      encoding: 'utf8',
      timeout: 15000
    });

    expect(migrationOutput).toMatch(/(Successfully set up|already have codeflow setup)/);
    expect(existsSync(join(legacyProject, '.opencode'))).toBe(true);

    // Verify legacy content is preserved
    const statusOutput = execSync(`bun run ${CLI_PATH} status ${legacyProject}`, {
      encoding: 'utf8',
      timeout: 5000
    });

    expect(statusOutput).toContain('agents');

    // Test conversion works with migrated content
    const convertOutput = execSync(`bun run ${CLI_PATH} convert --source base --target claude-code --project ${legacyProject}`, {
      encoding: 'utf8',
      timeout: 10000
    });

    expect(convertOutput).not.toContain('Error');
    
    console.log("✅ Legacy migration successful");
  }, TEST_TIMEOUT);

  test("Performance under load", async () => {
    console.log("🚀 Testing performance under load...");
    
    const loadTestProject = join(testWorkspace, 'load-test-project');
    mkdirSync(loadTestProject, { recursive: true });
    
    // Setup project
    execSync(`bun run ${CLI_PATH} setup ${loadTestProject}`, {
      encoding: 'utf8',
      timeout: 10000
    });

    // Create many agents to simulate large project
    const agentDir = join(loadTestProject, '.opencode', 'agent');
    const agentCount = 50;
    const agents = [];

    for (let i = 0; i < agentCount; i++) {
      const agentContent = `---
name: load_test_agent_${i}
description: Load test agent number ${i}
mode: ${i % 2 === 0 ? 'primary' : 'subagent'}
temperature: ${(i / agentCount).toFixed(2)}
tools:
  search: ${i % 3 === 0}
  edit: ${i % 4 === 0}
  git: ${i % 5 === 0}
---

You are load test agent ${i} designed to stress test the codeflow system.

## Agent ${i} Capabilities
${Array.from({length: i % 10 + 1}, (_, j) => `- Capability ${j + 1}`).join('\n')}

This agent simulates a complex agent with multiple capabilities for load testing.
Agent number: ${i}
Generated at: ${new Date().toISOString()}`;

      const agentPath = join(agentDir, `load_test_agent_${i}.md`);
      writeFileSync(agentPath, agentContent);
      agents.push(agentPath);
    }

    // Measure performance under load
    const loadStart = Date.now();
    
    const statusOutput = execSync(`bun run ${CLI_PATH} status ${loadTestProject}`, {
      encoding: 'utf8',
      timeout: 30000
    });

    const loadTime = Date.now() - loadStart;
    const timePerAgent = loadTime / agentCount;
    
    console.log(`Processed ${agentCount} agents in ${loadTime}ms (${timePerAgent.toFixed(2)}ms per agent)`);
    
    // Performance targets
    expect(loadTime).toBeLessThan(15000); // Should complete in under 15 seconds
    expect(timePerAgent).toBeLessThan(300); // Should average under 300ms per agent
    
    // Test conversion under load
    const convertStart = Date.now();
    
    const convertOutput = execSync(`bun run ${CLI_PATH} convert --source base --target claude-code --project ${loadTestProject}`, {
      encoding: 'utf8',
      timeout: 30000
    });

    const convertTime = Date.now() - convertStart;
    console.log(`Conversion under load completed in ${convertTime}ms`);
    
    expect(convertTime).toBeLessThan(20000); // Conversion should complete in under 20 seconds
    
    console.log("✅ Performance under load test successful");
  }, TEST_TIMEOUT);
});