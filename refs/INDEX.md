# Refs index (chat aliases)

Use **`@refs/INDEX.md`** when you want one place that maps short names to canonical sources.

## Precedence

- These rows are **aliases**, not policy.
- When an alias and the source differ, **the source wins**.
- Canonical prose lives under **`docs/`** and repo root **`AGENTS.mdc`**.
- Executable Cursor mirrors live under **`.cursor/rules/*.mdc`**.

## Canonical document aliases

| Topic | Canonical path | Use for |
| --- | --- | --- |
| Agents / operating contract | `AGENTS.mdc` | Default delegation, model map, repo summary |
| Orchestration | `docs/AGENT_ORCHESTRATION.mdc` | Authority and hierarchy |
| Routing | `docs/MODEL_ROUTING.mdc` | Model selection |
| Context packets | `docs/CONTEXT_PACKETS.mdc` | Delegation packet schema |
| Usage / cost accounting | `docs/USAGE_ACCOUNTING.mdc` | Slice cost, telemetry |
| Hygiene | `docs/HYGIENE.mdc` | Cleanup workflow, hygienist lane |
| Observability | `docs/OBSERVABILITY.mdc` | Tracing, Azure logging |
| Visual system | `docs/design-language/FOUNDATION.mdc`, `docs/VISUAL_STYLE_GUIDE.mdc`, `framework/src/visual-system/nycta-groovegraph-tokens.css` | Graphics tokens and regimes |
| Azure | `docs/AZURE_BASELINE.mdc` | Environment and deploy boundaries |
| Workflow validation | `docs/WORKFLOW_VALIDATION.mdc` | Framework check evidence |
| Headcount suite | `docs/HEADCOUNT.mdc` | Serial/async orchestration tests |
| Generalization audit | `docs/GENERALIZATION_AUDIT.mdc` | Reuse vs product-specific; fork checklist |

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

- Full doc map: `docs/INDEX.mdc`
- Workbench validation record: `docs/research-workbench-validation.md` (older headcount / hygiene narratives lived under `research/` before repo consolidation — retrieve from git history if needed)
