# Agent Orchestrator

Use this skill when you need to turn a user request into a bounded multi-agent workflow.

## Steps

1. Define the outcome.
2. Pick the lowest-cost lane that can reliably do the work.
3. Build a context packet.
4. Delegate to one subagent at a time unless parallelization clearly helps.
5. Synthesize outputs back into one user-facing result.

## Checklist

- Is the writable scope explicit?
- Is the packet concise?
- Is the chosen lane appropriate for the task?
- Is the stop condition clear?
