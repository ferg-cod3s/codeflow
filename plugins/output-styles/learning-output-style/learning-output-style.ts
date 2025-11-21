/**
 * Learning Output Style Plugin for OpenCode
 *
 * Converted from Claude Code plugin format
 * Original author: Boris Cherny (Anthropic)
 *
 * This plugin combines interactive learning (requesting code contributions) with
 * educational insights about implementation choices and codebase patterns.
 * It mimics the unshipped "Learning" output style from Claude Code.
 */

import type { Plugin } from "@opencode-ai/plugin"

const LEARNING_INSTRUCTIONS = `You are in 'learning' output style mode, which combines interactive learning with educational insights. Your goal is to help the user learn through hands-on coding while providing educational context.

## Interactive Learning
Instead of implementing everything automatically, identify opportunities for the user to write meaningful code (5-10 lines). Request their contribution when there are interesting decisions to be made, focusing on:

**Request contributions for:**
- Business logic with multiple valid approaches
- Error handling strategies
- Algorithm implementation choices
- Data structure decisions
- User experience decisions
- Design patterns and architecture choices

**Implement directly:**
- Boilerplate or repetitive code
- Obvious implementations with no meaningful choices
- Configuration or setup code
- Simple CRUD operations

When requesting code, clearly explain what you want them to implement and why it's a good learning opportunity. After they provide code, review it and give constructive feedback.

## Educational Insights
In addition to interactive learning, provide brief educational explanations about implementation choices using (with backticks):
"\`★ Insight ─────────────────────────────────────\`
[2-3 key educational points]
\`─────────────────────────────────────────────────\`"

These insights should be included in the conversation, not in the codebase. Focus on interesting insights that are specific to the codebase or the code being written, rather than general programming concepts.`

export const LearningOutputStyle: Plugin = async ({ client }) => {
  console.log('✨ Learning Output Style plugin loaded')
  console.log('🎓 Interactive learning mode with educational insights')

  return {
    // Session initialization hook
    event: async ({ event }) => {
      if ((event.type as string) === 'session.start' || (event.type as string) === 'session.init') {
        console.log('📚 Activating learning mode...')

        // Inject learning context at session start
        console.log('\n' + '='.repeat(60))
        console.log('LEARNING MODE ACTIVE')
        console.log('='.repeat(60))
        console.log('You will be asked to write meaningful code at decision points.')
        console.log('Educational insights will be provided throughout.')
        console.log('Look for code contribution requests and ★ Insight markers.')
        console.log('='.repeat(60) + '\n')
      }
    },

    // Tool execution hooks for interactive feedback
    tool: {
      execute: {
        before: async (input, output) => {
          // Before tool execution, we could analyze if it's a good learning opportunity
          if (input.tool === 'write' || input.tool === 'edit') {
            console.log('💭 Analyzing if this is a good learning opportunity...')
          }
        },

        after: async (input, output) => {
          // After tool execution, provide feedback opportunities
          if (input.tool === 'write' || input.tool === 'edit') {
            console.log('💡 Consider: Could this have been a learning opportunity?')
            console.log('   Ask for an explanation or alternative approaches!')
          }

          // Track when code is written vs when contributions were requested
          if (input.tool === 'bash' && output.args?.command?.includes('test')) {
            console.log('🧪 Tests run! Good time to explain test strategy.')
          }
        }
      }
    }
  }
}

// Export as default for CommonJS compatibility
export default LearningOutputStyle
