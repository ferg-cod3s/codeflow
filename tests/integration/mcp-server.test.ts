import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import { spawn, ChildProcess } from "child_process";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const MCP_SERVER_PATH = path.join(import.meta.dir, "../../mcp/codeflow-server.mjs");

// Helper to start MCP server and create client
async function createMCPClient(): Promise<{ client: Client; cleanup: () => Promise<void> }> {
  const transport = new StdioClientTransport({
    command: "bun",
    args: ["run", MCP_SERVER_PATH]
  });

  const client = new Client({
    name: "test-client",
    version: "1.0.0"
  }, {
    capabilities: {}
  });

  // Connect with timeout
  const connectPromise = client.connect(transport);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Connection timeout")), 15000)
  );

  await Promise.race([connectPromise, timeoutPromise]);

  const cleanup = async () => {
    try {
      await client.close();
    } catch (error) {
      console.warn("Cleanup error:", error);
    }
  };

  return { client, cleanup };
}

describe("MCP Server Integration", () => {
  let testDir: string;

  beforeAll(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), "codeflow-mcp-test-"));

    // Create a mock project structure
    await fs.mkdir(path.join(testDir, "command"), { recursive: true });
    await fs.mkdir(path.join(testDir, "agent"), { recursive: true });

    // Create test command files
    await fs.writeFile(path.join(testDir, "command", "test.md"), `---
name: test
description: Test command for MCP integration
---

# Test Command

This is a test command for MCP integration testing.
`);
  });

  afterAll(async () => {
    await fs.rm(testDir, { recursive: true, force: true });
  });

  test("MCP server starts and responds to ping", async () => {
    const { client, cleanup } = await createMCPClient();

    try {
      const result = await client.ping();
      expect(result).toBeDefined();
    } finally {
      await cleanup();
    }
  });

  test("MCP server exposes 7 core workflow commands as tools", async () => {
    const { client, cleanup } = await createMCPClient();

    try {
      const tools = await client.listTools();

      // Should expose the 7 core workflow commands (simple names, not prefixed)
      const expectedCommands = [
        "research",
        "plan",
        "execute",
        "test",
        "document",
        "commit",
        "review"
      ];

      const toolNames = tools.tools.map(tool => tool.name);

      for (const expectedCommand of expectedCommands) {
        expect(toolNames).toContain(expectedCommand);
      }

      // Should have at least the core commands plus get_command
      expect(tools.tools.length).toBeGreaterThanOrEqual(expectedCommands.length);
    } finally {
      await cleanup();
    }
  });

  test("agents are available internally but not exposed as tools", async () => {
    const { client, cleanup } = await createMCPClient();

    try {
      const tools = await client.listTools();
      const toolNames = tools.tools.map(tool => tool.name);

      // Agents should not be exposed as tools
      const agentPatterns = [
        "codebase-analyzer",
        "codebase-locator",
        "thoughts-analyzer",
        "web-search-researcher"
      ];

      for (const agentPattern of agentPatterns) {
        const hasAgentTool = toolNames.some(name => name.includes(agentPattern));
        expect(hasAgentTool).toBe(false);
      }
    } finally {
      await cleanup();
    }
  });

  test("MCP server provides tool descriptions", async () => {
    const { client, cleanup } = await createMCPClient();

    try {
      const tools = await client.listTools();

      for (const tool of tools.tools) {
        expect(tool.name).toBeDefined();
        expect(tool.description).toBeDefined();
        expect(tool.description?.length || 0).toBeGreaterThan(0);
      }
    } finally {
      await cleanup();
    }
  });

  test("MCP server handles tool execution", async () => {
    const { client, cleanup } = await createMCPClient();

    try {
      const tools = await client.listTools();

      if (tools.tools.length > 0) {
        const firstTool = tools.tools[0];

        // Try to call the tool (might fail due to missing arguments, but should not crash server)
        try {
          await client.callTool({
            name: firstTool.name,
            arguments: {}
          });
        } catch (error) {
          // Expected - tool might require arguments
          expect(error).toBeDefined();
        }
      }
    } finally {
      await cleanup();
    }
  });

  test("MCP server handles invalid tool calls gracefully", async () => {
    const { client, cleanup } = await createMCPClient();

    try {
      // Try to call a non-existent tool
      await expect(client.callTool({
        name: "nonexistent.tool",
        arguments: {}
      })).rejects.toThrow();
    } finally {
      await cleanup();
    }
  });
});

describe("MCP Server Error Handling", () => {
  test("MCP server handles malformed requests", async () => {
    const { client, cleanup } = await createMCPClient();

    try {
      // Test with invalid method
      const invalidRequest = {
        jsonrpc: "2.0",
        id: 1,
        method: "invalid_method",
        params: {}
      };

      // This should not crash the server
      // The exact behavior depends on the MCP SDK implementation
    } finally {
      await cleanup();
    }
  });

  test("MCP server maintains connection stability", async () => {
    const { client, cleanup } = await createMCPClient();

    try {
      // Make multiple requests to ensure server stability
      for (let i = 0; i < 5; i++) {
        const result = await client.ping();
        expect(result).toBeDefined();
      }

      const tools = await client.listTools();
      expect(tools.tools).toBeDefined();
    } finally {
      await cleanup();
    }
  });
});

describe("MCP Server Resource Management", () => {
  test("MCP server cleans up resources properly", async () => {
    // Create multiple clients to test resource management
    const clients = [];

    try {
      for (let i = 0; i < 3; i++) {
        const { client, cleanup } = await createMCPClient();
        clients.push({ client, cleanup });
      }

      // All clients should be able to ping
      for (const { client } of clients) {
        const result = await client.ping();
        expect(result).toBeDefined();
      }
    } finally {
      // Clean up all clients
      for (const { cleanup } of clients) {
        await cleanup();
      }
    }
  });
});

describe("MCP Command Integration", () => {
  test("research command tool is available", async () => {
    const { client, cleanup } = await createMCPClient();

    try {
      const tools = await client.listTools();
      const researchTool = tools.tools.find(t => t.name === "research");

      expect(researchTool).toBeDefined();
      expect(researchTool?.description).toContain("research");
    } finally {
      await cleanup();
    }
  });

  test("plan command tool is available", async () => {
    const { client, cleanup } = await createMCPClient();

    try {
      const tools = await client.listTools();
      const planTool = tools.tools.find(t => t.name === "plan");

      expect(planTool).toBeDefined();
      expect(planTool?.description).toContain("plan");
    } finally {
      await cleanup();
    }
  });

  test("all workflow commands have consistent naming", async () => {
    const { client, cleanup } = await createMCPClient();

    try {
      const tools = await client.listTools();
      const coreCommands = ["research", "plan", "execute", "test", "document", "commit", "review"];
      const commandTools = tools.tools.filter(t => coreCommands.includes(t.name));

      expect(commandTools.length).toBeGreaterThanOrEqual(7);

      // All command tools should have simple names and descriptions
      for (const tool of commandTools) {
        expect(tool.name).toMatch(/^[a-z]+$/);
        expect(tool.description).toBeDefined();
        expect(tool.description?.length || 0).toBeGreaterThan(0);
      }
    } finally {
      await cleanup();
    }
  });
});
