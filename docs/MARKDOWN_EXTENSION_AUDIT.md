# Markdown extension audit

Generated as part of the markdown hygiene pass: **stale portable-blueprint file references removed**, **`README.md` standardized** repo-wide, then inventory and classification.

**Scope:** Repository tree; `node_modules`, `.next`, `dist`, and other build caches are excluded from enumeration.

## Summary

| Extension | Count |
|-----------|------:|
| `.mdc` | 54 |
| `.md` | 27 |
| **Total** | **81** |

## Convention (applied)

| Role | Extension |
|------|-----------|
| Directory entry / package overview | **`README.md`** (all-caps `README`, extension `.md`) |
| Canonical policy docs under `docs/` (except `README.md`) | **`.mdc`** |
| Repo operating contract | **`AGENTS.mdc`** (root) |
| Cursor agents, skills, rules | **`.mdc`** under `.cursor/` |
| Design-authority doc in assets | **`graphic-design-agent-assets/mta-design-foundation.mdc`** |
| Refs alias map | **`refs/INDEX.md`** |
| Research, hygiene logs, narrative posts, MTA extracts | **`.md`** |

**Capitalization:** Use **`README.md`**, not `readme.md` or `Readme.md`.

**Removed:** All references to a non-existent root portable-blueprint file that was previously named in docs and refs. Generalization content is covered by **`docs/GENERALIZATION_AUDIT.mdc`** and **`refs/INDEX.md`** (alias row). **`AGENTS.mdc`** + **`docs/`** are the live contract.

---

## Fine as-is — `.mdc` (54)

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
- `docs/HEADCOUNT.mdc`
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
- `graphic-design-agent-assets/mta-design-foundation.mdc`

---

## Fine as-is — `.md` (27)

Sorted by path:

- `README.md` (repo root)
- `assets/README.md`
- `assets/examples/README.md`
- `assets/examples/graphic-brief-template.md`
- `assets/posts/2026-03-18-the-janitor-gets-a-badge.md`
- `assets/posts/2026-03-19-the-research-loop-leaves-the-lab.md`
- `assets/posts/2026-03-21-one-index-to-rule-the-refs.md`
- `docs/MARKDOWN_EXTENSION_AUDIT.md` (this inventory)
- `docs/design-language/README.md`
- `framework/README.md`
- `framework/src/visual-system/README.md`
- `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/CANONICAL.md`
- `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/mta_style_guide_extracted.md`
- `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/mta_style_guide_extracted_v2.md`
- `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/mta_style_guide_extracted_v3.md`
- `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/SOFTWARE_WAYFINDING_FOUNDATION.md`
- `graphic-design-agent-assets/graphic-designer.md`
- `product/README.md`
- `refs/INDEX.md`
- `docs/research-workbench-validation.md`

---

## Should change

**None** at audit time. Prior hygiene renamed `framework/README.mdc` and `docs/design-language/README.mdc` to **`README.md`**; `package.json` `validate:docs` and `docs/INDEX.mdc` were updated accordingly.

Re-run inventory after large doc moves to confirm no stray **`README.mdc`** or broken links.

---

## Notes

- **`npm run validate:docs`** checks root `README.md`, `AGENTS.mdc`, and a fixed list of canonical `docs/**/*.mdc` paths including `docs/design-language/README.md`.
- **`docs/MARKDOWN_EXTENSION_AUDIT.md`** is informational (`.md`); it is not required by `validate:docs`.
