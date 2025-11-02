# CodeFlow Architecture Overview



<!-- VERBALIZED SAMPLING INTEGRATION -->
<!-- ================================ -->

**Selected Strategy**: Code-Path Analysis
**Confidence**: 71.0%

**Available Strategies**:
1. **Code-Path Analysis** (Confidence: 71.0%)
   - Plan: Identify entry points and main execution flows, Trace key decision branches and conditional logic...
2. **Pattern Discovery** (Confidence: 71.0%)
   - Plan: Scan codebase for repeated code structures, Identify naming conventions and architectural patterns...
3. **Architecture Mapping** (Confidence: 71.0%)
   - Plan: Identify major components and modules, Map data flow and dependencies between components...


---

## Canonical Agent Directory Policy

- `/codeflow-agents/` is the ONLY agent directory that should exist in the repository and is the single source of truth for all agent definitions.
- All agent configuration, schema, and updates must be made exclusively in this directory.
- Platform-specific agent directories such as `.claude/agents/`, `opencode-agents/`, etc. are NOT maintained in the repository. They are automatically generated as build artifacts during the `codeflow sync` CLI process and should not be manually edited or committed.
- Only `/codeflow-agents/` should be tracked in version control. Platform-specific agent directories should be listed in `.gitignore` to prevent accidental commits.

**Example `.gitignore` Entries:**

```
# Ignore generated agent directories (do not commit these)
.claude/agents/
opencode-agents/
```

---

## 🎯 **Single Format Architecture**

CodeFlow uses a **single source of truth** approach for agent definitions. All agents are stored in the `codeflow-agents/` directory using a unified `BaseAgent` format, which gets automatically converted to platform-specific formats as needed.

### **Core Design Principles**

- **Single Source of Truth**: All agents defined once in `BaseAgent` format
- **Automatic Conversion**: Seamless conversion to platform-specific formats
- **Unified Validation**: One validation schema for all agents
- **Format Flexibility**: Easy to add new output formats
- **Consistent Behavior**: Same agent behavior across all platforms

## 🔄 **Format Conversion Engine**

### **BaseAgent Interface**

The `BaseAgent` interface serves as the single source of truth:

```typescript
interface BaseAgent {
  name: string; // Required: unique identifier
  description: string; // Required: agent purpose
  mode?: 'subagent' | 'primary' | 'agent'; // Optional: agent type
  temperature?: number; // Optional: creativity level (0-2)
  model?: string; // Optional: AI model identifier
  tools?: Record<string, boolean>; // Optional: available tools

  // OpenCode-specific fields (optional)
  usage?: string; // When to use this agent
  do_not_use_when?: string; // When NOT to use this agent
  escalation?: string; // Escalation procedures
  examples?: string; // Usage examples
  prompts?: string; // Suggested prompts
  constraints?: string; // Usage constraints
}
```

### **Supported Output Formats**

1. **Base Format** (`codeflow-agents/`) - Single source of truth
2. **Claude Code Format** (`claude-agents/`) - For Claude Code subagents
3. **OpenCode Format** (`opencode-agents/`) - For OpenCode platform

### **Conversion Rules**

- **Base → Claude Code**: Tools converted from object to comma-separated string
- **Base → OpenCode**: Full structure preserved with model format conversion
- **Claude Code → Base**: Tools converted from string to object, missing fields set to undefined
- **OpenCode → Base**: Full structure preserved

## 🔒 **Agent Permissions and Allowed Directories**

- **Source of Truth:** For all OpenCode agents, the only source of truth for permissions and allowed directories is the YAML frontmatter in each agent file (e.g., `.opencode/agent/*.md`).
- **No External Config:** No external `.opencode/permissions.json` or other config file is used for permissions or allowed directories. All updates, syncs, and validations operate directly on the agent file frontmatter.
- **Override Order:** Project-specific agent files always override global or built-in agents during sync and setup.
- **Validation:** The sync and validation logic will warn or error if agent frontmatter is malformed or missing required permission fields.

## 🏗️ **System Architecture**

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   CLI Commands  │───▶│  Format Converter │───▶│  Agent Parser   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  User Interface │    │  Validation      │    │  File System    │
│                 │    │  Engine          │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Key Components**

1. **CLI Module** (`src/cli/`) - Command parsing and execution
2. **Conversion Engine** (`src/conversion/`) - Format transformation
3. **Validation** (`src/validation/`) - Agent schema validation
4. **Agent Parser** (`src/agent-parser/`) - Markdown frontmatter parsing

## 📁 **Directory Structure**

```
codeflow/
├── codeflow-agents/          # Single source of truth (BaseAgent format)
│   ├── development/          # Development-focused agents
│   │   ├── full-stack-developer.md
│   │   ├── code-reviewer.md
│   │   └── debugger.md
│   ├── operations/           # Operations-focused agents
│   └── analysis/             # Analysis-focused agents
├── claude-agents/            # Auto-generated Claude Code format
├── opencode-agents/          # Auto-generated OpenCode format
├── src/
│   ├── cli/                  # CLI implementation
│   ├── conversion/           # Format conversion engine
│   └── validation/           # Agent validation
└── tests/                    # Test suite
```

## 🔧 **Integration Methods**

CodeFlow supports three different integration approaches depending on your coding environment:

### **1. Claude Code (.ai) - Native Integration**

**For Claude Code with built-in agent and command systems:**

- **Agents**: Global `~/.claude/agents/` (accessible via Task tool)
- **Commands**: Project `.claude/commands/` (native slash commands)
- **Setup**: `codeflow setup --type claude-code`
- **Usage**: `/research`, `/plan`, `/execute` directly in interface

### **2. OpenCode - Native Integration**

**For OpenCode with built-in agent and command systems:**

- **Agents**: Global `~/.config/opencode/agent/` (native agent selection)
- **Commands**: Global `~/.config/opencode/command/` + project `.opencode/command/`
- **Setup**: `codeflow setup --type opencode`
- **Usage**: Slash commands in OpenCode terminal interface

### **3. MCP Server Integration (Cursor, VS Code, etc.)**

**For coding assistants that lack native agent systems:**

- **Purpose**: Bridge for environments without built-in agent customization
- **Location**: Agents exposed as MCP tools
- **Setup**: `codeflow mcp start` + configure MCP client
- **Usage**: Tools appear in Cursor/VS Code when server running

## 🚀 **Usage Examples**

### **Claude Code (Native Slash Commands)**

```
/research research/tickets/auth-feature.md - analyze authentication requirements

/plan research/research/2025-08-25_auth-research.md - create implementation plan

/execute research/plans/auth-implementation-plan.md - implement the feature
```

### **OpenCode (Native Commands)**

```
/research research/tickets/auth-feature.md - analyze authentication requirements

/plan research/research/2025-08-25_auth-research.md - create implementation plan

/execute research/plans/auth-implementation-plan.md - implement the feature
```

### **Cursor/VS Code (MCP Tools)**

```
Use tool: research
Input: "research/tickets/auth-feature.md - analyze authentication requirements"

Use tool: plan
Input: "research/research/2025-08-25_auth-research.md - create implementation plan"

Use tool: execute
Input: "research/plans/auth-implementation-plan.md - implement the feature"
```

## 🛠️ **Development Workflow**

### **Agent Development:**

1. **Edit agents** in `codeflow-agents/*.md` (BaseAgent format)
2. **Run validation** with `codeflow validate`
3. **Convert to formats** with `codeflow convert-all`
4. **Test across platforms** to ensure consistency

### **Adding New Formats:**

1. Extend the `BaseAgent` interface with new fields
2. Add conversion methods in `FormatConverter`
3. Update validation rules in `AgentValidator`
4. Add tests for the new format

### **Command Development:**

1. **Edit source commands** in `codeflow-agents/command/*.md`
2. **Test in Claude Code** directly (if available)
3. **Deploy to projects** with `codeflow pull`
4. **Test MCP integration** with server restart

## 🔍 **Validation & Quality Assurance**

### **Validation Rules**

- **Required Fields**: `name` and `description` must be present
- **Name Format**: Lowercase letters, numbers, and hyphens only
- **Mode Values**: Must be `'subagent'`, `'primary'`, or `'agent'`
- **Temperature Range**: Must be between 0 and 2
- **Tools Format**: Must be object with boolean values

### **Quality Checks**

- **Round-trip Conversion**: Ensures data integrity through format changes
- **Cross-format Validation**: Consistent validation across all formats
- **Performance Testing**: Conversion and validation performance benchmarks
- **Integration Testing**: End-to-end workflow validation

## 📊 **Performance Characteristics**

### **Conversion Performance**

- **Single Agent**: < 10ms
- **Batch Conversion**: < 100ms for 50 agents
- **Validation**: < 50ms for 50 agents
- **Round-trip**: < 20ms per agent

### **Memory Usage**

- **Agent Parsing**: ~2MB for 100 agents
- **Conversion Cache**: ~5MB for format conversions
- **Validation Cache**: ~3MB for validation results

## 🔮 **Future Extensibility**

### **Planned Format Support**

- **LangChain Format**: For LangChain agent integration
- **AutoGen Format**: For AutoGen multi-agent systems
- **Custom JSON**: For API-based integrations

### **Advanced Features**

- **Agent Composition**: Combine multiple agents into workflows
- **Dynamic Loading**: Load agents on-demand from remote sources
- **Version Control**: Track agent changes and rollbacks
- **Performance Profiling**: Monitor agent usage and optimization

## 🧪 **Testing Strategy**

### **Test Categories**

1. **Unit Tests**: Individual component testing
2. **Integration Tests**: Component interaction testing
3. **End-to-End Tests**: Complete workflow validation
4. **Performance Tests**: Performance and scalability validation

### **Test Coverage**

- **Code Coverage**: >90% for critical paths
- **Format Coverage**: All supported formats tested
- **Edge Cases**: Error handling and boundary conditions
- **Cross-platform**: Validation across different environments

This architecture provides **maximum flexibility** while maintaining **consistency** across different AI platforms and development workflows, with a single source of truth that eliminates duplication and sync issues.
