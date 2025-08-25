#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import url from "node:url";
import crypto from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Core workflow commands - these are generic and PII-safe
const CORE_COMMANDS = [
  'research', 'plan', 'execute', 'test', 'document', 'commit', 'review'
];

interface CommandTemplate {
  name: string;
  description: string;
  content: string;
}

// Built-in command templates - generic and PII-safe
const COMMAND_TEMPLATES: CommandTemplate[] = [
  {
    name: "research",
    description: "Comprehensive codebase and documentation analysis",
    content: `# Research Command

You are tasked with conducting comprehensive research on a codebase or specific topic.

## Process

1. **Analyze the Request**: Understand what specific aspect needs research
2. **Gather Information**: Use available tools to find relevant code, documentation, and patterns
3. **Synthesize Findings**: Create a comprehensive analysis with clear insights
4. **Document Results**: Provide actionable findings and recommendations

## Guidelines

- Focus on factual, observable information
- Identify patterns and architectural decisions
- Note potential issues or improvement areas
- Provide specific examples and evidence
- Keep analysis objective and constructive

## Output Format

Structure your research as:
- **Summary**: Key findings in 2-3 sentences
- **Analysis**: Detailed examination of relevant aspects
- **Recommendations**: Specific next steps or improvements
- **References**: Code locations, documentation, or resources examined

Conduct thorough research based on the provided scope and requirements.`
  },
  {
    name: "plan",
    description: "Create detailed implementation plans",
    content: `# Plan Command

You are tasked with creating a detailed implementation plan based on research findings and requirements.

## Process

1. **Review Requirements**: Understand the goals and constraints
2. **Analyze Dependencies**: Identify what needs to be built or modified
3. **Break Down Tasks**: Create specific, actionable steps
4. **Define Success Criteria**: Establish clear completion metrics
5. **Consider Risks**: Identify potential challenges and mitigation strategies

## Guidelines

- Create specific, measurable tasks
- Include time estimates where appropriate
- Consider technical dependencies and sequencing
- Account for testing and documentation needs
- Plan for code review and quality assurance

## Output Format

Structure your plan as:
- **Objectives**: Clear goals and success criteria
- **Phases**: Logical groupings of related work
- **Tasks**: Specific implementation steps with details
- **Dependencies**: What must be completed first
- **Risks**: Potential challenges and mitigation strategies
- **Timeline**: Estimated effort and sequencing

Create a comprehensive implementation plan based on the provided requirements.`
  },
  {
    name: "execute",
    description: "Implement plans with systematic verification",
    content: `# Execute Command

You are tasked with implementing a specific plan or feature with systematic verification.

## Process

1. **Review Plan**: Understand the implementation requirements and steps
2. **Implement Systematically**: Follow the plan with careful attention to quality
3. **Test Incrementally**: Verify each step works as expected
4. **Document Changes**: Note what was implemented and any deviations
5. **Validate Results**: Ensure the implementation meets success criteria

## Guidelines

- Follow established coding patterns and conventions
- Write clean, maintainable, and well-documented code
- Include appropriate error handling and validation
- Test thoroughly at each step
- Update related documentation as needed

## Implementation Standards

- Use clear, descriptive naming conventions
- Include relevant comments for complex logic
- Follow security best practices
- Ensure code is performant and scalable
- Add appropriate logging for debugging

## Output Format

For each implementation step:
- **Action Taken**: What was implemented or modified
- **Code Changes**: Key files and functions modified
- **Testing**: How the change was verified
- **Notes**: Any issues encountered or deviations from plan

Execute the implementation systematically with proper verification and documentation.`
  },
  {
    name: "test",
    description: "Generate comprehensive test suites",
    content: `# Test Command

You are tasked with generating comprehensive tests for implemented functionality.

## Process

1. **Analyze Implementation**: Understand what needs testing
2. **Identify Test Types**: Determine unit, integration, and end-to-end test needs
3. **Design Test Cases**: Cover happy paths, edge cases, and error conditions
4. **Implement Tests**: Create maintainable, reliable test code
5. **Validate Coverage**: Ensure adequate test coverage

## Test Types

- **Unit Tests**: Individual functions and components
- **Integration Tests**: Component interactions and data flow
- **End-to-End Tests**: Complete user workflows
- **Performance Tests**: Load and responsiveness testing
- **Security Tests**: Input validation and access control

## Guidelines

- Test both successful and failure scenarios
- Use descriptive test names and clear assertions
- Ensure tests are independent and repeatable
- Mock external dependencies appropriately
- Include setup and teardown for test data

## Output Format

For each test suite:
- **Test Scope**: What functionality is being tested
- **Test Cases**: Specific scenarios and expected outcomes
- **Test Implementation**: Actual test code with explanations
- **Coverage**: What percentage of code/functionality is tested
- **Execution**: Instructions for running the tests

Generate comprehensive tests that ensure code quality and reliability.`
  },
  {
    name: "document",
    description: "Create user guides and technical documentation",
    content: `# Document Command

You are tasked with creating comprehensive documentation for implemented functionality.

## Process

1. **Identify Audience**: Determine who will use this documentation
2. **Analyze Content**: Understand what needs to be documented
3. **Structure Information**: Organize content logically
4. **Write Clearly**: Use clear, concise language with examples
5. **Validate Accuracy**: Ensure all information is correct and current

## Documentation Types

- **User Guides**: Step-by-step instructions for end users
- **API Documentation**: Endpoint descriptions, parameters, responses
- **Technical Specs**: Architecture, design decisions, and implementation details
- **Troubleshooting**: Common issues and their solutions
- **Getting Started**: Quick setup and basic usage instructions

## Guidelines

- Use clear, jargon-free language
- Include practical examples and code snippets
- Provide screenshots or diagrams where helpful
- Structure with headers and bullet points for scannability
- Keep content up-to-date with implementation

## Output Format

Structure documentation as:
- **Overview**: Brief description of functionality and purpose
- **Prerequisites**: What users need before starting
- **Instructions**: Step-by-step procedures with examples
- **Reference**: Detailed parameter and option descriptions
- **Troubleshooting**: Common issues and solutions

Create comprehensive, user-friendly documentation that enables effective use of the functionality.`
  },
  {
    name: "commit",
    description: "Create structured git commits with proper messaging",
    content: `# Commit Command

You are tasked with creating well-structured git commits with proper messaging.

## Process

1. **Review Changes**: Analyze what files and functionality have been modified
2. **Group Related Changes**: Organize changes into logical commit groups
3. **Write Clear Messages**: Create descriptive commit messages following conventions
4. **Verify Completeness**: Ensure all necessary changes are included
5. **Check Quality**: Validate that commits are atomic and meaningful

## Commit Message Format

Use conventional commit format:
\`\`\`
type(scope): brief description

Optional longer description explaining the change in detail.

- List specific changes made
- Include any breaking changes
- Reference issues or tickets if applicable
\`\`\`

## Commit Types

- **feat**: New features or functionality
- **fix**: Bug fixes and corrections
- **docs**: Documentation changes
- **style**: Code formatting and style changes
- **refactor**: Code restructuring without functional changes
- **test**: Adding or updating tests
- **chore**: Build, CI, or maintenance tasks

## Guidelines

- Keep commits atomic (one logical change per commit)
- Write descriptive but concise commit messages
- Include context about why the change was made
- Reference related issues or pull requests
- Ensure commits build and pass tests

## Output Format

For each proposed commit:
- **Files Changed**: List of modified files
- **Commit Type**: Category of change (feat, fix, etc.)
- **Commit Message**: Properly formatted message
- **Description**: Explanation of the changes made

Create clean, well-documented commits that provide clear project history.`
  },
  {
    name: "review",
    description: "Validate implementations against requirements and quality standards",
    content: `# Review Command

You are tasked with conducting a comprehensive review of implemented functionality.

## Process

1. **Compare Against Requirements**: Verify implementation matches original specifications
2. **Check Code Quality**: Evaluate coding standards, patterns, and best practices
3. **Test Functionality**: Validate that features work as expected
4. **Assess Documentation**: Ensure adequate documentation is provided
5. **Identify Issues**: Note any problems or improvement opportunities

## Review Areas

- **Functionality**: Does the implementation meet requirements?
- **Code Quality**: Is the code clean, maintainable, and well-structured?
- **Performance**: Are there any performance concerns or bottlenecks?
- **Security**: Are there any security vulnerabilities or concerns?
- **Testing**: Is there adequate test coverage?
- **Documentation**: Is the implementation properly documented?

## Quality Criteria

- Code follows established patterns and conventions
- Error handling is appropriate and comprehensive
- Performance is acceptable for the use case
- Security best practices are followed
- Tests provide good coverage of functionality
- Documentation is clear and complete

## Output Format

Structure the review as:
- **Summary**: Overall assessment of the implementation
- **Requirements Compliance**: How well implementation matches specifications
- **Code Quality Assessment**: Evaluation of coding standards and practices
- **Issues Found**: Any problems or concerns identified
- **Recommendations**: Specific improvements or next steps
- **Approval Status**: Whether implementation is ready for deployment

Conduct a thorough review that ensures quality and compliance with requirements.`
  }
];

function findCommandDirectories(): string[] {
  const cwd = process.cwd();
  const searchPaths = [
    path.join(cwd, ".opencode", "command"),
    path.join(cwd, ".claude", "commands"),
  ];
  
  return searchPaths;
}

async function loadMarkdownFiles(dir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
      .map((e) => path.join(dir, e.name));
  } catch {
    return [];
  }
}

async function loadCommand(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    // Fallback to built-in template
    const filename = path.basename(filePath, '.md');
    const template = COMMAND_TEMPLATES.find(t => t.name === filename);
    return template?.content || `# ${filename}\n\nCommand not found.`;
  }
}

async function buildTools() {
  const tools: Array<{
    id: string;
    description: string;
    getContent: () => Promise<string>;
  }> = [];

  // Try to find commands in project directories first
  const commandDirs = findCommandDirectories();
  let commandFiles: string[] = [];
  
  for (const dir of commandDirs) {
    const files = await loadMarkdownFiles(dir);
    if (files.length > 0) {
      commandFiles = files;
      break;
    }
  }

  // If no project commands found, use built-in templates
  if (commandFiles.length === 0) {
    console.error("📋 No project commands found, using built-in templates");
    console.error("💡 Run 'codeflow setup .' to install project-specific commands");
    
    for (const template of COMMAND_TEMPLATES) {
      tools.push({
        id: template.name,
        description: template.description,
        getContent: async () => template.content,
      });
    }
  } else {
    // Use project commands
    for (const filePath of commandFiles) {
      const base = path.basename(filePath, '.md');
      
      if (CORE_COMMANDS.includes(base)) {
        tools.push({
          id: base,
          description: `CodeFlow workflow: ${base}`,
          getContent: () => loadCommand(filePath),
        });
      }
    }
  }

  return tools;
}

async function run() {
  console.error("🚀 Starting CodeFlow MCP Server");
  console.error(`📁 Working directory: ${process.cwd()}`);
  
  const server = new McpServer({ 
    name: "agentic-codeflow-mcp-server", 
    version: "0.1.0" 
  });

  const transport = new StdioServerTransport();
  const toolEntries = await buildTools();
  const commandCache = new Map<string, string>();

  console.error(`🛠️  Registered ${toolEntries.length} tools: ${toolEntries.map(t => t.id).join(', ')}`);

  // Register each core workflow command
  for (const entry of toolEntries) {
    server.registerTool(
      entry.id,
      {
        title: entry.id,
        description: entry.description,
      },
      async () => {
        let content = commandCache.get(entry.id);
        if (!content) {
          content = await entry.getContent();
          commandCache.set(entry.id, content);
        }
        
        return {
          content: [{ type: "text", text: content }],
        };
      }
    );
  }

  // Utility tool for getting command documentation
  server.registerTool(
    "get_command",
    {
      title: "get_command",
      description: "Get command documentation by name (research, plan, execute, test, document, commit, review)",
    },
    async (args = {}) => {
      const name = (args.name || "").toString().trim();
      if (!name) {
        return { 
          content: [{ 
            type: "text", 
            text: "Error: 'name' is required\n\nAvailable commands: " + toolEntries.map(t => t.id).join(', ')
          }] 
        };
      }
      
      const tool = toolEntries.find(t => t.id === name);
      if (!tool) {
        const availableCommands = toolEntries.map(t => t.id).join(', ');
        return { 
          content: [{ 
            type: "text", 
            text: `Command '${name}' not found.\n\nAvailable commands: ${availableCommands}` 
          }] 
        };
      }
      
      const content = await tool.getContent();
      return { content: [{ type: "text", text: content }] };
    }
  );

  console.error("✅ MCP Server ready");
  
  await server.connect(transport);
  
  // Keep the process alive
  await new Promise((resolve) => {
    const onClose = () => {
      console.error("🛑 MCP Server shutting down");
      resolve(undefined);
    };
    
    try { 
      process.stdin.resume(); 
    } catch {}
    
    try {
      process.stdin.on("end", onClose);
      process.stdin.on("close", onClose);
    } catch {}
    
    try {
      process.on("SIGINT", onClose);
      process.on("SIGTERM", onClose);
    } catch {}
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((err) => {
    console.error("❌ CodeFlow MCP server failed:", err);
    process.exit(1);
  });
}