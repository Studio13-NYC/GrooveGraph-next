# Subagent Maintenance

## Purpose

Use this checklist whenever you add, rename, remove, or materially change a subagent.

## Required update surfaces

1. Add or update the role card in `.cursor/agents/`
2. Update `framework/src/subagent-registry.ts`
3. Update `.cursor/rules/subagent-routing.mdc`
4. Update `docs/AGENT_ORCHESTRATION.md`
5. Update `docs/MODEL_ROUTING.md` if the model lane changes
6. Update `AGENTS.md` if the repo-level operating contract changes
7. Record the change in `docs/DECISION_LOG.md` if it affects governance
8. Update `docs/HYGIENE.md` if the lane affects cleanup or removal policy
9. Update `README.md` only if the top-level operating stance changes
10. If the lane is canonical, update `framework/src/headcount.ts`, `docs/HEADCOUNT.md`, and `docs/WORKFLOW_VALIDATION.md`

## Add-a-subagent checklist

- define the mission clearly
- define inputs
- define output contract
- define stop conditions
- assign the correct model lane
- ensure packet usage is still valid
- note whether the subagent changes the visual or documentation system
- update typed registry and evidence surfaces when the lane becomes part of the official set

## Remove-or-merge checklist

- remove stale references from docs and rules
- confirm no skills still point at the old role
- note the reason in `docs/DECISION_LOG.md`
