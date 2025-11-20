/**
 * Walkthrough Output Style Plugin for OpenCode
 *
 * A guided learning mode that provides step-by-step walkthroughs, shows example code
 * patterns (but doesn't implement), and validates user implementations.
 *
 * Key Features:
 * - Step-by-step guidance with numbered steps and clear objectives
 * - Code pattern display in fenced blocks (not inline implementations)
 * - User implementation pauses at key decision points
 * - Comprehensive validation phase with code review
 * - Progressive disclosure of complexity
 */

import type { Plugin } from "@opencode-ai/plugin"

interface WalkthroughStep {
  id: string
  title: string
  description: string
  codePattern?: string
  location?: string
  validation?: string[]
  nextStep?: string
}

interface WalkthroughSession {
  id: string
  title: string
  steps: WalkthroughStep[]
  currentStep: number
  userCode: Record<string, string>
  validationResults: Record<string, any>
}

const WALKTHROUGH_INSTRUCTIONS = `You are in 'walkthrough' output style mode, which provides guided, step-by-step learning experiences.

## Core Principles
1. **Step-by-Step Guidance**: Break complex tasks into clear, numbered steps
2. **Pattern Display**: Show code examples in fenced blocks, but don't implement directly
3. **User Implementation**: Pause at decision points for users to write meaningful code
4. **Validation**: Review and validate user implementations comprehensively
5. **Progressive Disclosure**: Introduce complexity gradually

## When to Use Walkthrough Mode
- Learning new frameworks or patterns
- Implementing complex features with multiple components
- Understanding architectural decisions
- Best practice implementation
- Code refactoring with guidance

## Walkthrough Structure
Each walkthrough follows this pattern:
1. **Overview**: Explain what we're building and why
2. **Step N**: Clear objective with code pattern
3. **Your Turn**: User implements the step
4. **Validation**: Review and feedback
5. **Next Step**: Continue to next part

## Code Pattern Display
Always show examples in fenced code blocks with clear file locations:
\`\`\`typescript
// File: src/components/UserAuth.ts
interface User {
  id: string;
  email: string;
}
\`\`\`

## Validation Guidelines
- Check for correct implementation
- Provide constructive feedback
- Suggest improvements when appropriate
- Explain why certain approaches are better
- Celebrate good implementations`

export const WalkthroughOutputStyle: Plugin = async ({ client }) => {
  console.log('🚶‍♂️ Walkthrough Output Style plugin loaded')
  console.log('📚 Step-by-step learning with guided implementation')

  // In-memory session storage (in production, use persistent storage)
  const sessions = new Map<string, WalkthroughSession>()

  return {
    // Session initialization
    event: async ({ event }) => {
      if (event.type === 'session.start' || event.type === 'session.init') {
        console.log('\n' + '='.repeat(70))
        console.log('WALKTHROUGH MODE ACTIVE')
        console.log('='.repeat(70))
        console.log('🚶‍♂️ You will receive step-by-step guidance for complex tasks')
        console.log('📝 Code patterns will be shown, but you will implement them')
        console.log('✅ Your implementations will be validated with feedback')
        console.log('🎯 Look for numbered steps and "Your Turn" prompts')
        console.log('='.repeat(70) + '\n')
      }
    },

    // Tool execution hooks for walkthrough guidance
    tool: {
      execute: {
        before: async (input, output) => {
          // Intercept direct code writing and convert to walkthrough guidance
          if (input.tool === 'write' || input.tool === 'edit') {
            console.log('🚶‍♂️ Walkthrough Mode: Let me guide you through this implementation...')
            
            // Analyze what the user is trying to do
            const filePath = input.args?.filePath || 'unknown file'
            const content = input.args?.content || input.args?.newString || ''
            
            // Determine if this is a good walkthrough opportunity
            if (shouldProvideWalkthrough(filePath, content)) {
              console.log('📋 This looks like a good candidate for step-by-step guidance!')
              console.log('   I\'ll break this down into manageable steps for you.')
              return { 
                prevent: true, 
                message: 'Walkthrough guidance provided instead of direct implementation' 
              }
            }
          }
        },

        after: async (input, output) => {
          // After user implements code, provide validation
          if (input.tool === 'write' || input.tool === 'edit') {
            if (!output.prevent) {
              console.log('✅ Great! Let me validate your implementation...')
              // Here we would analyze the written code and provide feedback
              console.log('💡 Consider: Could this implementation be improved?')
              console.log('   Ask me for a code review or alternative approaches!')
            }
          }

          // Track progress through walkthrough steps
          if (input.tool === 'bash' && output.args?.command?.includes('test')) {
            console.log('🧪 Tests running! Good checkpoint for walkthrough progress.')
            console.log('   Let me help you understand the test results and next steps.')
          }
        }
      }
    }
  }
}

/**
 * Determine if a file operation should trigger walkthrough mode
 */
function shouldProvideWalkthrough(filePath: string, content: string): boolean {
  // Complex files that benefit from walkthrough
  const walkthroughPatterns = [
    /component|service|controller|model/i,
    /auth|user|payment|checkout/i,
    /\.test\.|\.spec\./i,
    /config|setup|migration/i
  ]

  // Simple files that don't need walkthrough
  const skipPatterns = [
    /package\.json|tsconfig\.json|\.md$/i,
    /\.gitignore|\.env/i,
    /node_modules|dist|build/i
  ]

  const shouldWalkthrough = walkthroughPatterns.some(pattern => pattern.test(filePath))
  const shouldSkip = skipPatterns.some(pattern => pattern.test(filePath))

  return shouldWalkthrough && !shouldSkip && content.length > 100
}

/**
 * Create a walkthrough session for a complex task
 */
function createWalkthroughSession(title: string, steps: WalkthroughStep[]): WalkthroughSession {
  return {
    id: Math.random().toString(36).substr(2, 9),
    title,
    steps,
    currentStep: 0,
    userCode: {},
    validationResults: {}
  }
}

/**
 * Generate walkthrough steps for common patterns
 */
function generateWalkthroughSteps(task: string): WalkthroughStep[] {
  const stepGenerators = {
    'authentication': [
      {
        id: 'user-model',
        title: 'Create User Model',
        description: 'Define the User interface with authentication fields',
        codePattern: `interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}`,
        location: 'models/User.ts'
      },
      {
        id: 'auth-service',
        title: 'Create Authentication Service',
        description: 'Implement login, register, and token management',
        codePattern: `export class AuthService {
  async login(email: string, password: string): Promise<User> {
    // Implementation here
  }
}`,
        location: 'services/AuthService.ts'
      }
    ],
    'component': [
      {
        id: 'component-structure',
        title: 'Create Component Structure',
        description: 'Define the basic component with props and state',
        codePattern: `interface ComponentProps {
  // Define props here
}

export const Component: React.FC<ComponentProps> = (props) => {
  // Component implementation
}`,
        location: 'components/Component.tsx'
      }
    ]
  }

  return stepGenerators[task as keyof typeof stepGenerators] || []
}

// Export as default for CommonJS compatibility
export default WalkthroughOutputStyle