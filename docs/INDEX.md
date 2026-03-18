# Documentation Index

## Canonical docs

| File | Purpose |
|---|---|
| `AGENT_ORCHESTRATION.md` | Canonical orchestration and authority model |
| `MODEL_ROUTING.md` | Canonical routing and model-selection source |
| `CONTEXT_PACKETS.md` | Canonical delegation packet schema |
| `USAGE_ACCOUNTING.md` | Canonical rough slice-cost model and JSONL telemetry persistence |
| `VISUAL_STYLE_GUIDE.md` | Canonical graphics system and visual direction |
| `GITHUB_STRATEGY.md` | Canonical successor-repo and remote strategy |
| `AZURE_BASELINE.md` | Current Azure environment, preservation rules, and overwrite boundaries |
| `HYGIENE.md` | Canonical cleanup workflow, `hygienist` lane, and proposal-first removal policy |
| `DECISION_LOG.md` | Durable record of governing decisions |
| `SUBAGENT_MAINTENANCE.md` | Checklist for adding or changing subagents |
| `HEADCOUNT.md` | Canonical serial and async orchestration test suite for current agents |
| `WORKFLOW_VALIDATION.md` | Evidence from representative framework workflow checks |

## Precedence

When files drift, use this precedence:

1. `docs/MODEL_ROUTING.md` for routing decisions
2. `docs/AGENT_ORCHESTRATION.md` for hierarchy and authority
3. `docs/CONTEXT_PACKETS.md` for packet fields and delegation boundaries
4. `docs/USAGE_ACCOUNTING.md` for rough usage, cost reference, and telemetry persistence rules
5. `docs/HYGIENE.md` for cleanup tooling, proposal format, and deletion guardrails
6. `docs/VISUAL_STYLE_GUIDE.md` for graphics and visual regime decisions
7. `AGENTS.md` as the repo-level operating summary
8. `.cursor/rules/*.mdc` as executable mirrors that must stay in sync with the docs

## Related surfaces

- `.cursor/agents/` for role cards
- `.cursor/rules/` for durable Cursor behavior
- `.cursor/skills/` for reusable operational helpers
- `assets/posts/` for narrative updates and framework blog posts

## Posts

| File | Purpose |
|---|---|
| `../assets/posts/2026-03-18-the-janitor-gets-a-badge.md` | Narrative post on making hygiene a first-class lane and turning cleanup into a real, proposal-first workflow |
