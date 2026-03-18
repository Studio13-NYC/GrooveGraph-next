# Headcount Async Launch Pack 001

## Run

- Run id: `headcount-async-launch-pack-001`
- Test id: `headcount-async-launch-pack`
- Mode: `async`
- Source of truth: `framework/src/headcount.ts`
- Human-readable runbook: `docs/HEADCOUNT.md`
- Purpose: Framework-only synthesis artifact for parallel `headcount` results after orchestrator collection
- Status: `complete`
- Orchestrator owner: `GPT-5.4`
- Final synthesis timestamp: `2026-03-18`

## Framework-Only Scope

This scaffold is intentionally limited to the framework-side `headcount` workflow. It exists to collect async outputs into one launch pack without changing app surfaces.

### Writable Boundary

- `research/headcount/headcount-async-launch-pack-001.md`

### Read Reference Boundary

- `docs/HEADCOUNT.md`
- `docs/INDEX.md`
- `docs/USAGE_ACCOUNTING.md`
- `AGENTS.md`
- `framework/src/headcount.ts`
- `framework/src/usage-accounting.ts`
- `framework/src/telemetry-log.ts`

### Non-Goals

- No `product/` edits
- No deployment execution
- No app-surface implementation
- No speculative requirements outside the async test contract

## Explorer

### Bounded Surface Map

| Field | Value |
|---|---|
| Relevant paths | `docs/HEADCOUNT.md`, `docs/INDEX.md`, `docs/USAGE_ACCOUNTING.md`, `AGENTS.md`, `.cursor/rules/subagent-routing.mdc`, `.cursor/agents/orchestrator.md`, `.cursor/agents/explorer.md`, `.cursor/agents/composer-meta.md`, `framework/src/headcount.ts`, `framework/src/usage-accounting.ts`, `framework/src/telemetry-log.ts`, `framework/src/subagent-registry.ts`, `framework/src/index.ts` |
| Minimum writable surface | `research/headcount/` only |
| Read-only references used | framework docs, framework source, `.cursor` rules/agents |
| Notes on exclusions | No `product/` or deployment surfaces are required for this async framework run |

### Explorer Notes

Keep this run inside the framework/dev boundary only. `../GrooveGraph/` stays read-only reference, and no app-facing surfaces are needed or proposed for the async headcount launch pack.

## Contract

### Async Run Contract

| Contract field | Value |
|---|---|
| Objective | Prove that the orchestrator can launch bounded parallel tasks, absorb incoming results, and synthesize one coherent framework-only launch pack |
| Final project | A synthesized framework launch pack containing discovered surfaces, reusable contract, visual direction, implementation scaffold, risk list, validation matrix, deployment envelope, and rough slice cost |
| Success criteria | Async independence, lane coverage, coherent synthesis, framework-only boundary discipline, and rough cost rollup |
| Output shape | One bounded launch pack artifact in `research/headcount/` plus one JSONL slice summary in `.telemetry/` |
| Stop conditions | Stop when all lane outputs are integrated, major conflicts are resolved explicitly, and the artifact can be judged pass/fail without guessing |

### Packet Discipline

- Packet template version: based on `docs/CONTEXT_PACKETS.md`
- Shared assumptions: every async packet must be independent, bounded, framework-only, and synthesis-ready
- Explicit non-goals: no `product/` edits, no deployment execution, no app-surface implementation, no speculative product requirements
- Overlap resolution notes: typed source-of-truth precedence is `framework/src/headcount.ts`; `docs/HEADCOUNT.md` is the human-readable runbook; `docs/USAGE_ACCOUNTING.md` governs cost-summary interpretation

## Visual Frame

### Title Treatment

- Working title: `HEADCOUNT / Async Launch Pack`
- Audience: framework operators, agent authors, and future orchestration maintainers
- Tone: authoritative, compact, infrastructural, and framework-first

### Visual Direction

| Element | Direction |
|---|---|
| Typography | Bold transit-style sans for the title, compact sans for metadata and section rails |
| Layout posture | Framework report cover / launch packet, not app UI |
| Color stance | Warm off-white ground, black type, one or two restrained route colors as framing accents |
| Graphic motifs | Section rails and route-marker logic that imply orchestration without becoming a dashboard |
| Constraints | No product UI chrome, no glassmorphism, no SaaS gradients, no app-surface styling proposals |

## Implementation Scaffold

### Assembly Intent

This section is reserved for the framework-side implementation contribution for the async launch pack. It should stay artifact-oriented and avoid product or deploy surface changes.

### Structured Inputs

| Input lane | Expected payload |
|---|---|
| `explorer` | bounded paths and relevance |
| `composer-meta` | reusable run contract and rubric |
| `graphic-artist` | title treatment and visual frame |
| `implementer` | framework-only assembly scaffold |
| `reviewer` | major risks |
| `tester` | validation matrix |
| `infrastructure-deployment` | release envelope |

### Assembly Checklist

- [x] Populate lane outputs without expanding scope
- [x] Preserve framework-only boundary
- [x] Resolve duplicated guidance across async results
- [x] Keep final synthesis coherent and single-voice
- [x] Roll up rough slice cost with source labels

### Scaffold Payload

The implementer contribution created this file as the single framework-only synthesis destination. The scaffold established fixed sections for every async lane so the orchestrator could fill one structured artifact instead of merging ad hoc fragments. That resolved the largest async synthesis risk: disconnected outputs with no shared landing zone.

## Risks

| Severity | Risk | Owner | Mitigation | Status |
|---|---|---|---|---|
| High | Infrastructure/deployment guidance could drift into app-release language despite the framework-only boundary | `orchestrator` | Explicitly define this artifact as non-deploying framework work; preserve all app and Azure surfaces in the release envelope | Resolved |
| High | Async outputs could remain structurally incompatible at synthesis time | `orchestrator` | Use the implementer scaffold as the fixed schema and map every lane into a named section | Resolved |
| Medium | Cost rollup could mislead if unknown values are silently invented | `orchestrator` | Use `docs/USAGE_ACCOUNTING.md` rules; mark rough values as estimated and keep orchestrator synthesis cost explicit if known, otherwise unknown | Mitigated |
| Medium | Source-of-truth precedence could drift between typed and prose definitions | `orchestrator` | Declare `framework/src/headcount.ts` as implementation authority and `docs/HEADCOUNT.md` as human-readable runbook | Resolved |
| Medium | Framework-only boundary could still drift in future reruns | `future orchestrator` | Reuse the explorer boundary map and tester matrix; fail any rerun that introduces `product/` or deployment execution | Open |

## Validation Matrix

| Check | Type | Expected evidence | Result | Notes |
|---|---|---|---|---|
| Framework-only boundary | Boundary | Final pack stays entirely on `docs/`, `framework/`, and `research/headcount/` surfaces | Pass | No `product/` target or deploy execution appears in the final artifact |
| Required async lane coverage | Coverage | All async lanes are represented and populated | Pass | Explorer, composer-meta, graphic-artist, implementer, reviewer, tester, and infrastructure-deployment all contributed |
| Independent async outputs | Concurrency | Each lane output stands alone and does not wait on sibling results | Pass | No async lane returned a “waiting on X” dependency |
| Source-of-truth alignment | Governance | Final pack matches `framework/src/headcount.ts` and `docs/HEADCOUNT.md` | Pass | Typed source and runbook are aligned in this artifact |
| Coherent final synthesis | Synthesis | Final pack reads as one bounded artifact rather than seven fragments | Pass | Shared schema and section ownership resolved overlap |
| Usable validation evidence | Validation | An operator can judge pass/fail without guessing | Pass | Criteria and evidence are explicit in this file |
| Cost completeness | Telemetry | Rough slice cost is rolled up with `estimated` or `unknown` labels only | Pass | Values are explicitly rough reference only |

## Deployment Envelope

### Release Boundary

| Field | Value |
|---|---|
| Target surface | Internal framework artifact only: `research/headcount/headcount-async-launch-pack-001.md` and `.telemetry/slice-costs.jsonl` |
| Preserve surfaces | `rg-groovegraph`, `plan-groovegraph`, `appi-groovegraph`, alerting, `swa-groovegraph`, `as-groovegraph-api`, and all `product/` surfaces |
| Overwrite surfaces | None outside the framework workbench artifact path |
| Smoke plan | Confirm the file stays framework-only, all lane sections are populated, and the JSONL slice summary is appended locally |
| Rollback note | Delete or replace the framework artifact only; no Azure rollback or app rollback is required |

### Execution Status

No deployment action belongs in this scaffold. This is a releasable framework artifact only, not an app rollout.

## Rough Slice Cost

| Lane | Measurement mode | Input tokens | Output tokens | Total tokens | Cost USD | Notes |
|---|---|---:|---:|---:|---:|---|
| `explorer` | `estimated` | 2200 | 300 | 2500 | 0.0020 | Returned by subagent as rough reference |
| `composer-meta` | `estimated` | 3300 | 900 | 4200 | 0.0035 | Midpoint normalized from returned async budget range |
| `graphic-artist` | `estimated` | 1400 | 420 | 1820 | 0.0020 | Returned by subagent as rough reference |
| `implementer` | `estimated` | 2500 | 1400 | 3900 | 0.0050 | Returned by subagent as rough reference |
| `reviewer` | `estimated` | 2600 | 700 | 3300 | 0.0030 | Returned by subagent as rough reference |
| `tester` | `estimated` | 4300 | 1200 | 5500 | 0.0040 | Returned by subagent as rough reference |
| `infrastructure-deployment` | `estimated` | 1700 | 300 | 2000 | 0.0030 | Midpoint normalized from returned async budget range |
| `orchestrator synthesis` | `unknown` | `unknown` | `unknown` | `unknown` | `unknown` | No runtime meter for the top-level synthesis step in this environment |
| `total` | `estimated` | `unknown` | `unknown` | 23220 | 0.0225 | Known subagent subtotal only; excludes orchestrator synthesis |

### Reference Budget Envelope

- Async subagents reference range from `framework/src/headcount.ts`: `9,800-19,400` tokens
- Async subagents reference cost range from `framework/src/headcount.ts`: `$0.011-$0.028`
- Add orchestrator synthesis cost when known

## Final Judgment

### Decision

- Launch-pack completeness: `pass`
- Boundary discipline: `pass`
- Cost confidence: `estimated`
- Overall judgment: `pass`

### Orchestrator Fill Notes

- The async run succeeded because every lane contributed a bounded result, the final artifact stayed outside the app surfaces, and the synthesis resolved the original scaffold ambiguities called out by the reviewer.
- The remaining open issue is not orchestration quality but telemetry fidelity: orchestrator synthesis cost remains `unknown` in this runtime.
- This launch pack is suitable as framework evidence, a reusable async run example, and a future template for framework-only orchestration checks.
