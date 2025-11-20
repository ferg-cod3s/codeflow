# Plugin Ecosystem Documentation

A comprehensive guide to the OpenCode plugin ecosystem, including output styles, MCP wrappers, and Anthropic plugin converters.

## Overview

The OpenCode plugin ecosystem provides a robust framework for extending Claude's capabilities through multiple plugin categories:

- **Output Style Plugins**: Modify Claude's response behavior and formatting
- **MCP Wrappers**: Integrate MCP servers as OpenCode plugins
- **Anthropic Converters**: Convert Claude Code plugins to OpenCode format
- **Custom Plugins**: Build specialized functionality

## Plugin Categories

### Output Style Plugins

Output style plugins modify how Claude responds and interacts with users during development sessions.

#### Available Output Styles

1. **Explanatory Output Style** (`explanatory-output-style`)
   - Provides educational insights about implementation choices
   - Shows `★ Insight` markers with key learning points
   - Balances educational content with task completion

2. **Learning Output Style** (`learning-output-style`)
   - Combines interactive learning with educational insights
   - Requests user code contributions at decision points
   - Provides constructive feedback on implementations

3. **Walkthrough Output Style** (`walkthrough-output-style`) 🆕
   - Step-by-step guided learning experiences
   - Shows code patterns without implementing directly
   - Validates user implementations with comprehensive feedback

#### Using Output Style Plugins

```bash
# Install output style plugin
cp plugins/output-styles/walkthrough-output-style/walkthrough-output-style.ts ~/.config/opencode/plugin/

# Configure in OpenCode settings
{
  "plugins": {
    "walkthrough-output-style": {
      "enabled": true,
      "config": {
        "autoWalkthrough": true,
        "showValidation": true
      }
    }
  }
}
```

### MCP Wrapper Plugins

MCP (Model Context Protocol) wrappers enable integration of external tools and services as OpenCode plugins.

#### Supported MCP Servers

1. **Context7 Documentation Research**
   - Library documentation and API research
   - Code examples and implementation patterns
   - Version-specific documentation

2. **Chrome DevTools Inspection**
   - Advanced browser debugging and inspection
   - Performance analysis and optimization
   - DOM manipulation and testing

3. **Socket Security Analysis**
   - npm package security scanning
   - Dependency quality assessment
   - Vulnerability detection

4. **Playwright Web Automation**
   - Browser automation and testing
   - Screenshot capture and analysis
   - Form interaction and validation

5. **Sentry Integration**
   - Error tracking and incident management
   - Performance monitoring
   - Issue analysis and resolution

#### MCP Wrapper Configuration

```typescript
import { createMCPWrapper } from './plugins/mcp-wrappers/mcp-wrapper'

const context7Wrapper = createMCPWrapper({
  serverName: 'context7',
  serverPath: 'mcp-context7-server',
  timeout: 30000,
  autoConnect: true
})
```

### Anthropic Converter Plugins

Converters enable migration from Claude Code plugin format to OpenCode format.

#### Conversion Capabilities

- **Commands**: Direct compatibility (markdown format)
- **Agents**: Wrapped as OpenCode custom tools
- **Hooks**: JSON configs → TypeScript event handlers
- **Skills**: Format adaptation for OpenCode compatibility

#### Conversion Process

```bash
# Convert Claude Code plugin to OpenCode
node -e "
const converter = require('./plugins/anthropic-converters/converter');
const result = await converter.convertPlugin('./claude-plugin');
console.log(result);
"
```

## Development Guide

### Creating Output Style Plugins

1. **Plugin Structure**
   ```
   walkthrough-output-style/
   ├── walkthrough-output-style.ts    # Main plugin implementation
   ├── package.json                 # Plugin metadata
   └── README.md                    # Documentation
   ```

2. **Basic Plugin Template**
   ```typescript
   import type { Plugin } from "@opencode-ai/plugin"

   export const MyOutputStyle: Plugin = async ({ client }) => {
     return {
       event: async ({ event }) => {
         if (event.type === 'session.start') {
           console.log('🎯 My Output Style Active')
         }
       },
       
       tool: {
         execute: {
           before: async (input, output) => {
             // Pre-execution logic
           },
           after: async (input, output) => {
             // Post-execution logic
           }
         }
       }
     }
   }
   ```

3. **Plugin Manifest**
   ```json
   {
     "name": "my-output-style",
     "version": "1.0.0",
     "description": "My custom output style plugin",
     "category": "output-style",
     "main": "my-output-style.ts",
     "keywords": ["output-style", "learning", "education"]
   }
   ```

### Creating MCP Wrappers

1. **Wrapper Structure**
   ```typescript
   import { createMCPWrapper } from './mcp-wrapper'

   const myMCPWrapper = createMCPWrapper({
     serverName: 'my-server',
     serverPath: 'mcp-my-server',
     timeout: 30000,
     autoConnect: true
   })
   ```

2. **Custom MCP Integration**
   ```typescript
   export class CustomMCPWrapper extends MCPWrapper {
     protected async executeCustomTool(tool: string, args: any): Promise<any> {
       // Custom tool execution logic
     }
   }
   ```

### Creating Anthropic Converters

1. **Converter Implementation**
   ```typescript
   import { AnthropicPluginConverter } from './converter'

   const converter = new AnthropicPluginConverter({
     outputDir: './converted',
     convertCommands: true,
     convertAgents: true,
     preserveHooks: true
   })

   const result = await converter.convertPlugin('./claude-plugin')
   ```

2. **Custom Conversion Logic**
   ```typescript
   class CustomConverter extends AnthropicPluginConverter {
     protected convertCustomComponent(source: string, target: string): void {
       // Custom conversion logic
     }
   }
   ```

## Plugin Registry

The plugin registry provides centralized management of all installed plugins.

### Registry Operations

```typescript
import { pluginRegistry } from './src/plugins/registry'

// Register a plugin
pluginRegistry.register(metadata, plugin)

// Get a specific plugin
const plugin = pluginRegistry.get('plugin-name')

// Get plugins by category
const outputStyles = pluginRegistry.getByCategory('output-style')

// Enable/disable plugins
pluginRegistry.setEnabled('plugin-name', false)

// Get statistics
const stats = pluginRegistry.getStats()
```

### Registry Statistics

```typescript
interface RegistryStats {
  total: number           // Total registered plugins
  enabled: number         // Number of enabled plugins
  disabled: number        // Number of disabled plugins
  byCategory: Record<string, number>  // Plugins per category
}
```

## Plugin Validation

Comprehensive validation ensures plugin quality and compatibility.

### Validation Categories

1. **Required Fields**: Essential plugin metadata
2. **Format Validation**: Correct data types and patterns
3. **Compatibility**: OpenCode format compliance
4. **Security**: Safe plugin practices
5. **Best Practices**: Development guidelines

### Validation Process

```typescript
import { PluginValidator } from './src/plugins/validator'

const validator = new PluginValidator()
const result = await validator.validatePlugin('./plugin-path')

if (result.valid) {
  console.log('✅ Plugin is valid')
} else {
  console.log('❌ Plugin validation failed:')
  result.errors.forEach(error => {
    console.log(`  ${error.field}: ${error.message}`)
  })
}
```

### Validation Results

```typescript
interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  summary: ValidationSummary
}
```

## Configuration

### OpenCode Plugin Configuration

```json
{
  "plugins": {
    "walkthrough-output-style": {
      "enabled": true,
      "config": {
        "autoWalkthrough": true,
        "showValidation": true,
        "progressiveDisclosure": true
      }
    },
    "mcp-context7": {
      "enabled": true,
      "config": {
        "serverPath": "mcp-context7-server",
        "timeout": 30000,
        "autoConnect": true
      }
    }
  }
}
```

### Environment Variables

```bash
# Plugin directories
export OPENCODE_PLUGIN_PATH="~/.config/opencode/plugin"
export OPENCODE_PLUGIN_CACHE="~/.config/opencode/cache"

# MCP server paths
export MCP_CONTEXT7_SERVER_PATH="/usr/local/bin/mcp-context7-server"
export MCP_PLAYWRIGHT_SERVER_PATH="/usr/local/bin/mcp-playwright-server"

# Validation settings
export PLUGIN_VALIDATION_STRICT="true"
export PLUGIN_VALIDATION_TIMEOUT="30000"
```

## Testing

### Running Tests

```bash
# Run all plugin tests
npm test

# Run specific test suites
npm test -- plugins.test.ts
npm test -- validator.test.ts
npm test -- converter.test.ts

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Test Structure

```
tests/
├── plugins.test.ts           # Plugin registry tests
├── validator.test.ts         # Validation logic tests
├── converter.test.ts         # Anthropic converter tests
├── mcp-wrapper.test.ts      # MCP wrapper tests
└── integration/              # Integration test scenarios
    ├── full-workflow.test.ts
    └── plugin-interaction.test.ts
```

## Best Practices

### Plugin Development

1. **Follow Conventions**: Use established patterns and naming
2. **Provide Documentation**: Include comprehensive README files
3. **Handle Errors**: Implement robust error handling
4. **Test Thoroughly**: Cover edge cases and integration scenarios
5. **Version Properly**: Use semantic versioning

### Plugin Distribution

1. **Package Structure**: Follow standard plugin directory layout
2. **Metadata Quality**: Complete and accurate package.json
3. **Dependency Management**: Specify exact versions
4. **License Clarity**: Include appropriate license
5. **Examples**: Provide usage examples and tutorials

### Performance Considerations

1. **Lazy Loading**: Load resources only when needed
2. **Memory Management**: Clean up resources properly
3. **Async Operations**: Use non-blocking operations
4. **Caching**: Cache expensive operations
5. **Timeouts**: Implement reasonable timeouts

## Troubleshooting

### Common Issues

1. **Plugin Not Loading**
   - Check plugin manifest format
   - Verify main file exists
   - Ensure proper exports

2. **Validation Failures**
   - Review error messages
   - Check required fields
   - Verify format compliance

3. **MCP Connection Issues**
   - Verify server installation
   - Check server path configuration
   - Test server connectivity

4. **Performance Problems**
   - Profile plugin execution
   - Check for memory leaks
   - Optimize expensive operations

### Debug Mode

```typescript
// Enable debug logging
const debugPlugin = createMCPWrapper({
  serverName: 'debug-server',
  serverPath: 'mcp-debug-server',
  debug: true,
  verbose: true
})
```

### Getting Help

1. **Documentation**: Check plugin-specific README files
2. **Examples**: Review implementation examples
3. **Community**: Ask questions in relevant forums
4. **Issues**: Report bugs and feature requests

## Roadmap

### Upcoming Features

1. **Plugin Marketplace**: Centralized plugin distribution
2. **GUI Configuration**: Visual plugin management
3. **Advanced Debugging**: Enhanced debugging tools
4. **Performance Monitoring**: Built-in performance metrics
5. **Security Scanning**: Automated security validation

### Contribution Guidelines

1. **Code Style**: Follow established coding standards
2. **Testing**: Include comprehensive tests
3. **Documentation**: Update relevant documentation
4. **Review Process**: Submit pull requests for review
5. **Community**: Participate in discussions and feedback

## Resources

### Documentation
- [Plugin API Reference](./src/plugins/types.ts)
- [Conversion Guide](./plugins/anthropic-converters/)
- [MCP Integration](./plugins/mcp-wrappers/)
- [Validation Rules](./src/plugins/validator.ts)

### Examples
- [Output Style Examples](./plugins/output-styles/)
- [MCP Wrapper Examples](./plugins/mcp-wrappers/)
- [Conversion Examples](../examples/poc-anthropic-plugins/)

### External Resources
- [OpenCode Documentation](https://opencode.ai/docs)
- [MCP Specification](https://modelcontextprotocol.io/)
- [Claude Code Plugins](https://github.com/anthropics/claude-code/tree/main/plugins)
- [Plugin Development Guide](https://code.claude.com/docs/en/plugins)