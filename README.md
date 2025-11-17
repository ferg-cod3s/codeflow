# CodeFlow CLI

A TypeScript CLI tool to convert base-agents, commands, and skills to OpenCode format.

## Features

- **Agent Conversion**: Convert base-agents to OpenCode agent format
- **Command Conversion**: Convert commands to OpenCode command format  
- **Skill Conversion**: Convert skills to OpenCode skill format
- **Validation**: Comprehensive validation of converted files
- **Batch Processing**: Convert all files at once
- **Dry Run Mode**: Preview conversions without writing files

## Installation

```bash
npm install -g codeflow-cli
```

## Usage

### Convert Agents

Convert base-agents to OpenCode format:

```bash
codeflow convert agents --output ./opencode-agents
```

### Convert Commands

Convert commands to OpenCode format:

```bash
codeflow convert commands --output ./opencode-commands
```

### Convert Skills

Convert skills to OpenCode format:

```bash
codeflow convert skills --output ./opencode-skills
```

### Full Migration

Convert all agents, commands, and skills:

```bash
codeflow migrate --output ./converted
```

### Validation

Validate converted files:

```bash
codeflow validate ./opencode-agents --format opencode-agent
```

### Dry Run

Preview conversions without writing files:

```bash
codeflow convert agents --dry-run
```

## Options

### Global Options

- `-v, --version`: Show version
- `-h, --help`: Show help

### Convert Command Options

- `-o, --output <dir>`: Output directory (default: ./converted)
- `-d, --dry-run`: Show what would be converted without writing files
- `-v, --validation <level>`: Validation level (strict, lenient, off)

### Migrate Command Options

- `-o, --output <dir>`: Output directory (default: ./converted)
- `-d, --dry-run`: Show what would be migrated without writing files
- `-v, --validation <level>`: Validation level (strict, lenient, off)
- `--agents-only`: Only migrate agents
- `--commands-only`: Only migrate commands
- `--skills-only`: Only migrate skills

### Validate Command Options

- `-f, --format <type>`: Format type (opencode-agent, opencode-command, opencode-skill)
- `-r, --report <file>`: Save validation report to file

## Project Structure

```
.
├── base-agents/          # Source agent definitions
├── commands/              # Source command definitions
├── skills/                # Source skill definitions
└── converted/             # Output directory
    ├── agents/            # Converted OpenCode agents
    ├── commands/          # Converted OpenCode commands
    └── skills/            # Converted OpenCode skills
```

## Conversion Details

### Agent Conversion

Maps base-agent fields to OpenCode format:

- `name` → `name`
- `description` → `description`
- `mode` → `mode`
- `temperature` → `temperature`
- `tools` → `tools` (with mapping)
- `permission` → `permission`
- Additional fields → integrated into prompt

### Command Conversion

Converts command definitions to OpenCode command format:

- Frontmatter becomes command metadata
- Body becomes command template
- Preserves agent and model assignments

### Skill Conversion

Converts skill definitions to OpenCode skill format:

- Frontmatter becomes skill metadata
- Body becomes skill prompt
- Preserves noReply setting

## Validation

The CLI validates converted files for:

- Required fields presence
- Data type correctness
- Format compliance
- Best practices

## Examples

### Basic Conversion

```bash
# Convert agents with default settings
codeflow convert agents

# Convert to specific output directory
codeflow convert agents --output ./my-agents

# Dry run to preview changes
codeflow convert agents --dry-run
```

### Full Migration

```bash
# Migrate everything
codeflow migrate

# Migrate only agents
codeflow migrate --agents-only

# Migrate with strict validation
codeflow migrate --validation strict
```

### Validation

```bash
# Validate agent files
codeflow validate ./converted/agents --format opencode-agent

# Save validation report
codeflow validate ./converted --format opencode-agent --report report.json
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development
npm run dev

# Test
npm test
```

## License

MIT