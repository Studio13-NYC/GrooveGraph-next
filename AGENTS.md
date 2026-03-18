# GrooveGraph Next Operating Contract

This repository is the writable framework surface for the next GrooveGraph era.

## Repo boundary

- The legacy `GrooveGraph` repository is reference-only.
- Do not copy its rules or prompts blindly.
- Reuse only ideas that survive explicit review.
- The source of truth for this repo lives here, not in the legacy project.

## Hierarchy

- `GPT-5.4`: user-facing orchestrator and final decision-maker
- `Composer 1.5`: Cursor-native meta lane for rules, skills, prompts, and tool contracts
- `GPT-5.4-mini`: exploration, review, test analysis, and visual direction
- `GPT-5.4-nano`: routing, summarization, triage, packet compression, and hygiene analysis
- `GPT-5.3-codex`: bounded implementation and repair work

## Required behavior

- Use explicit context packets when delegating.
- Keep one active writable surface per task.
- Prefer framework-first changes over product speculation.
- Preserve clean boundaries between `framework/`, `product/`, `prototypes/`, and `research/`.
- Treat visual communication as part of the product of thinking, not decoration.
- Be forthright, opinionated, and comfortable disagreeing when a better path exists.

## Routing defaults

- Architecture, planning, and synthesis: orchestrator
- Cursor rules, skills, and prompt authoring: `Composer 1.5`
- Research, reviews, and graphics direction: `GPT-5.4-mini`
- Compression, classification, and low-risk summarization: `GPT-5.4-nano`
- Cleanup analysis and removal proposals: `hygienist`
- Implementation after criteria are fixed: `GPT-5.3-codex`
- Azure baseline, deployment flow, and preservation rules: `infrastructure-deployment`

## Agent model map

- `orchestrator` -> `GPT-5.4`
- `composer-meta` -> `Composer 1.5`
- `explorer` -> `GPT-5.4-mini`
- `implementer` -> `GPT-5.3-codex`
- `reviewer` -> `GPT-5.4-mini`
- `tester` -> `GPT-5.4-mini`
- `hygienist` -> `GPT-5.4-nano`
- `graphic-artist` -> `GPT-5.4-mini`
- `infrastructure-deployment` -> `GPT-5.4-mini`

## Usage accounting

- Rough slice-level cost reference is a first-class framework concern.
- Prefer a lightweight `cost_summary` returned with each agent result.
- Prefer `exact` usage when the provider or platform exposes it.
- Label local token/cost calculations as `estimated` or `unknown`, never as official accounting.
- Persist slice summaries locally as append-only JSONL in `.telemetry/slice-costs.jsonl` when the runtime supports it.

## Visual default

Use the NYCTA-inspired transit/signage system for authoritative "new regime" graphics. Use the whiteboard/cartoon style only for retrospective critique of legacy behavior.
