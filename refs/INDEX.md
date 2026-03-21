# Refs index (chat aliases)

Use **`@refs/INDEX.md`** when you want one place that maps short names to canonical sources.

## Precedence

- These rows are **aliases**, not policy.
- When an alias and the source differ, **the source wins**.
- Canonical prose lives under **`docs/`** and repo root **`AGENTS.md`**.
- Executable Cursor mirrors live under **`.cursor/rules/*.mdc`**.

## Canonical document aliases

| Topic | Canonical path | Use for |
| --- | --- | --- |
| Agents / operating contract | `AGENTS.md` | Default delegation, model map, repo summary |
| Orchestration | `docs/AGENT_ORCHESTRATION.md` | Authority and hierarchy |
| Routing | `docs/MODEL_ROUTING.md` | Model selection |
| Context packets | `docs/CONTEXT_PACKETS.md` | Delegation packet schema |
| Usage / cost accounting | `docs/USAGE_ACCOUNTING.md` | Slice cost, telemetry |
| Hygiene | `docs/HYGIENE.md` | Cleanup workflow, hygienist lane |
| Observability | `docs/OBSERVABILITY.md` | Tracing, Azure logging |
| Visual system | `docs/design-language/FOUNDATION.md`, `docs/VISUAL_STYLE_GUIDE.md`, `framework/src/visual-system/nycta-groovegraph-tokens.css` | Graphics tokens and regimes |
| Azure | `docs/AZURE_BASELINE.md` | Environment and deploy boundaries |
| Workflow validation | `docs/WORKFLOW_VALIDATION.md` | Framework check evidence |
| Headcount suite | `docs/HEADCOUNT.md` | Serial/async orchestration tests |
| Generalization blueprint | `generalized.md` | Portable fork / audit source |

## Rule mirrors (`.cursor/rules`)

| Topic | Path |
| --- | --- |
| Subagent routing | `.cursor/rules/subagent-routing.mdc` |
| Context passing | `.cursor/rules/context-passing.mdc` |
| Forthright guidance | `.cursor/rules/forthright-guidance.mdc` |
| Reference boundary | `.cursor/rules/reference-boundary.mdc` |
| Composer meta lane | `.cursor/rules/composer-meta-lane.mdc` |
| Infrastructure deployment | `.cursor/rules/infrastructure-deployment.mdc` |
| Visual style guide | `.cursor/rules/visual-style-guide.mdc` |

## Related

- Full doc map: `docs/INDEX.md`
- Research evidence (headcount, hygiene, tool validation): `research/headcount/`, `research/hygiene/`, `research/openai-research-workspace-validation.md`
