# GrooveGraph Next

`GrooveGraph Next` is a clean-start, workflow-first framework for the GrooveGraph product direction.

**This repository** is the canonical home for orchestration, policy, context-passing contracts, visual system, research tools, and product foundation. Do not depend on or sync against any other GrooveGraph-named codebase outside this repo.

## What lives here

- `AGENTS.mdc`: operating contract for the repo
- `docs/AGENT_REGISTRY.mdc`: compact operator matrix and default model map
- `.cursor/agents/`: specialist agent definitions
- `.cursor/rules/`: durable Cursor rules for routing, context, boundaries, and visual style
- `.cursor/skills/`: reusable skills for orchestration and packet generation
- `refs/INDEX.md`: single alias map (`@refs/INDEX.md`) to canonical docs and `.cursor/rules`
- `docs/`: canonical framework documentation
- `framework/`: first implementation target for orchestration utilities and reusable support code
- `product/`: smoke test app, static styleguides (`public/`), and SWA sibling (`swa-smoke/`)
- `prototypes/`: experiments and disposable spikes
- `research/`: validation evidence, experimental tools, and distilled findings

## Default operating stance

- `GPT-5.4` is the top-level orchestrator
- `Composer 1.5` owns Cursor-native meta-authoring and tool/rule work
- `GPT-5.4-mini` handles exploration, product-definition research, review, visual direction, and test analysis
- `GPT-5.4-nano` handles routing, triage, context compression, and hygiene analysis
- `GPT-5.3-codex` handles bounded implementation work

## First-class accounting

The framework treats rough slice-level cost reference as a core capability, not an afterthought. See `docs/USAGE_ACCOUNTING.mdc` for the `cost_summary` contract and the exact-versus-estimated policy.

By default, persisted slice summaries are appended locally to `.telemetry/slice-costs.jsonl`.

## Traceability

The repo now distinguishes rough local slice-cost telemetry from full observability. See `docs/OBSERVABILITY.mdc` for the traceability contract, structured logging expectations, and the recommended use of the existing Azure Application Insights resource.

## Agent registry

See `docs/AGENT_REGISTRY.mdc` for the full matrix. Quick map:

- `orchestrator` -> `GPT-5.4`
- `composer-meta` -> `Composer 1.5`
- `explorer` -> `GPT-5.4-mini`
- `product-manager` -> `GPT-5.4-mini`
- `implementer` -> `GPT-5.3-codex`
- `reviewer` -> `GPT-5.4-mini`
- `tester` -> `GPT-5.4-mini`
- `hygienist` -> `GPT-5.4-nano`
- `graphic-artist` -> `GPT-5.4-mini`
- `animator` -> `GPT-5.4-mini`
- `infrastructure-deployment` -> `GPT-5.4-mini`

## Visual system

The default visual language follows the **1972 Vignelli NYCTA diagram** and **NYCTA Graphics Standards Manual** discipline under `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/`. Merged authority: `docs/design-language/FOUNDATION.mdc`. Short entry: `docs/VISUAL_STYLE_GUIDE.mdc`. Shared CSS tokens: `@import "@groovegraph-next/framework/nycta-groovegraph-tokens.css";`.

## First docs to read

1. `docs/AGENT_ORCHESTRATION.mdc`
2. `docs/MODEL_ROUTING.mdc`
3. `docs/AGENT_REGISTRY.mdc`
4. `docs/CONTEXT_PACKETS.mdc`
5. `docs/USAGE_ACCOUNTING.mdc`
6. `docs/VISUAL_STYLE_GUIDE.mdc`
7. `AGENTS.mdc`
8. `docs/INDEX.mdc`
9. `docs/AZURE_BASELINE.mdc`
10. `docs/HYGIENE.mdc`
11. `docs/OBSERVABILITY.mdc`
