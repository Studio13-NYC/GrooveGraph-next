# Agent Orchestration

## Purpose

This document defines how work is delegated, coordinated, and completed in `GrooveGraph Next`.

The goal is not to maximize agent count. The goal is to create a system with clear authority, clean handoffs, bounded scope, and strong output quality.

## Core hierarchy

### Top orchestrator

`GPT-5.4` is the user-facing orchestrator.

It owns:

- task decomposition
- acceptance criteria
- conflict resolution between agent outputs
- final synthesis for the user
- escalation decisions when scope or ambiguity grows

It should default to delegation whenever a cheaper lane can do the work cleanly inside a bounded packet.

### Meta lane

`Composer 1.5` is the Cursor-native meta lane.

It owns:

- authoring and refining rules
- skills design
- prompt design
- tool-contract design
- repo-level workflow patterns

### Specialist lanes

`GPT-5.4-mini` handles:

- exploration
- code review
- documentation drafting
- test interpretation
- visual strategy via the `Graphic Artist` subagent
- infrastructure and deployment analysis via the `infrastructure-deployment` subagent

`GPT-5.4-nano` handles:

- context compression
- routing classification
- lint and log triage
- metadata extraction
- cleanup triage via the `hygienist` subagent

`GPT-5.3-codex` handles:

- bounded implementation
- refactoring after acceptance criteria are stable
- test-writing and repair loops

## Canonical precedence

Use this file as the authority for hierarchy and authority model.

When related files drift:

- `docs/MODEL_ROUTING.md` wins for model selection and routing
- `docs/CONTEXT_PACKETS.md` wins for delegation packet fields
- `AGENTS.md` summarizes but does not override these docs
- `.cursor/rules/` mirrors these decisions operationally and must stay in sync

## Authority model

Only the orchestrator is allowed to combine outputs across domains and declare a task complete.

Subagents should:

- stay within their packet scope
- avoid silent expansion of scope
- return explicit outputs instead of partial thoughts
- stop when their stop conditions are reached

The orchestrator should:

- delegate downward by default
- avoid retaining ordinary lane work out of caution alone
- keep expensive top-model work focused on judgment and synthesis

## Subagent set

### `orchestrator`

- top-level operating contract
- references the hierarchy and completion standards

### `composer-meta`

- dedicated to Cursor-native meta-authoring
- used when repo behavior itself is changing

### `explorer`

- gathers context quickly
- returns concise, actionable findings

### `implementer`

- executes bounded code changes
- assumes acceptance criteria are fixed before coding starts

### `reviewer`

- finds bugs, regressions, unclear assumptions, and missing tests

### `tester`

- validates workflows and interprets failures

### `hygienist`

- runs cleanup analysis
- converts tool output into proposal-first hygiene guidance
- never deletes code or files without explicit human approval

### `graphic-artist`

- turns architecture and strategy into persuasive visual artifacts

### `infrastructure-deployment`

- preserves the Azure baseline
- owns deploy-path documentation and smoke validation
- distinguishes what must stay from what may be overwritten

## Agent to model map

| Agent | Preferred model | Reason |
|---|---|---|
| `orchestrator` | `GPT-5.4` | Top-level judgment, conflict resolution, and final synthesis |
| `composer-meta` | `Composer 1.5` | Cursor-native rules, skills, prompts, and tool contracts |
| `explorer` | `GPT-5.4-mini` | Fast bounded exploration with enough reasoning depth |
| `implementer` | `GPT-5.3-codex` | Best default for bounded coding and refactoring work |
| `reviewer` | `GPT-5.4-mini` | Strong bug-finding and review quality at lower cost |
| `tester` | `GPT-5.4-mini` | Good workflow validation and failure interpretation |
| `hygienist` | `GPT-5.4-nano` | Fast, cheap triage for cleanup tooling and proposal generation |
| `graphic-artist` | `GPT-5.4-mini` | Best balance of taste, structure, and cost for visual direction |
| `infrastructure-deployment` | `GPT-5.4-mini` | Operational reasoning without paying frontier-model cost |

## Delegation workflow

1. The orchestrator defines the desired outcome.
2. The orchestrator selects the correct lane.
3. The orchestrator prepares a context packet.
4. The subagent executes only within packet boundaries.
5. The subagent returns structured output.
6. The orchestrator decides whether to:
   - accept
   - refine
   - hand off to another lane
   - escalate back to the user

## What good orchestration looks like

- fewer, sharper handoffs
- downward delegation whenever a cheaper lane can preserve quality
- explicit ownership
- explicit rough cost summaries when available
- stable naming
- one source of truth per concern
- visible boundaries between reference, writable implementation, and experiments

## What bad orchestration looks like

- delegating vague tasks
- treating the orchestrator as the default executor instead of the default delegator
- hiding unresolved assumptions inside implementation work
- mixing policy authoring with product coding
- letting legacy reference material silently control new work
- using expensive models where cheap ones are sufficient
