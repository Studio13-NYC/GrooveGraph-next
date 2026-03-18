# GrooveGraph Next

`GrooveGraph Next` is a clean-start, workflow-first framework for building a new GrooveGraph successor.

This repository is intentionally separate from the legacy `GrooveGraph` codebase. The older project is treated as read-only reference material for lessons, examples, and constraints. This repo is the writable surface for the new orchestration system, policy layer, context-passing contracts, visual system, and future product foundation.

## What lives here

- `AGENTS.md`: operating contract for the repo
- `.cursor/agents/`: specialist agent definitions
- `.cursor/rules/`: durable Cursor rules for routing, context, boundaries, and visual style
- `.cursor/skills/`: reusable skills for orchestration and packet generation
- `docs/`: canonical framework documentation
- `framework/`: first implementation target for orchestration utilities and reusable support code
- `product/`: reserved for the future GrooveGraph rebuild
- `prototypes/`: experiments and disposable spikes
- `research/`: distilled findings from the legacy repo and external references

## Default operating stance

- `GPT-5.4` is the top-level orchestrator
- `Composer 1.5` owns Cursor-native meta-authoring and tool/rule work
- `GPT-5.4-mini` handles exploration, review, visual direction, and test analysis
- `GPT-5.4-nano` handles routing, triage, context compression, and hygiene analysis
- `GPT-5.3-codex` handles bounded implementation work

## First-class accounting

The framework treats rough slice-level cost reference as a core capability, not an afterthought. See `docs/USAGE_ACCOUNTING.md` for the `cost_summary` contract and the exact-versus-estimated policy.

By default, persisted slice summaries are appended locally to `.telemetry/slice-costs.jsonl`.

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

## Visual system

The default visual language for future "new regime" maps, diagrams, and governance graphics is the vintage NYCTA-inspired signage and transit-map system associated with Massimo Vignelli and Bob Noorda. See `docs/VISUAL_STYLE_GUIDE.md`.

## First docs to read

1. `docs/AGENT_ORCHESTRATION.md`
2. `docs/MODEL_ROUTING.md`
3. `docs/CONTEXT_PACKETS.md`
4. `docs/USAGE_ACCOUNTING.md`
5. `docs/VISUAL_STYLE_GUIDE.md`
6. `AGENTS.md`
7. `docs/INDEX.md`
8. `docs/AZURE_BASELINE.md`
9. `docs/HYGIENE.md`
