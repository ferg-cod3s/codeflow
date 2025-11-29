/**
 * Explanatory Output Style Plugin for OpenCode
 *
 * Converted from Claude Code plugin format
 * Original author: Dickson Tsai (Anthropic)
 *
 * This plugin adds educational insights about implementation choices and codebase patterns.
 * It mimics the deprecated "Explanatory" output style from Claude Code.
 */

import type { Plugin } from "@opencode-ai/plugin"

const EXPLANATORY_INSTRUCTIONS = `You are in 'explanatory' output style mode, where you should provide educational insights about the codebase as you help with the user's task.

You should be clear and educational, providing helpful explanations while remaining focused on the task. Balance educational content with task completion. When providing insights, you may exceed typical length constraints, but remain focused and relevant.

## Insights
In order to encourage learning, before and after writing code, always provide brief educational explanations about implementation choices using (with backticks):
"\`★ Insight ─────────────────────────────────────\`
[2-3 key educational points]
\`─────────────────────────────────────────────────\`"

These insights should be included in the conversation, not in the codebase. You should generally focus on interesting insights that are specific to the codebase or the code you just wrote, rather than general programming concepts. Do not wait until the end to provide insights. Provide them as you write code.`

export const ExplanatoryOutputStyle: Plugin = async ({ client }) => {
  console.log('✨ Explanatory Output Style plugin loaded')
  console.log('📚 Educational insights will be provided throughout the session')

  return {
    // Session initialization hook
    event: async ({ event }) => {
      if ((event.type as string) === 'session.start' || (event.type as string) === 'session.init') {
        console.log('🎓 Activating explanatory mode...')

        // Inject educational context at session start
        // Note: OpenCode doesn't have a direct "additionalContext" mechanism
        // like Claude Code's SessionStart hook, so we log instructions
        // and rely on the session context

        console.log('\n' + '='.repeat(60))
        console.log('EXPLANATORY MODE ACTIVE')
        console.log('='.repeat(60))
        console.log('Educational insights will be provided during code assistance.')
        console.log('Look for ★ Insight markers in responses.')
        console.log('='.repeat(60) + '\n')
      }
    },

    // Alternative: Use tool hooks to inject context
    tool: {
      execute: {
        before: async (input, output) => {
          // We could inject explanatory context before tool execution
          // but this would be verbose. Better to use session-level context.

          // For demonstration: we could modify tool parameters here
          // to include explanatory instructions
        },

        after: async (input, output) => {
          // After tool execution, we could provide insights
          // but in OpenCode, this is better handled by the model directly

          if (input.tool === 'write' || input.tool === 'edit') {
            console.log('💡 Tip: Ask for explanations about the code that was just written')
          }
        }
      }
    }
  }
}

// Export as default for CommonJS compatibility
export default ExplanatoryOutputStyle
