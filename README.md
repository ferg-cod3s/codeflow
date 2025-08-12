# Agentic Workflow

This repo has the agents and command prompts that I use for my agentic workflow. Right now it's just the bare prompts, in the future I'll aim to make it more dynamic and include some tooling to help manage the workflow.

**IMPORTANT** Between each phase you MUST review the outputs for correctness. This is YOUR job, not the models. It may produce working results, but that doesn't mean they are correct for your project or product. Keep in mind that the more times you run this system, the more it will use itself as a baselines for future workflow runs. So spending a bit of time to ensure the early research is correct is important as it will make the system run more smoothly in the future!


## Setup

There's a couple of small tools that really help to make this work more smoothly, though the issue tracker is optional, I advise not using MCP or similar type APIs from an agent as they are absurdly noisy. And JSON is generally bad for inference.

### Thoughts

The thoughts tool is a simple concept that aims to separate your llm generated intermediate output from your actual codebase. This current system requires you to setup a separate 'thoughts' repo. This may change in the future but for now this is how I have it working.

1. Create a thoughts repo, you can do this for your org if you have many repos, or for yourself if you're a solo dev, but it's ideal that everyone uses the same repo across an org or it won't really work well.
2. Run `npx humanlyer thoughts init` inside your project. This will ask some questions about where your thoughts repo is so have that made first. It defaults to ~/thoughts

That's pretty much it, the prompts are all designed to manage it from here on out.

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
