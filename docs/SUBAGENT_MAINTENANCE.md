# Subagent Maintenance

## Purpose

Use this checklist whenever you add, rename, remove, or materially change a subagent.

## Required update surfaces

1. Add or update the role card in `.cursor/agents/`
2. Update `.cursor/rules/subagent-routing.mdc`
3. Update `docs/AGENT_ORCHESTRATION.md`
4. Update `docs/MODEL_ROUTING.md` if the model lane changes
5. Update `AGENTS.md` if the repo-level operating contract changes
6. Record the change in `docs/DECISION_LOG.md` if it affects governance
7. Update `docs/HYGIENE.md` if the lane affects cleanup or removal policy
8. Update `README.md` only if the top-level operating stance changes

## Add-a-subagent checklist

- define the mission clearly
- define inputs
- define output contract
- define stop conditions
- assign the correct model lane
- ensure packet usage is still valid
- note whether the subagent changes the visual or documentation system

## Remove-or-merge checklist

- remove stale references from docs and rules
- confirm no skills still point at the old role
- note the reason in `docs/DECISION_LOG.md`
