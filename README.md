# Agentic

**Modular AI agents and commands for structured software development with OpenCode.**

## What It Does

Agentic is a workflow management system for AI-assisted software development using OpenCode. It provides:

1. **Modular AI Agents & Commands**: Pre-configured prompts and specialized subagents that enhance OpenCode's capabilities through task decomposition and context compression
2. **Structured Development Workflow**: A phased approach (Research → Plan → Execute → Commit → Review) for handling tickets and features
3. **Knowledge Management**: Organized "thoughts" directory structure for storing architecture docs, research, plans, and reviews
4. **Distribution System**: A CLI tool to distribute agent/command configurations to projects via `.opencode` directories

## Purpose

The system aims to:
- Make AI-assisted development more systematic and reproducible
- Reduce context window usage through specialized subagents
- Maintain project knowledge over time (architecture decisions, research, implementation history)
- Provide guardrails for AI agents through structured workflows

## Quick Start

### Installation

```bash
git clone https://github.com/Cluster444/agentic.git
cd agentic
bun install
bun link  # Makes 'agentic' command available globally
```

### Deploy to Your Project

```bash
cd ~/projects/my-app
agentic pull
```

This creates a `.opencode` directory with all agents and commands.

### Development Workflow

1. Create a ticket in `thoughts/tickets/`
2. Use the **research** command to analyze the codebase from the ticket details
3. Use the **plan** command to generate an implementation plan for the ticket using the research
4. Use the **execute** command to implement the changes
5. Use the **commit** command to commit your work
6. Use the **review** command to verify the implementation

Between each phase it is important to inspect the output from each phase and ensure that it is actually in alignment with what you want the project do be and the direction it is going. Errors in these files will cascade to the next phase and produce code that is not what you wanted.

In OpenCode, these commands are invoked with a slash: `/research`, `/plan`, `/execute`, etc.
In most cases you want to provide arguments that may simple by the filename of the ticket, reserach or plan to work with.

## Important Notes

**IMPORTANT**: Between each phase you MUST review the outputs for correctness. This is YOUR job, not the model's. The system may produce working results, but that doesn't mean they are correct for your project. Quality input and review leads to quality output - the more care you put into early research and planning, the smoother the implementation will be!


## Documentation

### Getting Started
- [Usage Guide](./docs/usage.md) - Complete guide to using Agentic
- [Development Workflow](./docs/workflow.md) - Detailed workflow phases

### Core Components
- [Agentic CLI](./docs/agentic.md) - Command-line tool reference
- [Commands](./docs/commands.md) - Available OpenCode commands
- [Agents](./docs/agents.md) - Specialized AI subagents

### Project Structure
- [Thoughts Directory](./docs/thoughts.md) - Knowledge management system
- [Architecture Docs](./docs/architecture.md) - System design documentation

## Requirements

- [Bun](https://bun.sh) runtime
- [OpenCode](https://github.com/opencodeco/opencode) CLI
- Git

## Contributing

This project is in active development. Contributions, ideas, and feedback are welcome!

## License

MIT License - see [LICENSE](./LICENSE) file for details
