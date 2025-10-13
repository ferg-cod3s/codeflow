# Phase 3: Enhanced Features - Cross-Platform Design

## Overview

Phase 3 adds advanced interactive and user experience features to the research workflow, with platform-specific implementations for both **Claude Code** and **OpenCode**.

## Platform Architecture

### Current State (Phase 2)
```
CLI Entry Point (src/cli/research.ts)
    ↓
Workflow Orchestrator (packages/agentic-mcp/dist/)
    ↓
Agent Registry → Subagent Discovery & Invocation
    ↓
Both Platforms: .claude/agents/*.md OR .opencode/agent/*.md
```

### Phase 3 Architecture
```
Enhanced CLI (interactive, config, themes)
    ↓
Platform Adapter Layer (new)
    ↓
    ├─→ Claude Code Adapter → Task tool invocations
    └─→ OpenCode Adapter → MCP tool invocations
```

---

## Feature 1: Interactive Mode 🎯

### User Experience (Platform Agnostic)

```bash
$ codeflow research --interactive

🔬 Interactive Research Workflow
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

? What would you like to research?
  › Authentication implementation

? Research scope:
  ❯ ◉ Codebase analysis
    ◉ Documentation review
    ◯ External web research
    ◉ Domain specialists

? Select domain specialists: (Space to select, Enter to confirm)
  ◯ security-scanner
  ◯ performance-engineer
  ◉ database-expert
  ◯ api-builder
  ◯ infrastructure-builder

? Quality threshold:
  ◯ Quick (30+)
  ◉ Standard (50+)
  ◯ Comprehensive (70+)

? Output format:
  ◉ Terminal display
  ◯ Markdown file
  ◯ JSON export
  ◯ HTML report

Starting research workflow...
```

### Implementation: Claude Code

**File: `src/cli/interactive/claude-interactive.ts`**

```typescript
import { Task } from '@claude/tools'; // Hypothetical Claude SDK

export class ClaudeInteractiveResearch {
  async execute(config: InteractiveConfig): Promise<void> {
    const phases = this.buildPhases(config);
    
    for (const phase of phases) {
      console.log(`\n📍 Phase: ${phase.name}`);
      
      // Claude Code: Use Task tool with subagent_type
      const results = await Promise.all(
        phase.agents.map(agent => 
          Task({
            subagent_type: agent.name,
            prompt: agent.objective,
            context: this.gatherContext(phase)
          })
        )
      );
      
      this.updateProgress(phase, results);
    }
  }
  
  private buildPhases(config: InteractiveConfig) {
    return [
      {
        name: 'Discovery',
        type: 'parallel',
        agents: [
          { name: 'codebase-locator', objective: config.query },
          { name: 'thoughts-locator', objective: config.query }
        ]
      },
      // ... more phases
    ];
  }
}
```

**Claude Code Integration:**
- Uses `Task` tool with `subagent_type` parameter
- Agents defined in `.claude/agents/*.md`
- No MCP protocol required
- Direct CLI → Task invocation

### Implementation: OpenCode

**File: `src/cli/interactive/opencode-interactive.ts`**

```typescript
import { MCPClient } from '@modelcontextprotocol/sdk';

export class OpenCodeInteractiveResearch {
  private mcpClient: MCPClient;
  
  async execute(config: InteractiveConfig): Promise<void> {
    await this.mcpClient.connect();
    
    const phases = this.buildPhases(config);
    
    for (const phase of phases) {
      console.log(`\n📍 Phase: ${phase.name}`);
      
      // OpenCode: Use MCP tool invocations
      const results = await Promise.all(
        phase.agents.map(agent =>
          this.mcpClient.callTool({
            name: `codeflow.agent.${agent.name}`,
            arguments: {
              objective: agent.objective,
              context: this.gatherContext(phase)
            }
          })
        )
      );
      
      this.updateProgress(phase, results);
    }
  }
}
```

**OpenCode Integration:**
- Uses MCP client for agent communication
- Agents exposed as `codeflow.agent.<agent-name>`
- Defined in `.opencode/agent/*.md`
- Supports streaming responses

---

## Feature 2: Configuration File Support 📝

### Shared Configuration Format

**File: `.codeflowrc.json` or `.codeflowrc.yaml`**

```json
{
  "research": {
    "defaults": {
      "includeWeb": false,
      "minQuality": 50,
      "outputFormat": "markdown",
      "verbose": false
    },
    "specialists": {
      "auto": true,
      "preferred": [
        "security-scanner",
        "performance-engineer"
      ]
    },
    "phases": {
      "discovery": {
        "timeout": 300,
        "parallel": true
      },
      "analysis": {
        "timeout": 480,
        "sequential": true
      }
    },
    "platform": "auto"
  },
  "output": {
    "directory": "./research-reports",
    "template": "detailed",
    "includeTimestamps": true
  }
}
```

### Platform Detection

**File: `src/config/platform-detector.ts`**

```typescript
export enum Platform {
  CLAUDE_CODE = 'claude',
  OPENCODE = 'opencode',
  UNKNOWN = 'unknown'
}

export class PlatformDetector {
  static detect(projectRoot: string): Platform {
    const fs = require('fs');
    const path = require('path');
    
    // Check for Claude Code
    if (fs.existsSync(path.join(projectRoot, '.claude', 'agents'))) {
      return Platform.CLAUDE_CODE;
    }
    
    // Check for OpenCode
    if (fs.existsSync(path.join(projectRoot, '.opencode', 'agent'))) {
      return Platform.OPENCODE;
    }
    
    // Check for opencode.json
    if (fs.existsSync(path.join(projectRoot, 'opencode.json'))) {
      return Platform.OPENCODE;
    }
    
    return Platform.UNKNOWN;
  }
}
```

### Configuration Loader (Platform Agnostic)

**File: `src/config/config-loader.ts`**

```typescript
export class ConfigLoader {
  private platform: Platform;
  
  async load(projectRoot: string): Promise<ResearchConfig> {
    this.platform = PlatformDetector.detect(projectRoot);
    
    // Load base config
    const baseConfig = await this.loadFile(projectRoot);
    
    // Load platform-specific overrides
    const platformConfig = await this.loadPlatformConfig(projectRoot);
    
    return this.merge(baseConfig, platformConfig);
  }
  
  private async loadFile(root: string): Promise<any> {
    // Try JSON, then YAML, then defaults
    const configPaths = [
      '.codeflowrc.json',
      '.codeflowrc.yaml',
      '.codeflowrc.yml',
      'codeflow.config.js'
    ];
    
    for (const configPath of configPaths) {
      const fullPath = path.join(root, configPath);
      if (fs.existsSync(fullPath)) {
        return this.parseConfig(fullPath);
      }
    }
    
    return this.getDefaults();
  }
  
  private async loadPlatformConfig(root: string): Promise<any> {
    switch (this.platform) {
      case Platform.CLAUDE_CODE:
        return this.loadClaudeConfig(root);
      case Platform.OPENCODE:
        return this.loadOpenCodeConfig(root);
      default:
        return {};
    }
  }
}
```

---

## Feature 3: Color Themes & Rich Terminal UI 🎨

### Theme System (Platform Agnostic)

**File: `src/cli/themes/theme-manager.ts`**

```typescript
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';

export interface Theme {
  primary: chalk.Chalk;
  secondary: chalk.Chalk;
  success: chalk.Chalk;
  error: chalk.Chalk;
  warning: chalk.Chalk;
  info: chalk.Chalk;
  muted: chalk.Chalk;
  highlight: chalk.Chalk;
}

export class ThemeManager {
  private themes: Record<string, Theme> = {
    default: {
      primary: chalk.cyan,
      secondary: chalk.blue,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      info: chalk.blue,
      muted: chalk.gray,
      highlight: chalk.bold.cyan
    },
    dark: {
      primary: chalk.hex('#61AFEF'),
      secondary: chalk.hex('#C678DD'),
      success: chalk.hex('#98C379'),
      error: chalk.hex('#E06C75'),
      warning: chalk.hex('#E5C07B'),
      info: chalk.hex('#56B6C2'),
      muted: chalk.hex('#5C6370'),
      highlight: chalk.bold.hex('#61AFEF')
    },
    light: {
      primary: chalk.blue,
      secondary: chalk.magenta,
      success: chalk.green,
      error: chalk.red,
      warning: chalk.yellow,
      info: chalk.cyan,
      muted: chalk.gray,
      highlight: chalk.bold.blue
    }
  };
  
  getTheme(name: string = 'default'): Theme {
    return this.themes[name] || this.themes.default;
  }
}
```

### Enhanced Display Components

**File: `src/cli/display/components.ts`**

```typescript
export class DisplayComponents {
  constructor(private theme: Theme) {}
  
  showHeader(title: string): void {
    console.log(
      boxen(this.theme.highlight(title), {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan'
      })
    );
  }
  
  showPhase(phase: string, icon: string): void {
    console.log(`\n${icon} ${this.theme.primary(phase)}`);
    console.log(this.theme.muted('─'.repeat(50)));
  }
  
  showProgress(label: string, current: number, total: number): ora.Ora {
    const spinner = ora({
      text: `${label} (${current}/${total})`,
      color: 'cyan'
    }).start();
    
    return spinner;
  }
  
  showSuccess(message: string): void {
    console.log(this.theme.success(`✓ ${message}`));
  }
  
  showError(message: string): void {
    console.log(this.theme.error(`✗ ${message}`));
  }
  
  showTable(data: any[], columns: string[]): void {
    const Table = require('cli-table3');
    const table = new Table({
      head: columns.map(col => this.theme.highlight(col)),
      style: {
        head: [],
        border: ['gray']
      }
    });
    
    data.forEach(row => table.push(Object.values(row)));
    console.log(table.toString());
  }
}
```

### Platform-Specific Rendering

**Claude Code Display:**
```typescript
export class ClaudeDisplay extends DisplayComponents {
  showAgentInvocation(agent: string, phase: string): void {
    console.log(
      this.theme.info(`  → Invoking ${agent} via Task tool`)
    );
  }
  
  showAgentResult(agent: string, result: any): void {
    console.log(
      this.theme.success(`  ✓ ${agent} completed`)
    );
  }
}
```

**OpenCode Display:**
```typescript
export class OpenCodeDisplay extends DisplayComponents {
  showMCPConnection(status: 'connecting' | 'connected' | 'error'): void {
    const statusMsg = {
      connecting: this.theme.info('Connecting to MCP server...'),
      connected: this.theme.success('✓ MCP server connected'),
      error: this.theme.error('✗ MCP connection failed')
    };
    
    console.log(statusMsg[status]);
  }
  
  showStreamingProgress(agent: string, chunk: string): void {
    process.stdout.write(this.theme.muted(chunk));
  }
}
```

---

## Feature 4: Watch Mode 👀

### Watch Mode Implementation

**File: `src/cli/watch/research-watcher.ts`**

```typescript
import chokidar from 'chokidar';
import debounce from 'lodash.debounce';

export class ResearchWatcher {
  private watcher: chokidar.FSWatcher;
  private config: WatchConfig;
  
  async start(config: WatchConfig): Promise<void> {
    console.log('👀 Watch mode started');
    console.log(`Watching: ${config.patterns.join(', ')}\n`);
    
    this.watcher = chokidar.watch(config.patterns, {
      persistent: true,
      ignoreInitial: true,
      ignored: config.ignore || ['node_modules', 'dist', '.git']
    });
    
    const executeResearch = debounce(
      () => this.runResearch(config),
      config.debounceMs || 2000
    );
    
    this.watcher
      .on('change', path => {
        console.log(`📝 Changed: ${path}`);
        executeResearch();
      })
      .on('add', path => {
        console.log(`➕ Added: ${path}`);
        executeResearch();
      });
  }
  
  private async runResearch(config: WatchConfig): Promise<void> {
    console.log('\n🔄 Re-running research...\n');
    
    // Platform-specific execution
    const executor = this.createExecutor(config.platform);
    await executor.execute(config.query, config.options);
  }
  
  private createExecutor(platform: Platform) {
    switch (platform) {
      case Platform.CLAUDE_CODE:
        return new ClaudeResearchExecutor();
      case Platform.OPENCODE:
        return new OpenCodeResearchExecutor();
      default:
        throw new Error('Unknown platform');
    }
  }
}
```

**Usage:**
```bash
# Watch mode with auto-research on file changes
codeflow research "authentication" --watch --patterns "src/auth/**/*.ts"

# Watch with specific triggers
codeflow research "API endpoints" --watch \
  --patterns "src/api/**/*.ts,src/routes/**/*.ts" \
  --debounce 5000
```

---

## Feature 5: Multiple Output Formats 📊

### Output Format System

**File: `src/output/formatters/formatter-factory.ts`**

```typescript
export enum OutputFormat {
  TERMINAL = 'terminal',
  MARKDOWN = 'markdown',
  JSON = 'json',
  HTML = 'html',
  PDF = 'pdf'
}

export class FormatterFactory {
  static create(format: OutputFormat, theme?: Theme): OutputFormatter {
    switch (format) {
      case OutputFormat.TERMINAL:
        return new TerminalFormatter(theme);
      case OutputFormat.MARKDOWN:
        return new MarkdownFormatter();
      case OutputFormat.JSON:
        return new JSONFormatter();
      case OutputFormat.HTML:
        return new HTMLFormatter(theme);
      case OutputFormat.PDF:
        return new PDFFormatter();
      default:
        return new TerminalFormatter();
    }
  }
}
```

### JSON Output (Platform Agnostic)

**File: `src/output/formatters/json-formatter.ts`**

```typescript
export class JSONFormatter implements OutputFormatter {
  format(result: ResearchResult): string {
    return JSON.stringify({
      metadata: {
        timestamp: new Date().toISOString(),
        query: result.query,
        platform: result.platform,
        version: '3.0.0'
      },
      summary: result.summary,
      phases: {
        discovery: {
          codebaseFindings: result.codebaseAnalysis,
          documentationFindings: result.documentationInsights
        },
        analysis: {
          architectureAnalysis: result.architectureAnalysis,
          patterns: result.patterns
        },
        specialists: result.domainSpecialistFindings
      },
      recommendations: result.recommendations,
      nextSteps: result.nextSteps,
      qualityMetrics: result.qualityMetrics,
      agents: {
        invoked: result.agentsInvoked,
        timing: result.agentTimings
      }
    }, null, 2);
  }
}
```

### HTML Output with Interactive Elements

**File: `src/output/formatters/html-formatter.ts`**

```typescript
export class HTMLFormatter implements OutputFormatter {
  constructor(private theme?: Theme) {}
  
  format(result: ResearchResult): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Research Report: ${result.query}</title>
  <style>
    ${this.generateCSS()}
  </style>
  <script>
    ${this.generateJS()}
  </script>
</head>
<body>
  <div class="container">
    ${this.renderHeader(result)}
    ${this.renderNavigation(result)}
    ${this.renderContent(result)}
    ${this.renderMetrics(result)}
  </div>
</body>
</html>`;
  }
  
  private renderNavigation(result: ResearchResult): string {
    return `
<nav class="sidebar">
  <ul>
    <li><a href="#summary">Summary</a></li>
    <li><a href="#codebase">Codebase</a></li>
    <li><a href="#docs">Documentation</a></li>
    <li><a href="#specialists">Specialists</a></li>
    <li><a href="#recommendations">Recommendations</a></li>
    <li><a href="#metrics">Quality Metrics</a></li>
  </ul>
</nav>`;
  }
  
  private renderMetrics(result: ResearchResult): string {
    return `
<section id="metrics">
  <h2>Quality Metrics</h2>
  <div class="metrics-grid">
    ${this.renderProgressCircle('Overall', result.qualityMetrics.overallScore)}
    ${this.renderProgressCircle('Completeness', result.qualityMetrics.completeness)}
    ${this.renderProgressCircle('Accuracy', result.qualityMetrics.accuracy)}
  </div>
</section>`;
  }
}
```

---

## Feature 6: Platform Adapter Layer 🔌

### Adapter Interface

**File: `src/adapters/platform-adapter.ts`**

```typescript
export interface PlatformAdapter {
  readonly platform: Platform;
  
  // Agent discovery
  discoverAgents(category?: string): Promise<AgentInfo[]>;
  
  // Agent invocation
  invokeAgent(agent: string, objective: string, context: any): Promise<AgentResult>;
  
  // Batch invocation
  invokeAgentsBatch(invocations: AgentInvocation[]): Promise<AgentResult[]>;
  
  // Streaming support
  invokeAgentStream(
    agent: string,
    objective: string,
    onChunk: (chunk: string) => void
  ): Promise<AgentResult>;
  
  // Metadata
  getAgentMetadata(agent: string): Promise<AgentMetadata>;
  
  // Health check
  isAvailable(): Promise<boolean>;
}
```

### Claude Code Adapter

**File: `src/adapters/claude-adapter.ts`**

```typescript
export class ClaudeCodeAdapter implements PlatformAdapter {
  readonly platform = Platform.CLAUDE_CODE;
  private agentDir: string;
  
  constructor(projectRoot: string) {
    this.agentDir = path.join(projectRoot, '.claude', 'agents');
  }
  
  async discoverAgents(category?: string): Promise<AgentInfo[]> {
    const files = await fs.readdir(this.agentDir);
    const agents: AgentInfo[] = [];
    
    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(
          path.join(this.agentDir, file),
          'utf-8'
        );
        const metadata = this.parseMetadata(content);
        
        if (!category || metadata.category === category) {
          agents.push({
            name: file.replace('.md', ''),
            ...metadata
          });
        }
      }
    }
    
    return agents;
  }
  
  async invokeAgent(
    agent: string,
    objective: string,
    context: any
  ): Promise<AgentResult> {
    // Use Task tool (implementation depends on Claude Code SDK)
    return await Task({
      subagent_type: agent,
      prompt: objective,
      context
    });
  }
  
  async invokeAgentsBatch(
    invocations: AgentInvocation[]
  ): Promise<AgentResult[]> {
    // Parallel execution using Task tool
    return Promise.all(
      invocations.map(inv =>
        this.invokeAgent(inv.agent, inv.objective, inv.context)
      )
    );
  }
  
  async invokeAgentStream(
    agent: string,
    objective: string,
    onChunk: (chunk: string) => void
  ): Promise<AgentResult> {
    // Claude Code may not support streaming from CLI
    // Fall back to regular invocation
    return this.invokeAgent(agent, objective, {});
  }
}
```

### OpenCode Adapter

**File: `src/adapters/opencode-adapter.ts`**

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export class OpenCodeAdapter implements PlatformAdapter {
  readonly platform = Platform.OPENCODE;
  private client: Client;
  private transport: StdioClientTransport;
  private connected: boolean = false;
  
  constructor(private projectRoot: string) {}
  
  async connect(): Promise<void> {
    if (this.connected) return;
    
    // Connect to MCP server
    this.transport = new StdioClientTransport({
      command: 'codeflow-mcp-server',
      args: ['--project', this.projectRoot]
    });
    
    this.client = new Client({
      name: 'codeflow-research-cli',
      version: '3.0.0'
    }, {
      capabilities: {
        tools: {},
        resources: {}
      }
    });
    
    await this.client.connect(this.transport);
    this.connected = true;
  }
  
  async discoverAgents(category?: string): Promise<AgentInfo[]> {
    await this.connect();
    
    // Query available MCP tools
    const tools = await this.client.listTools();
    
    // Filter for agent tools
    const agentTools = tools.tools.filter(tool =>
      tool.name.startsWith('codeflow.agent.')
    );
    
    return agentTools.map(tool => ({
      name: tool.name.replace('codeflow.agent.', ''),
      description: tool.description,
      category: tool.metadata?.category,
      capabilities: tool.metadata?.capabilities || []
    }));
  }
  
  async invokeAgent(
    agent: string,
    objective: string,
    context: any
  ): Promise<AgentResult> {
    await this.connect();
    
    const result = await this.client.callTool({
      name: `codeflow.agent.${agent}`,
      arguments: {
        objective,
        context
      }
    });
    
    return {
      agent,
      content: result.content,
      metadata: result.metadata
    };
  }
  
  async invokeAgentsBatch(
    invocations: AgentInvocation[]
  ): Promise<AgentResult[]> {
    await this.connect();
    
    // MCP supports concurrent tool calls
    return Promise.all(
      invocations.map(inv =>
        this.invokeAgent(inv.agent, inv.objective, inv.context)
      )
    );
  }
  
  async invokeAgentStream(
    agent: string,
    objective: string,
    onChunk: (chunk: string) => void
  ): Promise<AgentResult> {
    await this.connect();
    
    // MCP supports streaming
    const stream = await this.client.callToolStream({
      name: `codeflow.agent.${agent}`,
      arguments: { objective }
    });
    
    let fullContent = '';
    
    for await (const chunk of stream) {
      onChunk(chunk.content);
      fullContent += chunk.content;
    }
    
    return {
      agent,
      content: fullContent,
      metadata: {}
    };
  }
  
  async disconnect(): Promise<void> {
    if (this.connected) {
      await this.client.close();
      this.connected = false;
    }
  }
}
```

---

## Feature 7: Enhanced CLI Entry Point

**File: `src/cli/research-enhanced.ts`**

```typescript
import { PlatformDetector, Platform } from '../config/platform-detector.js';
import { ConfigLoader } from '../config/config-loader.js';
import { ClaudeCodeAdapter } from '../adapters/claude-adapter.js';
import { OpenCodeAdapter } from '../adapters/opencode-adapter.js';
import { ThemeManager } from './themes/theme-manager.js';
import { DisplayComponents } from './display/components.js';
import { InteractivePrompts } from './interactive/prompts.js';
import { FormatterFactory, OutputFormat } from '../output/formatters/formatter-factory.js';
import { ResearchWatcher } from './watch/research-watcher.js';

export class EnhancedResearchCLI {
  private platform: Platform;
  private adapter: PlatformAdapter;
  private config: ResearchConfig;
  private theme: Theme;
  private display: DisplayComponents;
  
  constructor(private projectRoot: string) {}
  
  async initialize(): Promise<void> {
    // Detect platform
    this.platform = PlatformDetector.detect(this.projectRoot);
    console.log(`Detected platform: ${this.platform}`);
    
    // Load configuration
    const configLoader = new ConfigLoader();
    this.config = await configLoader.load(this.projectRoot);
    
    // Initialize theme
    const themeManager = new ThemeManager();
    this.theme = themeManager.getTheme(this.config.theme || 'default');
    
    // Create platform adapter
    this.adapter = this.createAdapter(this.platform);
    
    // Initialize display components
    this.display = this.createDisplay(this.platform, this.theme);
  }
  
  private createAdapter(platform: Platform): PlatformAdapter {
    switch (platform) {
      case Platform.CLAUDE_CODE:
        return new ClaudeCodeAdapter(this.projectRoot);
      case Platform.OPENCODE:
        return new OpenCodeAdapter(this.projectRoot);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }
  
  private createDisplay(platform: Platform, theme: Theme): DisplayComponents {
    switch (platform) {
      case Platform.CLAUDE_CODE:
        return new ClaudeDisplay(theme);
      case Platform.OPENCODE:
        return new OpenCodeDisplay(theme);
      default:
        return new DisplayComponents(theme);
    }
  }
  
  async executeInteractive(): Promise<void> {
    this.display.showHeader('🔬 Interactive Research Workflow');
    
    // Interactive prompts
    const prompts = new InteractivePrompts(this.theme);
    const answers = await prompts.gather();
    
    // Execute research
    await this.execute(answers.query, answers.options);
  }
  
  async execute(query: string, options: ResearchOptions): Promise<void> {
    // Show header
    this.display.showHeader(`Research: ${query}`);
    
    // Discover available agents
    const agents = await this.adapter.discoverAgents();
    console.log(`Found ${agents.length} available agents\n`);
    
    // Build workflow phases
    const phases = this.buildPhases(query, options, agents);
    
    // Execute phases
    const results = [];
    for (const phase of phases) {
      this.display.showPhase(phase.name, phase.icon);
      const phaseResults = await this.executePhase(phase);
      results.push(...phaseResults);
    }
    
    // Format and output results
    await this.outputResults(query, results, options);
  }
  
  private async executePhase(phase: WorkflowPhase): Promise<AgentResult[]> {
    if (phase.parallel) {
      // Parallel execution
      return this.adapter.invokeAgentsBatch(phase.invocations);
    } else {
      // Sequential execution
      const results: AgentResult[] = [];
      for (const invocation of phase.invocations) {
        const result = await this.adapter.invokeAgent(
          invocation.agent,
          invocation.objective,
          invocation.context
        );
        results.push(result);
        this.display.showSuccess(`${invocation.agent} completed`);
      }
      return results;
    }
  }
  
  private async outputResults(
    query: string,
    results: AgentResult[],
    options: ResearchOptions
  ): Promise<void> {
    // Synthesize results
    const report = this.synthesizeReport(query, results);
    
    // Format output
    const formatter = FormatterFactory.create(
      options.outputFormat || OutputFormat.TERMINAL,
      this.theme
    );
    
    const formatted = formatter.format(report);
    
    // Output to destination
    if (options.output) {
      await fs.writeFile(options.output, formatted);
      this.display.showSuccess(`Report saved to ${options.output}`);
    } else {
      console.log(formatted);
    }
  }
  
  async executeWatch(query: string, options: WatchOptions): Promise<void> {
    const watcher = new ResearchWatcher();
    await watcher.start({
      query,
      options,
      platform: this.platform,
      patterns: options.patterns || ['src/**/*'],
      ignore: options.ignore,
      debounceMs: options.debounce || 2000
    });
  }
}

// Main CLI function
export async function researchEnhanced(
  query?: string,
  options: any = {}
): Promise<void> {
  const cli = new EnhancedResearchCLI(process.cwd());
  
  try {
    await cli.initialize();
    
    if (options.interactive) {
      await cli.executeInteractive();
    } else if (options.watch) {
      await cli.executeWatch(query!, options);
    } else if (query) {
      await cli.execute(query, options);
    } else {
      await cli.showHelp();
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}
```

---

## Usage Examples

### Claude Code Platform

```bash
# Interactive mode
codeflow research --interactive

# Standard research with config
codeflow research "authentication flow" \
  --config .codeflowrc.json \
  --theme dark \
  --output report.md

# Watch mode
codeflow research "API endpoints" \
  --watch \
  --patterns "src/api/**/*.ts" \
  --debounce 3000

# Multiple output formats
codeflow research "database schema" \
  --output report.html \
  --format html
```

### OpenCode Platform

```bash
# Same commands, different backend
codeflow research --interactive

# With MCP streaming
codeflow research "performance bottlenecks" \
  --stream \
  --verbose

# JSON output for integration
codeflow research "security vulnerabilities" \
  --format json \
  --output findings.json
```

---

## Platform Comparison Matrix

| Feature | Claude Code | OpenCode | Notes |
|---------|------------|----------|-------|
| **Agent Discovery** | File scan (.claude/agents/*.md) | MCP tool enumeration | Both work automatically |
| **Agent Invocation** | Task tool with subagent_type | MCP callTool | Same workflow, different transport |
| **Streaming** | Limited/None | Full support via MCP | OpenCode advantage |
| **Parallel Execution** | Manual Promise.all | Native MCP concurrent | Both supported |
| **Configuration** | .codeflowrc.json | .codeflowrc.json + opencode.json | Shared config format |
| **Interactive Mode** | inquirer prompts | inquirer prompts | Platform agnostic |
| **Watch Mode** | chokidar | chokidar | Platform agnostic |
| **Output Formats** | All supported | All supported | Platform agnostic |
| **Themes** | All themes | All themes | Platform agnostic |

---

## Implementation Plan

### Step 1: Platform Adapter Layer
1. Create `src/adapters/` directory
2. Implement `PlatformAdapter` interface
3. Build `ClaudeCodeAdapter`
4. Build `OpenCodeAdapter`
5. Add platform detection

### Step 2: Configuration System
1. Create `src/config/` directory
2. Implement `ConfigLoader`
3. Add `.codeflowrc.json` schema
4. Support multiple config formats

### Step 3: Interactive Mode
1. Install `inquirer` or `prompts`
2. Create `src/cli/interactive/` directory
3. Build prompt flows
4. Integrate with adapters

### Step 4: Themes & Display
1. Install `chalk`, `boxen`, `ora`, `cli-table3`
2. Create `src/cli/themes/` directory
3. Build `ThemeManager`
4. Create `DisplayComponents`

### Step 5: Output Formats
1. Create `src/output/formatters/` directory
2. Implement each formatter
3. Add HTML templates
4. Add PDF generation (puppeteer)

### Step 6: Watch Mode
1. Install `chokidar`
2. Create `src/cli/watch/` directory
3. Implement file watching
4. Add debouncing

### Step 7: Integration
1. Update `src/cli/research.ts`
2. Add new CLI options
3. Wire up all features
4. Test both platforms

---

## Testing Strategy

### Unit Tests
- Platform detection
- Config loading
- Adapter invocations
- Formatter output

### Integration Tests
- End-to-end workflows
- Platform-specific features
- Cross-platform compatibility

### Manual Testing
- Interactive mode UX
- Watch mode behavior
- Theme rendering
- Output format quality

---

## Next Steps After Phase 3

1. **Performance Optimization**
   - Agent result caching
   - Parallel phase optimization
   - Streaming improvements

2. **Advanced Features**
   - Report comparison
   - Historical tracking
   - Team collaboration
   - CI/CD integration

3. **Documentation**
   - User guides for each platform
   - Video tutorials
   - Example workflows
   - Best practices

4. **Community**
   - Plugin system
   - Custom formatters
   - Theme marketplace
   - Agent templates

---

## Summary

Phase 3 creates a **platform-agnostic enhanced research experience** while leveraging the unique strengths of both Claude Code and OpenCode:

- **Shared**: Interactive mode, config files, themes, output formats, watch mode
- **Claude Code Specific**: Simple Task tool integration, file-based agents
- **OpenCode Specific**: MCP protocol, streaming, advanced tool discovery

The adapter layer ensures the same CLI commands work seamlessly on both platforms, giving users choice without sacrificing functionality.
