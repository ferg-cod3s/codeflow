# Claude-to-OpenCode Plugin Integration Roadmap

## Quick Reference

**Goal**: Enable Claude Code plugins to work with OpenCode

**Status**: ⚠️ Partial compatibility possible with conversion

**Recommended Approach**: Extend CodeFlow CLI with plugin conversion capabilities

---

## What Works Today (Zero Effort)

### ✅ Commands

**Both systems use the same format!**

Claude Code Command:
```markdown
---
description: "Run security scan"
---
Perform security analysis...
```

OpenCode Command:
```markdown
---
description: "Run security scan"
---
Perform security analysis...
```

**Migration Steps**:
```bash
# Copy Claude Code commands to OpenCode
cp -r .claude-plugin/commands/* .opencode/command/

# Or use CodeFlow CLI
codeflow convert commands --output .opencode/command/
```

---

## What Needs Conversion

### ⚠️ Agents (Medium Difficulty)

**Challenge**: Claude Code uses markdown agents, OpenCode doesn't have native agent support

**Solution**: Convert agents to custom tools

**Example**:

Claude Code Agent (`agents/python_pro.md`):
```yaml
---
description: Python expert
mode: subagent
temperature: 0.1
---
You are a Python expert...
```

Becomes OpenCode Tool:
```typescript
{
  name: "python_pro",
  description: "Python expert",
  args: z.object({ task: z.string() }),
  execute: async ({ task }) => {
    return await client.chat({
      messages: [{ role: "user", content: agentPrompt }],
      temperature: 0.1
    })
  }
}
```

### ⚠️ Skills (Medium Difficulty)

Similar to agents - convert to custom tools in OpenCode plugins

### 🔴 Hooks (Hard - Requires Code Generation)

**Challenge**: Claude Code uses JSON config, OpenCode uses TypeScript event handlers

Claude Code Hook:
```json
{
  "PostToolUse": {
    "command": "./scripts/validate.sh"
  }
}
```

OpenCode Hook:
```typescript
tool: {
  execute: {
    after: async (input, output) => {
      await $`./scripts/validate.sh`
    }
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Deliverables**:
- [ ] Research documentation (DONE ✓)
- [ ] Integration guide (DONE ✓)
- [ ] Update CodeFlow CLI to support `.opencode/command/` output
- [ ] Test command migration with real examples

**Effort**: 2-3 days

### Phase 2: Plugin Converter (Week 2-3)

**Deliverables**:
- [ ] New `PluginConverter` class
- [ ] Parse `plugin.json` and component directories
- [ ] Generate OpenCode plugin wrapper TypeScript
- [ ] Agent-to-tool conversion logic
- [ ] Hook-to-event conversion logic
- [ ] Template system for generated code

**New Files**:
```
src/converters/plugin-converter.ts
src/generators/opencode-plugin-generator.ts
src/types/plugin-types.ts
templates/opencode-plugin.template.ts
tests/plugin-converter.test.ts
```

**CLI Command**:
```bash
codeflow convert plugin \
  --input ./my-claude-plugin \
  --output ./my-opencode-plugin
```

**Effort**: 5-7 days

### Phase 3: Testing & Examples (Week 3-4)

**Deliverables**:
- [ ] Integration test suite
- [ ] Example conversions (3-5 real plugins)
- [ ] Migration guide with screenshots
- [ ] Troubleshooting documentation
- [ ] Video tutorial

**Effort**: 3-4 days

### Phase 4: Community Release (Week 4)

**Deliverables**:
- [ ] Update README with plugin conversion features
- [ ] Publish to npm
- [ ] Announcement blog post
- [ ] Share in Claude Code and OpenCode communities
- [ ] Create GitHub discussions for feedback

**Effort**: 1-2 days

---

## Technical Implementation Details

### New CLI Command Structure

```typescript
// src/cli/commands/convert-plugin.ts
import { Command } from 'commander';
import { PluginConverter } from '../converters/plugin-converter';

export const convertPluginCommand = new Command('plugin')
  .description('Convert Claude Code plugin to OpenCode format')
  .requiredOption('-i, --input <dir>', 'Claude Code plugin directory')
  .requiredOption('-o, --output <dir>', 'Output directory for OpenCode plugin')
  .option('-d, --dry-run', 'Preview conversion without writing files')
  .option('--skip-hooks', 'Skip hook conversion')
  .option('--skip-agents', 'Skip agent conversion')
  .action(async (options) => {
    const converter = new PluginConverter();
    const result = await converter.convertPlugin(
      options.input,
      options.output,
      {
        dryRun: options.dryRun,
        skipHooks: options.skipHooks,
        skipAgents: options.skipAgents
      }
    );

    console.log(`✅ Converted: ${result.converted}`);
    console.log(`❌ Failed: ${result.failed}`);
  });
```

### Plugin Converter Architecture

```typescript
// src/converters/plugin-converter.ts
export class PluginConverter {
  async convertPlugin(
    inputDir: string,
    outputDir: string,
    options: ConverterOptions
  ): Promise<ConversionResult> {
    // 1. Parse plugin.json
    const pluginConfig = await this.parsePluginManifest(inputDir);

    // 2. Convert components
    const commands = await this.convertCommands(inputDir);
    const agents = await this.convertAgents(inputDir);
    const hooks = await this.convertHooks(inputDir);

    // 3. Generate OpenCode plugin TypeScript
    const pluginCode = await this.generatePluginWrapper({
      config: pluginConfig,
      agents,
      hooks
    });

    // 4. Write output files
    await this.writeOpenCodePlugin(outputDir, {
      pluginCode,
      commands,
      packageJson: this.generatePackageJson(pluginConfig)
    });

    return result;
  }

  private async generatePluginWrapper(components: PluginComponents): Promise<string> {
    // Use template engine to generate TypeScript
    return this.templateEngine.render('opencode-plugin', components);
  }
}
```

### Template System

```typescript
// templates/opencode-plugin.template.ts
export const opencodePluginTemplate = `
import type { Plugin } from "@opencode-ai/plugin"
import { z } from "zod"

export const {{pluginName}}: Plugin = async ({ client, $, directory }) => {
  {{#agents}}
  // Agent: {{name}}
  const {{camelCase name}}Tool = {
    name: "{{snakeCase name}}",
    description: "{{description}}",
    args: z.object({
      task: z.string()
    }),
    execute: async ({ task }) => {
      const response = await client.chat({
        messages: [{ role: "user", content: \`{{prompt}}\` }],
        temperature: {{temperature}}
      })
      return response
    }
  }
  {{/agents}}

  return {
    {{#agents}}
    tool: {{camelCase name}}Tool,
    {{/agents}}

    {{#hooks}}
    // Hook: {{name}}
    {{hookCode}}
    {{/hooks}}
  }
}
`;
```

---

## Example Conversions

### Example 1: Simple Command Plugin

**Input**: Plugin with only commands
**Complexity**: Low
**Time**: < 1 minute
**Success Rate**: 100%

### Example 2: Agent-Heavy Plugin

**Input**: Plugin with 5 agents, no hooks
**Complexity**: Medium
**Time**: 2-3 minutes
**Success Rate**: 90%

### Example 3: Full-Featured Plugin

**Input**: Commands + Agents + Hooks + MCP
**Complexity**: High
**Time**: 5-10 minutes
**Success Rate**: 70% (manual tweaking needed)

---

## Known Limitations

### Cannot Convert Automatically

1. **Complex Hook Logic**: Hooks with shell scripts requiring environment-specific setup
2. **MCP Server Configurations**: May need manual OpenCode MCP setup
3. **Custom Directory Structures**: Non-standard plugin layouts
4. **Conditional Logic in Hooks**: Advanced hook conditions

### Manual Intervention Required

1. **Environment Variables**: May need remapping
2. **File Paths**: Adjust for OpenCode directory structure
3. **Dependencies**: Install npm packages for generated plugin
4. **Testing**: Verify generated plugin works as expected

---

## Success Metrics

### Phase 1
- [ ] 100% of commands migrate successfully
- [ ] Documentation complete
- [ ] CLI updated with command support

### Phase 2
- [ ] 80%+ of agents convert without errors
- [ ] 60%+ of hooks convert without errors
- [ ] Template system supports 5+ common patterns

### Phase 3
- [ ] 3+ real-world plugin conversions completed
- [ ] Test coverage > 80%
- [ ] Migration guide tested by 3+ users

### Phase 4
- [ ] 100+ GitHub stars on updated repo
- [ ] 10+ community conversions
- [ ] Integration into OpenCode community resources

---

## Risk Mitigation

### Risk 1: OpenCode API Changes
**Mitigation**: Pin to specific OpenCode version, maintain compatibility matrix

### Risk 2: Complex Plugin Logic
**Mitigation**: Start with simple plugins, gradually increase complexity, document limitations

### Risk 3: Community Adoption
**Mitigation**: Provide excellent documentation, video tutorials, responsive support

### Risk 4: Maintenance Burden
**Mitigation**: Automated testing, clear contribution guidelines, community involvement

---

## Resources Needed

### Development
- **Time**: 2-3 weeks (60-80 hours)
- **Skills**: TypeScript, OpenCode API, Template engines
- **Tools**: Existing CodeFlow CLI infrastructure

### Testing
- **Plugins**: 5-10 real Claude Code plugins for testing
- **Environments**: Both Claude Code and OpenCode installations
- **Testers**: 3-5 beta testers from community

### Documentation
- **Writer**: Technical documentation skills
- **Designer**: Diagrams and visual aids
- **Video**: Screen recording and editing tools

---

## Future Enhancements

### v1.1
- [ ] Bidirectional conversion (OpenCode → Claude Code)
- [ ] Plugin optimization (combine similar agents)
- [ ] Validation and linting for generated code

### v1.2
- [ ] Interactive conversion wizard
- [ ] Plugin diff viewer
- [ ] Automated testing generation

### v2.0
- [ ] Real-time plugin sync
- [ ] Plugin marketplace integration
- [ ] AI-assisted manual interventions

---

## Questions for Community

1. **Priority**: Should we focus on simple plugins first or tackle complex ones?
2. **Naming**: Keep "CodeFlow CLI" or rename to "Plugin Converter CLI"?
3. **Distribution**: npm only or also standalone binary?
4. **Contribution**: Open to community PRs from day 1?

---

## Get Started

### For Users

**Today**: Copy commands manually
```bash
cp -r .claude-plugin/commands/* .opencode/command/
```

**Soon**: Use CodeFlow CLI
```bash
codeflow convert plugin --input ./my-plugin --output ./converted
```

### For Contributors

**Interested in helping?**
1. Review docs/CLAUDE_TO_OPENCODE_PLUGIN_INTEGRATION.md
2. Check GitHub issues labeled `plugin-conversion`
3. Join discussions in GitHub Discussions
4. Submit PRs for Phase 1 implementation

---

**Last Updated**: 2025-11-17
**Status**: Planning → Ready for Implementation
**Next Milestone**: Phase 1 completion
