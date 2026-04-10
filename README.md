# GrooveGraph Next

`GrooveGraph Next` is a clean-start, workflow-first framework for the GrooveGraph product direction.

**This repository** is the canonical home for orchestration, policy, context-passing contracts, visual system, and the GrooveGraph product app. Do not depend on or sync against any other GrooveGraph-named codebase outside this repo.

## What lives here

- `AGENTS.mdc`: operating contract for the repo
- `docs/AGENT_REGISTRY.mdc`: compact operator matrix and default model map
- `.cursor/agents/`: ten domain agents (`api`, `architecture`, `design`, `development`, `devops`, `graph`, `llm`, `orchestrator`, `qa`, `ui`)
- `.cursor/rules/global/` + `.cursor/rules/engineering/`: shared constraints and standards (including GrooveGraph repo boundary, MTA foundation, Azure baseline notes)
- `.cursor/skills/**/SKILL.md`: reusable execution modules by domain (`api`, `design`, `devops`, `graph`, `llm`, `qa`, `ui`, `shared`)
- `docs/`: canonical framework documentation (`docs/INDEX.mdc` for the full map)
- `product/`: **GrooveGraph Next.js app** — investigation / graph-review workbench (same surface as [groovegraph.s13.nyc](https://groovegraph.s13.nyc/))
- `docs/DB-Schema-Export.typeql`: TypeQL snapshot of the live TypeDB schema (regenerate with `npm run dump:typedb-schema`); legacy Neo4j migration artifacts under `archive/neo4j-branch-only/`

## Local development

- **`npm run dev`** — Product app ([`product/`](product/)), **http://localhost:3000**
- **`npm run build:product`** / **`npm run start:product`** — production build and serve

## Default operating stance

- Agent cards default to **`model: inherit`** so the active Cursor/Composer session picks the model; pin a model on a card only when a lane needs a fixed tier.
- Use **`orchestrator`** for multi-domain routing; **`architecture`** for contract and structure decisions; **`development`** for cross-cutting implementation; specialists (`api`, `ui`, `design`, `graph`, `llm`, `qa`, `devops`) for domain work.
- Optional habit (when not using inherit): stronger model for **`orchestrator`** / architecture judgment; efficient models for **`qa`** review passes and repetitive hygiene scripts under **`docs/HYGIENE.mdc`**.

## First-class accounting

The framework treats rough slice-level cost reference as a core capability, not an afterthought. See `docs/USAGE_ACCOUNTING.mdc` for the `cost_summary` contract and the exact-versus-estimated policy.

By default, persisted slice summaries are appended locally to `.telemetry/slice-costs.jsonl`.

## Traceability

The repo now distinguishes rough local slice-cost telemetry from full observability. See `docs/OBSERVABILITY.mdc` for the traceability contract, structured logging expectations, and the recommended use of the existing Azure Application Insights resource.

## Agent registry

See `docs/AGENT_REGISTRY.mdc` for the full matrix. Agents (each has `.cursor/agents/<name>.mdc`):

- `orchestrator`, `architecture`, `development`, `api`, `ui`, `design`, `graph`, `llm`, `qa`, `devops`

## Visual system

The default visual language follows the **1972 Vignelli NYCTA diagram** and **NYCTA Graphics Standards Manual** discipline as documented in **`docs/design-language/FOUNDATION.mdc`**. Short entry: `docs/VISUAL_STYLE_GUIDE.mdc`. Shared CSS tokens: `product/src/visual-system/nycta-groovegraph-tokens.css` (imported from `product/app/globals.css`). Historical scans and extracts that used to live under `graphic-design-agent-assets/` were removed — recover from **git history** if needed.

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
