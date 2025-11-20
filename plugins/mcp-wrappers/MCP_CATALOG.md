# MCP Server Catalog

This document catalogs MCP (Model Context Protocol) servers that can be wrapped as OpenCode plugins.

## Current MCP Environment

Based on the available tools in this session, here are the MCP servers currently integrated:

### Core MCP Servers
- **Context7 Documentation Research** - `/org/context7` library documentation system
- **Chrome DevTools Inspection** - Advanced browser debugging and inspection
- **Socket Security Analysis** - npm package security and quality scanning
- **Playwright Web Automation** - Browser automation and testing
- **Sentry Integration** - Error tracking and incident management
- **Coolify Application Management** - Self-hosting platform management
- **GitHub Automation** - Repository and workflow automation

### Specialized MCP Servers
- **Algorithmic Art (p5.js)** - Generative art creation
- **Canvas Design** - Visual design and poster creation
- **Slack GIF Creator** - Animated GIF creation for Slack
- **Document Skills** - Office document manipulation (docx, pptx, pdf, xlsx)
- **Theme Factory** - Artifact styling and theming

## MCP Wrapper Implementation

### Available Wrappers

#### 1. Documentation & Research
```typescript
import { createMCPWrapper } from './mcp-wrappers/mcp-wrapper'

const context7Wrapper = createMCPWrapper({
  serverName: 'context7',
  serverPath: 'mcp-context7-server',
  timeout: 30000,
  autoConnect: true
})
```

#### 2. Development Tools
```typescript
const playwrightWrapper = createMCPWrapper({
  serverName: 'playwright',
  serverPath: 'mcp-playwright-server',
  timeout: 60000,
  autoConnect: true
})

const chromeDevtoolsWrapper = createMCPWrapper({
  serverName: 'chrome-devtools',
  serverPath: 'mcp-chrome-devtools-server',
  timeout: 30000,
  autoConnect: true
})
```

#### 3. Security & Quality
```typescript
const socketWrapper = createMCPWrapper({
  serverName: 'socket',
  serverPath: 'mcp-socket-server',
  timeout: 20000,
  autoConnect: true
})
```

#### 4. DevOps & Infrastructure
```typescript
const sentryWrapper = createMCPWrapper({
  serverName: 'sentry',
  serverPath: 'mcp-sentry-server',
  timeout: 30000,
  autoConnect: true
})

const githubWrapper = createMCPWrapper({
  serverName: 'github',
  serverPath: 'mcp-github-server',
  timeout: 45000,
  autoConnect: true
})
```

#### 5. Design & Creative
```typescript
const canvasWrapper = createMCPWrapper({
  serverName: 'canvas',
  serverPath: 'mcp-canvas-server',
  timeout: 30000,
  autoConnect: true
})

const algorithmicArtWrapper = createMCPWrapper({
  serverName: 'algorithmic-art',
  serverPath: 'mcp-algorithmic-art-server',
  timeout: 60000,
  autoConnect: true
})
```

## Plugin Integration Strategy

### Phase 1: Core Development Tools
1. **Context7 Documentation** - Essential for library research
2. **Playwright Web Automation** - Testing and automation
3. **Chrome DevTools** - Debugging and inspection
4. **Socket Security** - Package security scanning

### Phase 2: DevOps & Monitoring
5. **Sentry Integration** - Error tracking and management
6. **GitHub Automation** - Repository operations
7. **Coolify Management** - Application deployment

### Phase 3: Specialized Tools
8. **Document Skills** - Office document manipulation
9. **Design Tools** - Canvas and algorithmic art
10. **Communication** - Slack integration

## Configuration Examples

### OpenCode Plugin Configuration
```json
{
  "plugins": {
    "mcp-context7": {
      "enabled": true,
      "config": {
        "serverPath": "mcp-context7-server",
        "timeout": 30000,
        "autoConnect": true
      }
    },
    "mcp-playwright": {
      "enabled": true,
      "config": {
        "serverPath": "mcp-playwright-server",
        "timeout": 60000,
        "autoConnect": true
      }
    }
  }
}
```

### Environment Variables
```bash
# MCP Server Paths
export MCP_CONTEXT7_SERVER_PATH="/usr/local/bin/mcp-context7-server"
export MCP_PLAYWRIGHT_SERVER_PATH="/usr/local/bin/mcp-playwright-server"
export MCP_SENTRY_SERVER_PATH="/usr/local/bin/mcp-sentry-server"

# Timeouts and Retries
export MCP_DEFAULT_TIMEOUT=30000
export MCP_RETRY_ATTEMPTS=3
```

## Installation Guide

### 1. Install MCP Servers
```bash
# Using npm
npm install -g @modelcontextprotocol/server-context7
npm install -g @modelcontextprotocol/server-playwright
npm install -g @modelcontextprotocol/server-chrome-devtools

# Using pip
pip install mcp-context7-server
pip install mcp-playwright-server
```

### 2. Configure OpenCode
```bash
# Copy MCP wrapper plugins
cp plugins/mcp-wrappers/*.ts ~/.config/opencode/plugin/

# Or add to project
cp plugins/mcp-wrappers/*.ts .opencode/plugin/
```

### 3. Update Configuration
Add MCP server configuration to your OpenCode settings.

## Usage Examples

### Documentation Research
```typescript
// Using Context7 through MCP wrapper
const docs = await mcpContext7.getLibraryDocs('react', 'hooks')
```

### Web Automation
```typescript
// Using Playwright through MCP wrapper
const screenshot = await mcpPlaywright.takeScreenshot('https://example.com')
```

### Security Analysis
```typescript
// Using Socket through MCP wrapper
const security = await mcpSocket.analyzeDependencies(['react', 'express'])
```

## Benefits of MCP Integration

1. **Unified Interface**: All MCP servers accessible through OpenCode plugin system
2. **Automatic Discovery**: Tools automatically available when MCP servers connect
3. **Error Handling**: Robust error handling and reconnection logic
4. **Configuration Management**: Centralized configuration for all MCP servers
5. **Performance Monitoring**: Built-in timeout and retry mechanisms

## Development Roadmap

### Short Term (Current Sprint)
- [x] Basic MCP wrapper implementation
- [x] Core server integration
- [ ] Configuration management
- [ ] Error handling improvements

### Medium Term (Next Sprint)
- [ ] Advanced tool discovery
- [ ] Performance optimization
- [ ] Security enhancements
- [ ] Monitoring and logging

### Long Term (Future)
- [ ] GUI configuration tool
- [ ] Plugin marketplace integration
- [ ] Advanced debugging tools
- [ ] Custom MCP server builder

## Troubleshooting

### Common Issues

1. **MCP Server Not Found**
   - Check server installation path
   - Verify server is in PATH
   - Check configuration

2. **Connection Timeout**
   - Increase timeout value
   - Check server health
   - Verify network connectivity

3. **Tool Not Available**
   - Restart MCP server
   - Check server configuration
   - Verify tool permissions

### Debug Mode
```typescript
const debugWrapper = createMCPWrapper({
  serverName: 'debug-server',
  serverPath: 'mcp-debug-server',
  timeout: 60000,
  autoConnect: true,
  debug: true
})
```

## Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [MCP Server Registry](https://github.com/mcp)
- [OpenCode Plugin Documentation](../src/plugins/)
- [Conversion Examples](../examples/poc-anthropic-plugins/)