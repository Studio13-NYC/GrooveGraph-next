# Workflow Validation

## Goal

Validate that the new framework supports representative workflows before any new GrooveGraph product build begins.

## Validation 1: repo scaffold

Command:

```powershell
npm run validate:repo
```

Observed result:

- passed
- confirms the new repo scaffold is present and executable as a workspace shell target

## Validation 2: canonical docs presence

Command:

```powershell
npm run validate:docs
```

Observed result:

- passed
- confirms the root operating contract and core docs exist

## Validation 3: rule-authoring workflow

Validation method:

- read-only subagent review against the new repo only

Observed result:

- the repo was structurally sufficient for rule-authoring
- the validator identified the expected sync points:
  - `.cursor/rules/subagent-routing.mdc`
  - `docs/MODEL_ROUTING.md`
  - `docs/AGENT_ORCHESTRATION.md`
  - `AGENTS.md`
- mild ambiguity was found around canonical precedence and missing maintenance docs

Framework response:

- added `docs/INDEX.md`
- added `docs/SUBAGENT_MAINTENANCE.md`
- clarified canonical precedence in `docs/AGENT_ORCHESTRATION.md` and `docs/MODEL_ROUTING.md`

## Validation 4: bounded implementation workflow

Validation method:

- read-only subagent review against the new repo only

Observed result:

- writable vs read-only boundaries were clear
- the repo correctly signaled that new subagent work belongs in the meta/routing surfaces
- the main missing piece was an explicit add-a-subagent checklist

Framework response:

- added `docs/SUBAGENT_MAINTENANCE.md`

## Validation 5: graphic workflow

Validation method:

- read-only subagent review against the new repo only

Observed result:

- the conceptual visual split was strong
- the production spec was initially too soft for repeated use

Framework response:

- expanded `docs/VISUAL_STYLE_GUIDE.md` with:
  - palette guidance
  - typography direction
  - stroke and layout grammar
  - template families
  - regime choice rule
- added `assets/README.md`
- added `assets/examples/README.md`
- added reusable artifacts:
  - `assets/examples/new-regime-governance-map.svg`
  - `assets/examples/old-regime-satire-panel.svg`
  - `assets/examples/graphic-brief-template.md`
- added operational visual tokens in `framework/src/visual-system/tokens.ts`

## Outcome

The framework is now validated for the following workflow types:

- repo/rule authoring
- bounded implementation planning
- visual system and graphics workflow

The repo is ready for future execution work as a clean-start framework surface.

## Validation 6: headcount orchestration suite design

Validation method:

- framework-owned test design in `framework/src/headcount.ts`
- human-readable runbook in `docs/HEADCOUNT.md`

Observed result:

- the framework now has one serial orchestration test and one async orchestration test
- both tests cover every current agent lane
- both tests include rough reference budget ranges rather than pretending to be official accounting

Framework response:

- added `framework/src/headcount.ts`
- added `docs/HEADCOUNT.md`
- updated `docs/INDEX.md`

## Validation 7: serial headcount execution

Validation method:

- executed the serial `headcount-serial-release-packet` workflow through the current agent set
- persisted a human-readable run report and a JSONL slice summary

Observed result:

- pass
- each current lane participated in the expected serial order
- the run converged on a real one-file smoke-page revision in `product/app/page.tsx`
- reviewer found no issues
- tester validated the revised page through build and local runtime evidence
- infrastructure-deployment produced a bounded App Service release path

Framework response:

- added `research/headcount/headcount-serial-run-001.md`
- added `.telemetry/slice-costs.jsonl`

## Validation 8: async headcount execution

Validation method:

- executed the async `headcount-async-launch-pack` workflow through the current agent set
- synthesized the results into one framework-only launch pack
- persisted a JSONL slice summary

Observed result:

- pass
- the run stayed inside the framework/workbench boundary
- every async lane contributed an independent result
- the orchestrator resolved scaffold ambiguity into one coherent final artifact
- rough slice cost was persisted with estimated values and explicit unknowns where appropriate

Framework response:

- populated `research/headcount/headcount-async-launch-pack-001.md`
- appended async run telemetry to `.telemetry/slice-costs.jsonl`

## Validation 9: hygiene lane bootstrap

Validation method:

- added a dedicated `hygienist` lane to the framework surfaces
- added the root `cleanup:check` script for `npm prune` plus `npx knip`
- ran the hygiene workflow as a proposal-first cleanup check

Observed result:

- the framework now has an explicit owner for cleanup analysis instead of relying on ad hoc shell habits
- the repo script now matches the documented cleanup workflow
- any future removals remain gated by human approval rather than being hidden inside automation

Framework response:

- added `.cursor/agents/hygienist.md`
- added `docs/HYGIENE.md`
- updated routing, orchestration, and maintenance docs to include the hygiene lane
- updated `docs/HEADCOUNT.md` and `framework/src/headcount.ts` so the current agent set is represented honestly
- added `research/hygiene/hygiene-run-001.md`

## Validation 10: refreshed serial headcount evidence

Validation method:

- reran the serial `headcount-serial-release-packet` workflow against the current lane set
- used one bounded implementation surface: `product/swa-smoke/index.html`
- validated the rendered result through a local browser-served static page

Observed result:

- pass
- the rerun exercised the full current serial lane set, including `hygienist`
- the run converged on a real one-file SWA smoke-page parity revision
- browser-visible evidence confirmed the explanatory `body` line now renders beneath the red status banner
- local browser testing also exposed a real boundary: localhost validation cannot prove remote App Service hydration because the static page hits a CORS restriction from `http://localhost:3001`
- the bounded hygiene step returned no cleanup action

Framework response:

- added `research/headcount/headcount-serial-run-002.md`

## Validation 11: refreshed async headcount evidence

Validation method:

- reran the async `headcount-async-launch-pack` evidence pass against the current typed and documented contract
- synthesized a refreshed framework-only launch pack that explicitly includes `hygienist`

Observed result:

- pass
- all current async lanes are now represented in the refreshed evidence
- the framework-only boundary remains explicit and intact
- the cost summary remains rough-reference telemetry with explicit `estimated` and `unknown` labels only

Framework response:

- added `research/headcount/headcount-async-launch-pack-002.md`
