# Documentation Index

## Product

| File | Purpose |
|---|---|
| `product/RESEARCH_WORKBENCH_PRD.md` | PRD: research workbench — triplet UX → Neo4j persistence → session graph visualization |

## Canonical docs

| File | Purpose |
|---|---|
| `AGENT_ORCHESTRATION.md` | Canonical orchestration and authority model |
| `MODEL_ROUTING.md` | Canonical routing and model-selection source |
| `AGENT_REGISTRY.md` | Compact operator matrix for current lanes and default models |
| `CONTEXT_PACKETS.md` | Canonical delegation packet schema |
| `USAGE_ACCOUNTING.md` | Canonical rough slice-cost model and JSONL telemetry persistence |
| `VISUAL_STYLE_GUIDE.md` | Short entry: graphics system, regimes, checklist |
| `design-language/FOUNDATION.md` | Merged NYCTA / Vignelli design authority (map + manual + software) |
| `design-language/README.md` | Index for the design-language folder |
| `design-language/GRAPHIC_ARTIST_WORKBENCH_NEXT_INSTRUCTIONS.md` | Execution brief for research workbench chrome (graphic-artist lane) |
| `GITHUB_STRATEGY.md` | Canonical successor-repo and remote strategy |
| `AZURE_BASELINE.md` | Current Azure environment, preservation rules, and overwrite boundaries |
| `HYGIENE.md` | Canonical cleanup workflow, `hygienist` lane, and proposal-first removal policy |
| `OBSERVABILITY.md` | Canonical traceability, logging, and Azure runtime observability guidance |
| `DECISION_LOG.md` | Durable record of governing decisions |
| `SUBAGENT_MAINTENANCE.md` | Checklist for adding or changing subagents |
| `HEADCOUNT.md` | Canonical serial and async orchestration test suite for current agents |
| `WORKFLOW_VALIDATION.md` | Evidence from representative framework workflow checks |
| `GENERALIZATION_AUDIT.md` | Audit against `generalized.md`; reusable vs product-specific; fork checklist |
| `RESEARCH_WORKBENCH_WAYFINDING_PLAN.md` | Live-site design critique turned into a `graphic-artist` execution brief and implementation-ready S13/MTA redesign plan for the research workbench |

## Precedence

When files drift, use this precedence:

1. `docs/MODEL_ROUTING.md` for routing decisions
2. `docs/AGENT_ORCHESTRATION.md` for hierarchy and authority
3. `docs/AGENT_REGISTRY.md` for the current agent matrix and default model assignments
4. `docs/CONTEXT_PACKETS.md` for packet fields and delegation boundaries
5. `docs/USAGE_ACCOUNTING.md` for rough usage, cost reference, and telemetry persistence rules
6. `docs/HYGIENE.md` for cleanup tooling, proposal format, and deletion guardrails
7. `docs/OBSERVABILITY.md` for traceability, runtime logging, and Azure telemetry guidance
8. `docs/design-language/FOUNDATION.md` and `docs/VISUAL_STYLE_GUIDE.md` for graphics and visual regime decisions
9. `AGENTS.md` as the repo-level operating summary
10. `.cursor/rules/*.mdc` as executable mirrors that must stay in sync with the docs

## Root references

| File | Purpose |
|---|---|
| `../generalized.md` | Portable blueprint (no cloud-, web-framework, or product-domain specifics). Use when deriving a new project or auditing generalization. |

## Related surfaces

- `.cursor/agents/` for role cards
- `.cursor/rules/` for durable Cursor behavior
- `.cursor/skills/` for reusable operational helpers — orchestration checklist (`agent-orchestrator`), packet template (`context-packet-builder`, canonical schema in `CONTEXT_PACKETS.md`), and visual/motion helpers (`studio13-wayfinding-system`, `gsap-motion-system`, `graph-data-viz-system`)
- `../refs/INDEX.md` for the consolidated alias map (`@refs/INDEX.md`) to canonical docs and rules
- `assets/posts/` for narrative updates and framework blog posts
- `research/` for validation evidence, reboot briefs, and experimental product surfaces

## Posts

| File | Purpose |
|---|---|
| `../assets/posts/2026-03-18-the-janitor-gets-a-badge.md` | Narrative post on making hygiene a first-class lane and turning cleanup into a real, proposal-first workflow |
| `../assets/posts/2026-03-19-the-research-loop-leaves-the-lab.md` | Narrative post on turning the OpenAI research workspace from a design intention into a real discovery-first investigation loop |
| `../assets/posts/2026-03-21-one-index-to-rule-the-refs.md` | Consolidating refs, research evidence, and product deps after a composer-meta + hygienist pass |
