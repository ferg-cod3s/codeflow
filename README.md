# Agentic Workflow

This repo has the agents and command prompts that I use for my agentic workflow. Right now it's just the bare prompts, in the future I'll aim to make it more dynamic and include some tooling to help manage the workflow.

**IMPORTANT** Between each phase you MUST review the outputs for correctness. This is YOUR job, not the models. It may produce working results, but that doesn't mean they are correct for your project or product. Keep in mind that the more times you run this system, the more it will use itself as a baselines for future workflow runs. So spending a bit of time to ensure the early research is correct is important as it will make the system run more smoothly in the future!

## Installation

To install the `agentic` command globally:

```bash
# Install dependencies and link globally
bun install
bun run install
```

## CLI Usage

### Push files to a project
```bash
agentic push ~/projects/my-app
agentic push ../other-project --dry-run
```

### Check status of files
```bash
agentic status ~/projects/my-app
```

## Setup

There's a couple of small tools that really help to make this work more smoothly, though the issue tracker is optional, I advise not using MCP or similar type APIs from an agent as they are absurdly noisy. And JSON is generally bad for inference.

### Thoughts

Thoughts are a place to store notes that are helpful context for the LLM to perform it's job accurately. They include the following categories of thoughts, each with their own purpose in the overall workflow.

#### Architecture (/thoughts/architecure)

The architecture files contain the overall design and decisions made that will guide the project as a whole. This contains several documents that may be unique to each project, these generally include:
* overview.md - an outline of the whole architecture and synopsis of each document and how they relate to other documents.
* system-architecture.md - deeper dive into the languages, frameworks, libraries, tooling and the overall core infrasturcutre of the application
* domain-model.md - describes the actual application domains beyond the core achitecture, diving into specifics of business logic and feature designs
* testing-strategy.md - covers various testing methods used through the project and where they are applicable
* development-workflow.md - describes the phases of development and how each ticket is expected to progress, and how archtecture changes are handled
* persistance.md - how data is persisted from the domain model. This should include all data stores used like sql dbs, search dbs, assets stores, etc

Other more optional architecure components may include
* api-design.md - where the project has direct external interfaces that drive query and mutation actions within the core domain models
* cli-design.md - for command line interfaces to the application
* event-bus.md - for projects that implement an async event bus to pump events to clients, usually coupled with api-design.md

And any other major dependencies or integral components that an agent would need to know exists to understand how to interact with it.

#### Documentation (/thoughts/docs)

These docs are not for the project itself but rather for external tools, libraries or services. These are not the full documentation from their website, but rather a distilled version that contains the most relevant information for the projects use cases. The purpose is to create a highly greppable set of docs that contains only the specific API endpoints or functions that are used. This prevents having to fetch large websites and 

#### Tickets (/thoughts/tickets)

Tickets hold information on work that needs to be completed. A ticket may be an issue with the software, a feature request, or an architecural delta that needs to be resolved. In the beginning most tickets would be architecure deltas, and typically these occur when the architecture undergoes changes. The differnce with feature requests is they are more typical in the user interface projects where the architectural details are often less specific and more user-centric or personalized.

Ideally these are linked to an issue tracker like linear or github for integration with external systems like slack.

#### Research (/thoughts/research)

Research notes are gathered with respect to a specific ticket and are an analysis of the codebase, the thoughtbase, and relevant web documentation. Each research file is timestampped as to when it was triggered and provides frontmatter metadata on the report as well. These reports form the initial analysis of where related concepts of a ticket are located, and previous thoughts that are relevant, especially architecural info, and may trigger web searches for documentation for relevant libraries, tools or services that are missing.

#### Planning (/thoughts/plans)

Planning documnts are much more specific and pull together a ticket with it's associted research to determine an implementation plan. The research may have discovered that the ticket requires more

#### Review (/thoughts/review)

## Commands

The process really start with the commands, as the subagents are laregely used by the commands themselves. The commands are each designed to be run from a fresh context window to maximize the inference latency and quality. Each phase and subagent performs a form of context compression, feeding the next phase or suagent with only the optimial chunks of tokens necessary to complete it's task.

### Research

Whether it's a an issue, feature request or larger piece of work, each workflow should start with doing codebase and thought analysis. Thought analsis will build up over time as you start with very little, so initially this focuses more heavily on the codebase analysis. If you want the research to include web searches, instruct the agent to do so when giving it instructions on what to research. Any files mentioned will be read fully, otherwise the subagents will perform a combination keyword lookups and pattern matching to find relevant parts of the codebase before analyzing.

```
/research thourghts/shared/tickets/web-042.md wants to add google oauth provider, find all the relevant information about the authentication system currently in place. Then review the documentation for someAuth.js to determine how to properly add google oauth.
```

This will produce a concise report on everything that is needed to further plan out updates to the auth system.

> It is important to review the details of this research. DO NOT BLINDLY ACCEPT IT. Any errors or hallucations at this point will flow downstream and lead to incorrect and buggy implementations that are much easier to correct here while you're still dealing with mostly natural language. The models are good at following instructions, make sure it has the right ones!

### Create Plan

Once you have research we can then create an implementation plan. This one is generally much simpler, simply cite the relevant ticket again along with the research above.

Create a new context window then run the following command

```
/plan_create read thoughts/shared/tickets/web-042.md and thoughts/shared/research/TIMESTAMP_google-oauth-research.md and prepare an implementation plan.
```

This is the same as the research phase, let it run, then review the results. This output will be far more specific with files and line numbers and descriptions of what is being changed at each spot. This is just short of actual code gen, but still reviewable to ensure that the implementation goes smoothly.

### Implement Plan

This one is pretty straightforward, you have the plan, let it rip.

Create a new context window and run:

```
/plan_execute thoughts/shared/plans/the-plan.md
```

Once it's done, you should review the work, but we will have one last phase that will also help with this.


### Commit

Before review, commit the work, but don't push it yet. We want it in the git history so that the agent can make use of git for helping with analysis.

```
/commit
```

The agent will stop before doing the final commit to confirm the details, just tell it to continue once you review the commit details.

### Validate Plan

As a final pass before pushing upstream, the agent can review the implemenation to ensure that it actually adhered to the details of the original plan, or inform you of any drift that occured. This may happen due to underspecification in the plans itself. So review the output of this carefuly and ensure you are ok with any deviations that were taken.

It's better not to start a new context session here unless the implmenation ate up the window. If there's no warnings then it's ok to run this in the same session as the implementation, if it ends up blowing up the window before it finishes, then you can just clear it and run from a fresh window too, it will just have to do a bit more work to pull in details.

```
/validate_plan thoughts/shared/plans/the-plan.md
```

If you're good with the results push and close your issue!