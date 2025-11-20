# Walkthrough Output Style Plugin

A guided learning mode for OpenCode that provides step-by-step walkthroughs, shows code patterns, and validates user implementations.

## Features

- **Step-by-Step Guidance**: Break down complex tasks into clear, numbered steps
- **Code Pattern Display**: Show example code structures in fenced blocks (not inline implementations)
- **User Implementation**: Pause at key decision points to let users write meaningful code
- **Validation Phase**: After user implements, provide comprehensive code review and validation
- **Progressive Disclosure**: Reveal complexity gradually, starting with simple concepts

## How It Works

### 1. Task Analysis
When you request a complex task, the plugin analyzes whether it would benefit from step-by-step guidance.

### 2. Walkthrough Creation
If walkthrough mode is triggered, the task is broken down into manageable steps:
- Clear objectives for each step
- Code patterns shown in fenced blocks
- File locations and structure guidance
- Implementation hints and best practices

### 3. User Implementation
Instead of implementing directly, the plugin:
- Shows you the code pattern to implement
- Provides clear instructions on what to build
- Waits for you to write the code
- Offers guidance if you get stuck

### 4. Validation & Feedback
After you implement each step:
- Reviews your code implementation
- Provides constructive feedback
- Suggests improvements when appropriate
- Explains why certain approaches are better

## Example Usage

### User Request:
```
"Add user authentication to my React app"
```

### Walkthrough Response:
```
🚶‍♂️ Let's implement authentication step by step:

## Step 1: Create User Model
**Location**: `src/models/User.ts`
**Objective**: Define the User interface with authentication fields

**Code Pattern**:
```typescript
// File: src/models/User.ts
interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export default User;
```

**Your Turn**: Implement the User model interface above.

## Step 2: Create Authentication Service
**Location**: `src/services/AuthService.ts`
**Objective**: Implement login, register, and token management

**Code Pattern**:
```typescript
// File: src/services/AuthService.ts
import User from '../models/User';

export class AuthService {
  async login(email: string, password: string): Promise<User> {
    // Validate credentials
    // Generate authentication token
    // Return user data
  }

  async register(email: string, password: string): Promise<User> {
    // Hash password
    // Create user account
    // Return user data
  }
}

export default AuthService;
```

**Your Turn**: Implement the AuthService class with login and register methods.
```

## Installation

### OpenCode Plugin Installation
```bash
# Copy plugin to your OpenCode plugins directory
cp walkthrough-output-style.ts ~/.config/opencode/plugin/

# Or add to your project's .opencode/plugin/ directory
cp walkthrough-output-style.ts .opencode/plugin/
```

### Configuration
Add to your OpenCode configuration:

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
    }
  }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoWalkthrough` | boolean | true | Automatically detect complex tasks for walkthrough |
| `showValidation` | boolean | true | Provide code validation after implementation |
| `progressiveDisclosure` | boolean | true | Gradually introduce complexity |
| `maxStepsPerTask` | number | 10 | Maximum number of steps per walkthrough |

## When Walkthrough Mode Activates

The plugin automatically triggers walkthrough mode for:

- **Complex Components**: React components, services, controllers
- **Authentication**: User auth, login, registration flows
- **Data Models**: Database models, interfaces, types
- **API Integration**: REST API clients, GraphQL setup
- **Testing**: Test suites, test utilities, mocking
- **Configuration**: Setup files, environment config

It skips walkthrough mode for:

- **Simple Files**: Package.json, config files, documentation
- **Boilerplate**: Basic scaffolding, template files
- **Dependencies**: Node modules, build artifacts

## Best Practices

### For Users
1. **Follow Steps Sequentially**: Each step builds on previous ones
2. **Implement Before Moving On**: Complete each step before proceeding
3. **Ask for Help**: Use the validation feedback to improve
4. **Experiment**: Try different approaches after learning the pattern

### For Developers
1. **Clear Objectives**: Each step should have a single, clear goal
2. **Reasonable Scope**: Steps should take 5-15 minutes to implement
3. **Good Patterns**: Show best practices and common patterns
4. **Validation Logic**: Provide helpful, constructive feedback

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add your walkthrough patterns or improvements
4. Test with various code scenarios
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Related Plugins

- [Explanatory Output Style](../explanatory-output-style/) - Educational insights about implementation
- [Learning Output Style](../learning-output-style/) - Interactive learning with code contributions

## Support

For issues, questions, or feature requests:
- Create an issue in the GitHub repository
- Check the documentation for common solutions
- Review examples for implementation patterns