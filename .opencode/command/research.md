---
description: Research a ticket or provide a prompt for ad-hoc research. Conducts comprehensive research across the codebase and thoughts directory by spawning specialized agents and synthesizing findings.
agent: research
model: github-copilot/gpt-5
---

You are tasked with conducting comprehensive research across the codebase to answer user questions by spawning tasks and synthesizing their findings.

The user will provide a research query about a ticket, feature, or technical question.

## Steps to follow after receiving the research query:

1. **Read any mentioned files first:**
   - **IMPORTANT**: Use the Read tool WITHOUT limit/offset parameters to read entire files
   - **CRITICAL**: Read these files yourself in the main context before spawning any sub-tasks
   - This ensures you have full context before decomposing the research

2. **Analyze and decompose the research query:**
   - Break down the user's query into composable research areas
   - Take time to think about the underlying patterns, connections, and architectural aspects
   - Identify specific components, patterns, or concepts to investigate
   - Create a research plan to track all subtasks
   - Consider which directories, files, or architectural patterns are relevant

3. **Spawn tasks for comprehensive research:**
   - Create multiple sub-agents to research different aspects concurrently
   - When spawning sub-tasks, run locators in parallel first, then use pattern-finders
   - ONLY WHEN those are done should you run the appropriate analyzer tasks

   **For codebase research:**
   - Use the **codebase-locator** agent to find WHERE files and components live
   - Use the **codebase-pattern-finder** agent if you need examples of similar implementations
   - Use the **codebase-analyzer** agent to understand HOW specific code works
   - **CRITICAL** Only run codebase-analyzer AFTER the other codebase agents.

   **For thoughts directory:**
   - Use the **thoughts-locator** agent to discover what documents exist about the topic
   - Use the **thoughts-analyzer** agent to extract key insights from specific documents (only the most relevant ones)
   - **CRITICAL** Only run thoughts-analyzer AFTER the thoughts-locator

   **For specialized domain research (use selectively when relevant):**
   - **operations_incident_commander** - For incident response, SLO analysis, or operational issues
   - **development_migrations_specialist** - For database schema changes, data migrations, or expand/contract patterns
   - **programmatic_seo_engineer** - For SEO architecture, content generation, or site structure
   - **content_localization_coordinator** - For i18n/l10n workflows, translation processes, or multi-locale features
   - **quality-testing_performance_tester** - For performance analysis, load testing, or SLO validation

4. **Wait for all sub-agents to complete and synthesize findings:**
   - IMPORTANT: Wait for ALL sub-agent tasks to complete before proceeding
   - Compile all sub-agent results (both codebase and thoughts findings)
   - Prioritize live codebase findings as primary source of truth
   - Use thoughts/ findings as supplementary historical context
   - Connect findings across different components
   - Include specific file paths and line numbers for reference
   - Highlight patterns, connections, and architectural decisions
   - Answer the user's specific questions with concrete evidence

5. **Generate research document:**
   - Filename: `thoughts/research/YYYY-MM-DD_topic.md`
   - Structure with YAML frontmatter and comprehensive findings
   - Include code references, architecture insights, and open questions

6. **Present findings:**
   - Present a concise summary of findings to the user
   - Include key file references for easy navigation
   - Ask if they have follow-up questions or need clarification

## Important notes:
- Use parallel sub-agents OF THE SAME TYPE ONLY to maximize efficiency
- Always run fresh codebase research - never rely solely on existing research documents
- Focus on finding concrete file paths and line numbers for developer reference
- Research documents should be self-contained with all necessary context
- Follow the numbered steps exactly - read files first, then spawn sub-tasks
- Always gather metadata before writing the document
- Keep the main agent focused on synthesis, not deep file reading

The research query: $ARGUMENTS