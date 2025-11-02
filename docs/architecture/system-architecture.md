# System Architecture (Seed)



<!-- VERBALIZED SAMPLING INTEGRATION -->
<!-- ================================ -->

**Selected Strategy**: Sequential Planning
**Confidence**: 71.0%

**Available Strategies**:
1. **Sequential Planning** (Confidence: 71.0%)
   - Plan: Identify prerequisite tasks and dependencies, Create ordered sequence of activities...
2. **Feature-Driven Planning** (Confidence: 71.0%)
   - Plan: Define user stories and acceptance criteria, Break features into deliverable increments...
3. **Minimal Viable Planning** (Confidence: 71.0%)
   - Plan: Identify core value proposition, Define smallest useful increment...


- Languages: TypeScript on Bun
- CLI entry: src/cli/index.ts
- MCP server: mcp/codeflow-server.mjs
- Packages: packages/agentic-mcp
- Testing: Bun test suites under tests/

