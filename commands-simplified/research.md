---
description: Research codebase or provide ad-hoc research by spawning specialized sub-tasks
---

# Research Codebase

You are tasked with conducting comprehensive research across codebase to answer user questions by spawning tasks and synthesizing their findings.

## Steps to follow after receiving research query:

1. **Read ticket first:**
   - Use Read tool WITHOUT limit/offset parameters to read entire files
   - Read these files yourself in main context before spawning any sub-tasks
   - This ensures you have full context before decomposing research

2. **Detail research steps:**
   - Break down user's query into composable research areas
   - Identify specific components, patterns, or concepts to investigate
   - Lay out what locator should look for, what analyzer should examine
   - Be clear that locators collect information for analyzers

3. **Spawn tasks for comprehensive research:**

   **Phase 1 - Locate:**
   - Spawn **locator** agents to find WHERE files and components live
   - Run multiple locators in parallel for different topic areas
   - WAIT for all locator agents to complete before proceeding

   **Phase 2 - Analyze:**
   - Using locator results, determine what needs deep analysis
   - Spawn **analyzer** agents to understand HOW specific code works
   - Run multiple analyzers in parallel for different components
   - WAIT for all analyzer agents to complete before synthesizing

4. **Wait for all sub-agents to complete and synthesize findings:**
   - Wait for ALL sub-agent tasks to complete before proceeding
   - Compile all sub-agent results
   - Connect findings across different components
   - Include specific file paths and line numbers for reference
   - Answer user's specific questions with concrete evidence

5. **Generate research document:**
   - Structure document with clear sections
   - Include file references and implementation details
   - Provide actionable insights and recommendations

6. **Present findings:**
   - Present concise summary of findings to user
   - Include key file references for easy navigation
   - Ask if they have follow-up questions

## Important notes:

- Follow two-phase sequence: Locate → Analyze
- Use parallel Task agents OF THE SAME TYPE within each phase
- Always run fresh codebase research - never rely solely on existing research
- Focus on finding concrete file paths and line numbers for developer reference
- Keep main agent focused on synthesis, not deep file reading
- Encourage sub-agents to find examples and usage patterns, not just definitions

**Arguments**

$ARGUMENTS
