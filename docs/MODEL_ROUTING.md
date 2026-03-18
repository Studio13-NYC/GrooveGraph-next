# Model Routing

## Goal

Use the strongest model only where it creates leverage. Everything else should be routed to the cheapest model that can reliably do the job.

## Canonical source

This document is the canonical source for routing decisions in GrooveGraph Next.

If routing guidance here conflicts with `AGENTS.md`, `README.md`, or `.cursor/rules/subagent-routing.mdc`, update those files to match this document.

## Default routing table

| Work type | Preferred model | Why |
|---|---|---|
| User interaction, task decomposition, final synthesis | `GPT-5.4` | Highest judgment and strongest cross-domain reasoning |
| Cursor rules, skills, prompts, tool contracts | `Composer 1.5` | Best fit for Cursor-native meta work |
| Research distillation, review, docs, testing analysis | `GPT-5.4-mini` | Strong enough for structured thought at lower cost |
| Routing, summarization, packet compression, triage | `GPT-5.4-nano` | Fast and cheap for narrow bounded tasks |
| Cleanup analysis, unused-surface triage, removal proposals | `GPT-5.4-nano` via `hygienist` | Hygiene work is bounded classification and compression, not architecture |
| Bounded implementation and refactoring | `GPT-5.3-codex` | Best default for code-heavy execution work |
| Graphics direction and visual briefs | `GPT-5.4-mini` via `graphic-artist` | Good balance of taste, reasoning, and cost |
| Azure baseline, deployment planning, and smoke validation | `GPT-5.4-mini` via `infrastructure-deployment` | Operational judgment without spending frontier-model cost |

## Agent routing table

| Agent | Preferred model |
|---|---|
| `orchestrator` | `GPT-5.4` |
| `composer-meta` | `Composer 1.5` |
| `explorer` | `GPT-5.4-mini` |
| `implementer` | `GPT-5.3-codex` |
| `reviewer` | `GPT-5.4-mini` |
| `tester` | `GPT-5.4-mini` |
| `hygienist` | `GPT-5.4-nano` |
| `graphic-artist` | `GPT-5.4-mini` |
| `infrastructure-deployment` | `GPT-5.4-mini` |

## Escalation rules

Escalate to `GPT-5.4` when:

- multiple agent outputs conflict
- the acceptance criteria are changing
- a task spans architecture, product, and workflow decisions
- user-facing synthesis quality matters more than speed

Escalate to `Composer 1.5` when:

- the repo's rules or skills need to change
- prompt contracts need rewriting
- a workflow should become durable platform behavior

Route down to `GPT-5.4-nano` when:

- the task is mostly compression, extraction, classification, or triage
- no architectural judgment is needed

## Cost discipline

- default to mini or nano when possible
- use codex only after the task boundary is explicit
- use `GPT-5.4` for orchestration, not for routine mechanical work
- avoid parallel high-cost subagents unless the speed benefit is real
- ask each agent for a rough `cost_summary` whenever the runtime can provide one

## Anti-patterns

- using `GPT-5.4` for every step because it feels safer
- asking `nano` to make architecture calls
- sending under-specified code tasks to codex
- using the meta lane for ordinary implementation
