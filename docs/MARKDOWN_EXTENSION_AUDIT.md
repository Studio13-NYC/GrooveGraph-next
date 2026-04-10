# Markdown extension audit

Generated as part of the markdown hygiene pass: **stale portable-blueprint file references removed**, **`README.md` standardized** repo-wide, then inventory and classification.

**Scope:** Repository tree; `node_modules`, `.next`, `dist`, and other build caches are excluded from enumeration.

## Summary

| Extension | Count |
|-----------|------:|
| `.mdc` | 53 |
| `.md` | 14 |
| **Total** | **67** |

## Convention (applied)

| Role | Extension |
|------|-----------|
| Directory entry / package overview | **`README.md`** (all-caps `README`, extension `.md`) |
| Canonical policy docs under `docs/` (except `README.md`) | **`.mdc`** |
| Repo operating contract | **`AGENTS.mdc`** (root) |
| Cursor agents, skills, rules | **`.mdc`** under `.cursor/` |
| Design authority (merged) | **`docs/design-language/FOUNDATION.mdc`** (see also **`.cursor/rules/mta-design-foundation.mdc`**) |
| Research, hygiene logs, narrative posts | **`.md`** |

**Capitalization:** Use **`README.md`**, not `readme.md` or `Readme.md`.

**Removed:** All references to a non-existent root portable-blueprint file that was previously named in docs. Generalization content is covered by **`docs/GENERALIZATION_AUDIT.mdc`**. **`AGENTS.mdc`** + **`docs/`** are the live contract. **`refs/`** and **`orchestration/`** were later removed — use **`docs/INDEX.mdc`** as the single doc map. Repo-root **`ontology/`** was removed; live TypeDB **`define`** text is captured in **`docs/DB-Schema-Export.typeql`** (regenerate: **`npm run dump:typedb-schema`**).

---

## Fine as-is — `.mdc` (53)

Sorted by path:

- `AGENTS.mdc`
- `.cursor/agents/animator.mdc`
- `.cursor/agents/composer-meta.mdc`
- `.cursor/agents/explorer.mdc`
- `.cursor/agents/graphic-artist.mdc`
- `.cursor/agents/hygienist.mdc`
- `.cursor/agents/implementer.mdc`
- `.cursor/agents/infrastructure-deployment.mdc`
- `.cursor/agents/orchestrator.mdc`
- `.cursor/agents/product-manager.mdc`
- `.cursor/agents/reviewer.mdc`
- `.cursor/agents/tester.mdc`
- `.cursor/rules/composer-meta-lane.mdc`
- `.cursor/rules/concise-interaction.mdc`
- `.cursor/rules/context-passing.mdc`
- `.cursor/rules/forthright-guidance.mdc`
- `.cursor/rules/infrastructure-deployment.mdc`
- `.cursor/rules/mta-design-foundation.mdc`
- `.cursor/rules/reference-boundary.mdc`
- `.cursor/rules/subagent-routing.mdc`
- `.cursor/rules/visual-style-guide.mdc`
- `.cursor/skills/agent-orchestrator/SKILL.mdc`
- `.cursor/skills/cloud-agent-repo-starter/SKILL.mdc`
- `.cursor/skills/context-packet-builder/SKILL.mdc`
- `.cursor/skills/graph-data-viz-system/reference.mdc`
- `.cursor/skills/graph-data-viz-system/SKILL.mdc`
- `.cursor/skills/gsap-motion-system/reference.mdc`
- `.cursor/skills/gsap-motion-system/SKILL.mdc`
- `.cursor/skills/studio13-wayfinding-system/reference.mdc`
- `.cursor/skills/studio13-wayfinding-system/SKILL.mdc`
- `docs/AGENT_ORCHESTRATION.mdc`
- `docs/AGENT_REGISTRY.mdc`
- `docs/AZURE_BASELINE.mdc`
- `docs/CONTEXT_PACKETS.mdc`
- `docs/DECISION_LOG.mdc`
- `docs/GENERALIZATION_AUDIT.mdc`
- `docs/GITHUB_STRATEGY.mdc`
- `docs/HYGIENE.mdc`
- `docs/INDEX.mdc`
- `docs/MODEL_ROUTING.mdc`
- `docs/OBSERVABILITY.mdc`
- `docs/RESEARCH_WORKBENCH_WAYFINDING_PLAN.mdc`
- `docs/SUBAGENT_MAINTENANCE.mdc`
- `docs/USAGE_ACCOUNTING.mdc`
- `docs/VISUAL_STYLE_GUIDE.mdc`
- `docs/WORKFLOW_VALIDATION.mdc`
- `docs/design-language/FIGMA_DESIGN_SYSTEM_RULES.mdc`
- `docs/design-language/FIGMA_MCP.mdc`
- `docs/design-language/FOUNDATION.mdc`
- `docs/design-language/GRAPHIC_ARTIST_WORKBENCH_NEXT_INSTRUCTIONS.mdc`
- `docs/design-language/WORKBENCH_VOCAB.mdc`
- `docs/product/RESEARCH_WORKBENCH_PRD.mdc`
- `docs/ux/RESEARCH_WORKBENCH_UX_INTERVIEW.mdc`

---

## Fine as-is — `.md` (14)

Sorted by path:

- `README.md` (repo root)
- `.cursor/plans/archive/graph_provider_neo4j-typedb_3ef1b048.plan.md`
- `.cursor/plans/neo4j_branch_typedb_cleanup.plan.md`
- `assets/README.md`
- `assets/examples/README.md`
- `assets/examples/graphic-brief-template.md`
- `assets/posts/2026-03-18-the-janitor-gets-a-badge.md`
- `assets/posts/2026-03-19-the-research-loop-leaves-the-lab.md`
- `assets/posts/2026-03-21-one-index-to-rule-the-refs.md`
- `docs/MARKDOWN_EXTENSION_AUDIT.md` (this inventory)
- `docs/design-language/README.md`
- `docs/research-workbench-validation.md`
- `product/README.md`
- `product/src/visual-system/README.md`

---

## Should change

**None** at audit time. Prior hygiene renamed `docs/design-language/README.mdc` to **`README.md`**; `package.json` `validate:docs` and `docs/INDEX.mdc` were updated accordingly. The old `framework/` workspace was folded into **`product/src/visual-system/`** (orchestration TS lived under **`orchestration/`** until that folder was removed). **`graphic-design-agent-assets/`** (MTA scans, extracts, duplicate rule fragment) was **removed** — recover from **git history** if needed; authority lives in **`docs/design-language/FOUNDATION.mdc`**. Re-run a file inventory to refresh counts in this table.

Re-run inventory after large doc moves to confirm no stray **`README.mdc`** or broken links.

---

## Notes

- **`npm run validate:docs`** checks root `README.md`, `AGENTS.mdc`, and a fixed list of canonical `docs/**/*.mdc` paths including `docs/design-language/README.md`.
- **`docs/MARKDOWN_EXTENSION_AUDIT.md`** is informational (`.md`); it is not required by `validate:docs`.
- **`docs/DB-Schema-Export.typeql`** is TypeQL (not Markdown): snapshot of the live TypeDB schema via HTTP **`getDatabaseSchema`**; refresh with **`npm run dump:typedb-schema`** (uses `product/.env.local`).
