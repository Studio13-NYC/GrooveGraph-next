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
- Delegate downward by default when a cheaper lane can do the work within a clear boundary.
- Keep one active writable surface per task.
- Prefer framework-first changes over product speculation.
- Preserve clean boundaries between `framework/`, `product/`, `prototypes/`, and `research/`.
- Treat visual communication as part of the product of thinking, not decoration.
- Be forthright, opinionated, and comfortable disagreeing when a better path exists.

## Routing defaults

- Architecture, planning, and synthesis: orchestrator `GPT-5.4`
- Cursor rules, skills, and prompt authoring: `Composer 1.5`
- Research, reviews, and graphics direction: `GPT-5.4-mini`
- Discovery-first product framing and reboot briefs: `product-manager`
- Compression, classification, and low-risk summarization: `GPT-5.4-nano`
- Cleanup analysis and removal proposals: `hygienist`
- Implementation after criteria are fixed: `GPT-5.3-codex`
- Azure baseline, deployment flow, and preservation rules: `infrastructure-deployment`
- `GPT-5.4` should keep only synthesis, conflict resolution, and materially cross-domain judgment unless a lower-cost lane would risk quality

## Agent model map

- `orchestrator` -> `GPT-5.4`
- `composer-meta` -> `Composer 1.5`
- `explorer` -> `GPT-5.4-mini`
- `product-manager` -> `GPT-5.4-mini`
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

## Observability

- Full traceability requires more than local slice-cost logging.
- Use structured identifiers such as `session_id`, `slice_id`, `chunk_id`, `agent`, and `model` across orchestrated work.
- Use the existing Azure Application Insights resource as the default runtime telemetry sink when product/runtime observability is added.
- Prefer sampled traces, requests, exceptions, and selected custom events over indiscriminate high-volume logs.

## Visual default

Use the NYCTA-inspired transit/signage system for authoritative "new regime" graphics. Use the whiteboard/cartoon style only for retrospective critique of legacy behavior.

## Cursor Cloud specific instructions

### Workspace structure

npm workspaces monorepo with three packages: `framework/` (TypeScript library stubs), `product/` (Next.js 16 smoke-test app), and `research/tools/openai-research-workspace/` (Next.js 16 OpenAI-powered research workbench). All scripts are in the root `package.json`.

### Running services

| Service | Command | Port | Notes |
|---|---|---|---|
| Product app | `npm run dev:product` | 3000 | Minimal smoke test; no external deps |
| Research workspace | `npm run dev:research-workspace` | 3011 | Requires `OPENAI_API_KEY` in `.env.local` (see below) |

### Environment variables

The research workspace needs `research/tools/openai-research-workspace/.env.local` with at least `OPENAI_API_KEY`. Copy from `.env.example` in the same directory. The `OPENAI_API_KEY` env var is injected as a Cursor secret; create `.env.local` on session start:

```sh
echo "OPENAI_API_KEY=${OPENAI_API_KEY}" > research/tools/openai-research-workspace/.env.local
```

### Validation (no ESLint / no test framework)

This repo has no ESLint config and no test framework (jest/vitest). Validation is done via:
- `npm run validate:repo` / `validate:docs` / `validate:framework` / `validate:visual-system`
- TypeScript type-checking: `npx tsc --noEmit` inside `product/` or `research/tools/openai-research-workspace/`

### Build

- `npm run build:product` and `npm run build:research-workspace` both produce standalone Next.js builds.

### Gotchas

- Node.js >= 22 required (Next.js 16 + OpenAI SDK v6).
- The research workspace uses the OpenAI Responses API with `web_search` tool and `conversation` persistence. Sessions are stored as JSON files under `.data/` (git-ignored).
- The `.env.example` defaults reference `gpt-5.4` / `gpt-5.4-mini` models. If your API key doesn't have access, override via `OPENAI_RESEARCH_MODEL` and `OPENAI_RESEARCH_EXTRACTION_MODEL` in `.env.local`.
