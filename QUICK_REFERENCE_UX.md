# CodeFlow UX Features - Quick Reference

## Theme Selection

```bash
# Use a specific theme
codeflow research "your query" --theme=neon

# Available themes
--theme=default       # Balanced, cyan/blue
--theme=minimal       # Clean, simple
--theme=rich          # Colorful, detailed
--theme=neon          # Bold, vibrant
--theme=professional  # Business-appropriate
```

## Interactive Mode

```bash
# Launch interactive wizard
codeflow research --interactive

# Or
codeflow research -i
```

## Programmatic Usage

### Quick Theme Setup

```typescript
import { setTheme, getTheme } from './src/cli/themes/index.js';

// Set theme globally
setTheme('neon');

// Get current theme
const theme = getTheme();
```

### Display Data Table

```typescript
import { TableDisplay } from './src/cli/display/table-display.js';

const table = new TableDisplay();
console.log(table.render([
  { name: 'Alice', status: 'active' },
  { name: 'Bob', status: 'pending' }
]));
```

### Show Progress

```typescript
import { ProgressDisplay } from './src/cli/display/progress-display.js';

const progress = new ProgressDisplay();
console.log(progress.renderProgressBar(75, 100, {
  message: 'Processing...'
}));
```

### Display Messages

```typescript
import { BoxDisplay } from './src/cli/display/box-display.js';

const box = new BoxDisplay();
console.log(box.renderSuccess('Operation complete!'));
console.log(box.renderError('Something went wrong'));
console.log(box.renderWarning('Proceed with caution'));
console.log(box.renderInfo('Additional information'));
```

### Track Agent Status

```typescript
import { AgentStatusDisplay } from './src/cli/display/agent-status-display.js';

const statusDisplay = new AgentStatusDisplay();

const statuses = [
  {
    name: 'codebase-locator',
    status: 'success',
    message: 'Found 150 files',
    startTime: new Date(Date.now() - 2000),
    endTime: new Date()
  }
];

console.log(statusDisplay.renderAgents(statuses));
console.log(statusDisplay.renderSummary(statuses));
```

### Interactive Prompts

```typescript
import { InteractivePrompts } from './src/cli/interactive/prompts.js';

const prompts = new InteractivePrompts();

// Text input
const name = await prompts.text('Enter your name:');

// Choice selection
const option = await prompts.select('Choose:', [
  { title: 'Option 1', value: 'opt1' },
  { title: 'Option 2', value: 'opt2' }
]);

// Confirmation
const confirmed = await prompts.confirm('Are you sure?');

// Multiple selection
const items = await prompts.multiselect('Select items:', [
  { title: 'Item A', value: 'a' },
  { title: 'Item B', value: 'b' }
]);
```

### Multi-Step Wizard

```typescript
import { Wizard } from './src/cli/interactive/wizard.js';
import { InteractivePrompts } from './src/cli/interactive/prompts.js';

const prompts = new InteractivePrompts();

const config = {
  title: 'Setup Wizard',
  steps: [
    {
      name: 'name',
      title: 'Project Name',
      action: async () => prompts.text('Enter project name:')
    },
    {
      name: 'theme',
      title: 'Choose Theme',
      action: async () => prompts.select('Select theme:', [
        { title: 'Default', value: 'default' },
        { title: 'Neon', value: 'neon' }
      ])
    }
  ]
};

const wizard = new Wizard(config);
const results = await wizard.run();
// results = { name: '...', theme: '...' }
```

## Display Component Cheat Sheet

| Component | Purpose | Key Methods |
|-----------|---------|-------------|
| **TableDisplay** | Data tables | `render()`, `renderKeyValue()`, `renderResultsSummary()` |
| **ProgressDisplay** | Progress tracking | `renderProgressBar()`, `renderPhase()`, `renderSteps()` |
| **BoxDisplay** | Message boxes | `renderSuccess()`, `renderError()`, `renderWarning()`, `renderInfo()` |
| **AgentStatusDisplay** | Agent tracking | `renderAgents()`, `renderSummary()`, `renderTimeline()` |

## Theme Colors

Each theme provides:
- **Primary** - Main brand color
- **Secondary** - Supporting color
- **Accent** - Highlight color
- **Success** - Green for success
- **Warning** - Yellow for warnings
- **Error** - Red for errors
- **Info** - Blue for information
- **Muted** - Gray for less important text

## Status Icons

- `✓` Success
- `✗` Error
- `⚠` Warning
- `ℹ` Info
- `▶` Running
- `○` Pending
- `●` Complete

## Examples

### Full CLI with Theme
```bash
codeflow research "implement authentication" \
  --agents=security-scanner,full-stack-developer \
  --theme=professional \
  --output=research-results.json
```

### Interactive Research
```bash
codeflow research --interactive
# Follow the prompts to configure your research
```

### Custom Theme in Code
```typescript
import { setTheme } from './src/cli/themes/index.js';
import { EnhancedResearchCLI } from './src/cli/research-enhanced.js';

setTheme('neon');
const cli = new EnhancedResearchCLI(process.cwd());
await cli.initialize();
```

## Tips

1. **Theme Selection:** Try different themes to find what works best for your terminal
2. **Interactive Mode:** Use `-i` for guided configuration when you're unsure
3. **Progress Tracking:** Long operations show real-time progress automatically
4. **Agent Status:** Watch agent execution in real-time during research
5. **Color Support:** Ensure your terminal supports ANSI colors for best experience

## Documentation

- **Full Documentation:** [PHASE3_2_COMPLETION_REPORT.md](PHASE3_2_COMPLETION_REPORT.md)
- **Development Status:** [DEVELOPMENT.md](DEVELOPMENT.md)
- **Theme System:** [src/cli/themes/README.md](src/cli/themes/README.md)
- **Display Components:** [src/cli/display/README.md](src/cli/display/README.md)
- **Interactive Components:** [src/cli/interactive/README.md](src/cli/interactive/README.md)

---

**Quick Reference Version:** 1.0  
**Phase 3.2 Status:** ✅ Complete
