# GrooveGraph Next

`GrooveGraph Next` is a clean-start, workflow-first framework for the GrooveGraph product direction.

**This repository** is the canonical home for orchestration, policy, context-passing contracts, visual system, and the GrooveGraph product app. Do not depend on or sync against any other GrooveGraph-named codebase outside this repo. If a sibling **`cursor-agent-baseline`** checkout exists in your workspace, treat it as **read-only** reference material unless you are intentionally editing that starter; delivery targets **`product/`**, **`docs/`**, and **`.cursor/`** here—see **`.cursor/rules/global/repo-boundary.mdc`**.

## What lives here

- **`AGENTS.mdc`**: operating contract for this repo (extends the generic agent-package model with GrooveGraph routing, telemetry, and workbench specifics).
- **`docs/AGENT_REGISTRY.mdc`**: compact operator matrix and default model map.
- **`.cursor/agents/`**: ten domain agents (`api`, `architecture`, `design`, `development`, `devops`, `graph`, `llm`, `orchestrator`, `qa`, `ui`). Each file ends with a **GrooveGraph Next context** section (concrete paths and commands). The upstream baseline uses **`## Project context (optional)`** with **`<TBD>`** placeholders instead—see substitution table below when forking or re-baselining.
- **`.cursor/rules/global/`**: always-on constraints — `change-safety.mdc`, `concise-output.mdc`, `handoff-discipline.mdc`, **`strict-packet-before-code.mdc`** (packet + delegation before writes), **`repo-boundary.mdc`** (this repo vs sibling starters).
- **`.cursor/rules/engineering/`**: standards (`api-design-standards`, `typescript-standards`, `testing-standards`, `typedb-query-standards`, `ui-standards`, `llm-patterns` including delegation packets, `devops-standards` with Azure notes for this app, **`mta-design-foundation.mdc`** for NYCTA-aligned UI).
- **`.cursor/skills/**/SKILL.md`**: reusable execution modules by domain (`api`, `design`, `devops`, `graph`, `llm`, **`qa`**, `ui`, `shared`). QA skills expect **accurate** build/test and evidence pointers in agent context and docs (see below).
- **`docs/`**: canonical framework documentation (`docs/INDEX.mdc` for the full map).
- **`product/`**: **GrooveGraph Next.js app** — investigation / graph-review workbench (same surface as [groovegraph.s13.nyc](https://groovegraph.s13.nyc/)).
- **`docs/DB-Schema-Export.typeql`**: TypeQL snapshot of the live TypeDB schema (regenerate with `npm run dump:typedb-schema`); legacy Neo4j migration artifacts under `archive/neo4j-branch-only/`.
- **`artifacts/`**: shared home for logs, screenshots, and other non-source evidence (see **`artifacts/README.md`**; Cursor debug dumps can be copied from `.cursor/` into **`artifacts/logs/`** when you want them in git).

## Cursor package: substitutions (new projects / rebaselining)

When you adopt or merge from **`cursor-agent-baseline`**, replace stubs and placeholders **before** relying on strict routing and QA plans:

| You must provide | Typical location (this repo) | Baseline stub |
|------------------|------------------------------|---------------|
| **Context packet schema** (fields, examples, stop conditions) | `docs/CONTEXT_PACKETS.mdc` | Referenced only **outside** `.cursor/` in baseline `strict-packet-before-code.mdc` |
| **Delegation / LLM handoffs** pointer | Same doc; `llm-patterns.mdc` §GrooveGraph delegation packets | `llm-patterns.mdc` §Delegation packets (generic) |
| **Strict-packet YAML example** paths | Example uses `product/` in **this** repo’s `strict-packet-before-code.mdc` | `<APP_ROOT>`, `<path/to/file>`, `<TBD>` |
| **Repo boundary** (sibling trees, canonical roots) | `repo-boundary.mdc` names **`cursor-agent-baseline`** and **`product/`** | Generic sibling/read-only wording |
| **Per-agent facts** (scripts, schema, env, UI stack) | **`## GrooveGraph Next context`** on each `.cursor/agents/*.mdc` | **`## Project context (optional)`** + `<TBD>` |
| **Operating contract** beyond the short baseline `AGENTS.mdc` | Root **`AGENTS.mdc`** (telemetry, observability, graph+UI ownership, learned facts) | Minimal routing-only `AGENTS.mdc` |
| **Product-only rules** | e.g. **`mta-design-foundation.mdc`**, Azure subsection in **`devops-standards.mdc`** | Not in baseline; add per product |

**QA alignment (`.cursor/skills/qa/`):** Skills **`test-plan`**, **`regression-check`**, and **`e2e-scenario`** assume inputs like *impacted layers*, *available harnesses*, *critical user paths*, and *layer transitions*. Keep **`qa`** agent context and **`docs/`** (e.g. `docs/research-workbench-validation.md`, hygiene/runbooks) **truthful and current** so verification steps map to real commands (`npm run build:product`, `npm run validate:docs`, `npm run cleanup:check`, etc.) and documented evidence—not stale placeholders.

## Local development

- **Secrets:** use **`product/.env.local`** for local work (see [`product/.env.example`](product/.env.example)). For **Cursor Cloud Agents**, use **My Secrets** with the same names so they can populate `process.env` when the cloud job injects them — see **`AGENTS.mdc`** §Secrets and environment.
- **`npm run dev`** — Product app ([`product/`](product/)), **http://localhost:3000**
- **`npm run build:product`** / **`npm run start:product`** — production build and serve

## Default operating stance

- Agent cards default to **`model: inherit`** so the active Cursor/Composer session picks the model; pin a model on a card only when a lane needs a fixed tier.
- Use **`orchestrator`** for multi-domain routing (in Cursor, assume orchestrator by default per **`.cursor/rules/global/strict-packet-before-code.mdc`**); **`architecture`** for contract and structure decisions; **`development`** for cross-cutting implementation; specialists (`api`, `ui`, `design`, `graph`, `llm`, `qa`, `devops`) for domain work.
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
