# Development Tools Setup



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


Bun-first workflow. Install dev tools:

```
bun add -d eslint @eslint/js @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-jsx-a11y prettier
```

## Linting and Formatting
- Lint: `bun run lint`
- Fix: `bun run lint:fix`
- Format: `bun run format`

## Config Files
- `.editorconfig`: editor consistency
- `.prettierrc.json`: Prettier formatting rules
- `eslint.config.mjs`: ESLint flat config for TS/ESM
- `.eslintignore`: ignore build artifacts and vendor directories

## Type Checking and Tests
- Typecheck: `bun run typecheck`
- Tests: `bun test`
- Coverage: `bun test --coverage`

## Accessibility (CLI)
- Ensure help output is clear and readable without relying solely on color
- Provide descriptive error messages

