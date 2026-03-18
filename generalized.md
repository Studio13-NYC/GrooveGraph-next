# Generalized Project Blueprint

This document is a portable blueprint for running a project as a workflow-first, multi-agent operating system.

It is intentionally generalized:

- no cloud-provider specifics
- no web-framework specifics
- no product-domain specifics

Use it as the starting operating contract for any new project where you want:

- one strong orchestrator
- explicit specialist lanes
- bounded delegation
- durable evidence
- hygiene discipline
- cost awareness
- end-to-end traceability

## 1. Core stance

The system is not designed to maximize agent count.

It is designed to:

- keep authority clear
- keep handoffs bounded
- prevent context bloat
- make validation explicit
- keep work traceable
- keep cleanup real
- preserve enough evidence to explain why decisions were made

The key idea is simple:

- one orchestrator owns decomposition and completion
- specialist lanes own bounded work
- every delegation uses an explicit packet
- every meaningful slice produces evidence
- the orchestrator should delegate downward whenever a cheaper lane can preserve quality

## 2. Non-negotiable principles

Use these as the durable behavioral contract.

### 2.1 One top-level orchestrator

One agent is user-facing and owns:

- task decomposition
- acceptance criteria
- conflict resolution
- final synthesis
- escalation decisions

Subagents do not declare the work complete across domains. The orchestrator does.

The orchestrator should not be the default executor.

It should be the default delegator.

### 2.2 Bounded delegation

Every subagent task must have:

- a narrow goal
- a clear writable boundary
- clear read-only references
- explicit stop conditions
- an explicit output format

If a task cannot be bounded, the orchestrator should not delegate it yet.

### 2.3 One source of truth per concern

Avoid scattered policy.

For each concern, declare one canonical location:

- orchestration model
- routing model
- delegation packet contract
- hygiene contract
- observability contract
- usage accounting contract

Mirrors can exist, but they must never silently outrank the canonical source.

### 2.4 Evidence over vibes

A workflow is not “done” because the plan sounded good.

Completion should be backed by:

- a validation result
- a recorded artifact
- rough cost evidence when available
- explicit unresolved risks when they remain

### 2.5 Proposal-first cleanup

Cleanup is not silent deletion.

Hygiene should:

- identify problems
- produce a human-reviewable proposal
- distinguish machine-local artifacts from source
- never remove committed material without explicit approval

### 2.6 Traceability without log spam

The goal is not to record everything.

The goal is to record enough to answer:

- what happened
- where it happened
- who or what did it
- what it cost
- why it failed or succeeded

## 3. Recommended repo shape

Use a shape like this:

```text
/
  AGENTS.md
  generalized.md
  .cursor/
    agents/
    rules/
    skills/
  docs/
  framework/
  product/
  prototypes/
  research/
```

Meaning:

- `AGENTS.md`: top-level operating contract
- `.cursor/agents/`: role cards for specialist lanes
- `.cursor/rules/`: durable execution rules
- `.cursor/skills/`: reusable workflow helpers
- `docs/`: canonical policy and design docs
- `framework/`: reusable orchestration utilities and contracts
- `product/`: actual project implementation surface
- `prototypes/`: disposable experiments
- `research/`: findings, run artifacts, external references

This shape is optional, but the separation of concerns is not.

## 4. Recommended lane set

These are the core lanes that made the current system coherent.

### 4.1 Orchestrator

Owns:

- decomposition
- acceptance criteria
- final synthesis
- conflict resolution
- completion

Best model class:

- strongest general reasoning model available

### 4.2 Meta lane

Owns:

- rules
- skills
- prompt contracts
- tool contracts
- durable repo behavior

Best model class:

- best environment-native authoring model available

### 4.3 Explorer

Owns:

- bounded context gathering
- path discovery
- fast repo understanding

Best model class:

- mid-cost, strong reasoning model

### 4.4 Implementer

Owns:

- bounded code changes
- refactors after scope is fixed
- patch-ready execution

Best model class:

- code-specialized execution model

### 4.5 Reviewer

Owns:

- bug finding
- regression review
- ambiguity detection
- missing-test identification

Best model class:

- mid-cost review-capable model

### 4.6 Tester

Owns:

- workflow validation
- user-visible pass or fail judgment
- failure interpretation

Best model class:

- mid-cost validation model

### 4.7 Hygienist

Owns:

- cleanup analysis
- dependency and unused-surface review
- local tool-surface review
- `.gitignore` coverage audits for machine-local artifacts
- proposal-first removal guidance

Best model class:

- cheap triage or nano-class model

### 4.8 Graphic Artist

Optional, but valuable when communication matters.

Owns:

- diagrams
- visual briefs
- campaign graphics
- explanatory visual systems

Best model class:

- mid-cost model with taste and structure

### 4.9 Platform or release lane

Owns:

- deployment planning
- release boundaries
- smoke validation expectations
- preservation rules for shared infrastructure

This lane can be merged with infrastructure or separated depending on team size.

Best model class:

- mid-cost operational reasoning model

## 5. Routing strategy

A good routing model is cost-aware by design.

Use a table like this:

| Work type | Recommended model class |
|---|---|
| User interaction, synthesis, cross-domain judgment | strongest reasoning model |
| Rules, prompts, durable workflow behavior | environment-native meta model |
| Research, review, test analysis, docs | strong mid-cost model |
| Compression, triage, hygiene classification | cheap narrow model |
| Bounded implementation | code-specialized model |

Routing rules:

- use the strongest model only where it adds real leverage
- do not use the top model for routine mechanical work
- if a cheaper lane can do the work reliably inside a bounded packet, delegation is the default choice
- do not send vague coding work to the implementer
- escalate back to the orchestrator when outputs conflict or scope changes

## 6. Delegation packet contract

Every subagent handoff should use an explicit packet.

Recommended fields:

- `goal`
- `why_now`
- `tracking`
- `scope`
- `inputs`
- `constraints`
- `reference_boundary`
- `expected_output`
- `stop_conditions`
- `follow_on_hints`

Recommended template:

```yaml
goal: >
  <exact deliverable>
why_now: >
  <why this work is being delegated now>
tracking:
  session_id: <optional>
  chunk_id: <optional>
  parent_chunk_id: <optional>
  measurement_mode: <exact|estimated|unknown>
scope:
  writable:
    - <path>
  readable:
    - <path>
inputs:
  files:
    - <path>
  docs:
    - <path>
  prior_findings:
    - <short note>
constraints:
  - <constraint>
reference_boundary:
  read_only:
    - <reference surface>
  writable:
    - <target surface>
expected_output:
  format: <bullets|table|patch|brief|review>
  must_include:
    - <required element>
stop_conditions:
  - <condition>
follow_on_hints:
  - <likely next consumer>
```

Packet quality checklist:

- Is the scope narrow enough?
- Is the writable surface explicit?
- Is the output format explicit?
- Is the stop condition real?
- Can the next lane use the output without re-asking basic questions?

## 7. Working cycle

Use this loop for most work:

1. Orchestrator defines the desired outcome.
2. Orchestrator pushes the work to the cheapest reliable lane that can handle the next bounded step.
3. Explorer gathers only enough context to act when exploration is needed.
4. Meta lane clarifies the contract if repo behavior is changing.
5. Implementer changes only the bounded surface.
6. Reviewer checks risks and regressions.
7. Tester validates the user-visible result.
8. Hygienist checks cleanup and ignore coverage.
9. Platform or release lane defines the release envelope.
10. Orchestrator synthesizes the slice result and records evidence.

Not every slice needs every lane, but the orchestrator should be explicit about which lanes matter and why.

## 8. Evidence system

You need both human-readable evidence and machine-readable evidence.

### 8.1 Human-readable evidence

Persist run artifacts in a durable location such as `research/`.

Examples:

- serial workflow reports
- async synthesis packs
- hygiene reports
- release packets

These should capture:

- what was attempted
- what changed
- what validated the result
- what still remains uncertain

### 8.2 Machine-readable evidence

Persist structured slice summaries locally in append-only JSONL.

Recommended directory:

- `.telemetry/`

Recommended file:

- `.telemetry/slice-costs.jsonl`

Recommended record shape:

```json
{
  "recordedAt": "2026-03-18T21:00:00.000Z",
  "sliceId": "example-slice-001",
  "sessionId": "example-session",
  "task": "Describe the slice",
  "orchestratorModel": "top-model",
  "summary": {
    "measurementMode": "estimated",
    "totalTokens": 13842,
    "costUsd": 0.01842,
    "agentSummaries": []
  }
}
```

This should be:

- local
- append-only
- rough-reference telemetry
- ignored by git

## 9. Usage accounting

Treat costs in three tiers:

- `exact`: the runtime or provider exposed real numbers
- `estimated`: local approximation or midpoint estimate
- `unknown`: no usable meter exists

Rules:

- never present rough usage as official billing
- ask each lane for a `cost_summary` when possible
- roll up what is known
- keep unknown values explicit instead of inventing false precision

Recommended agent output fields:

- `measurementMode`
- optional `inputTokens`
- optional `outputTokens`
- optional `totalTokens`
- optional `costUsd`
- optional `notes`

## 10. Hygiene system

Hygiene should be a real workflow, not a vague virtue.

Minimum hygiene run:

1. run dependency cleanup tooling
2. run unused-surface analysis tooling
3. audit local tool/cache surfaces
4. audit `.gitignore` coverage for known local artifacts
5. produce a proposal table
6. do not delete anything without explicit approval

Recommended proposal table:

| Path | Reason | Estimated lines removed | Action |
|---|---|---:|---|
| `example/path` | unused dependency, dead file, or missing ignore coverage | 42 | remove, ignore, or keep |

What the hygienist should proactively check:

- dependency cruft
- dead exports
- unused files
- stale docs
- machine-local tool directories
- missing `.gitignore` coverage for known tool surfaces

Examples of machine-local surfaces:

- tool caches
- CLI scratch directories
- local telemetry directories
- environment-local output folders

## 11. Observability contract

Local cost logs are not full observability.

A complete traceability stance should define:

- what identifiers are required
- what runtime events are logged
- where logs go
- how traces are correlated
- what is sampled versus always kept

### 11.1 Required identifiers

Every meaningful workflow should be traceable by:

- `session_id`
- `slice_id`
- `chunk_id` when needed
- `agent`
- `model`
- timestamp
- outcome

For runtime request flows, also capture:

- request or trace id
- route or entrypoint
- stage name
- latency
- success or failure
- error class and concise message

### 11.2 Logging rules

- prefer structured logs over prose
- use stable field names everywhere
- log stage transitions, not every variable mutation
- include explicit start, success, and failure events
- never log secrets or raw sensitive payloads

### 11.3 Practical event set

Start small.

Recommended first custom events:

- `workflow_started`
- `workflow_stage_completed`
- `workflow_failed`
- `review_session_created`
- `deployment_smoke_passed`
- `deployment_smoke_failed`

### 11.4 Cost-sensitive observability

If you are on a free or constrained plan:

- start with traces, requests, exceptions, and a small custom-event set
- sample routine success traffic aggressively
- keep noisy debug logging local and temporary
- do not add more observability infrastructure until the current sink becomes insufficient

## 12. Validation philosophy

Validation should match user reality, not just code reality.

Validation should prove:

- the right thing changed
- the wrong things did not change
- the user-visible behavior is correct
- the release path is understood

Good validation evidence includes:

- local runtime confirmation
- browser-visible confirmation
- API response confirmation
- explicit acknowledgement of what was not validated

Bad validation evidence includes:

- “looks right”
- static code review only
- no mention of runtime constraints
- no mention of cross-origin or environment-specific boundaries

## 13. Serial and async proof patterns

To prove the system works, keep two canonical test shapes.

### 13.1 Serial proof

One bounded task flows through multiple lanes in order.

This proves:

- handoff quality
- packet discipline
- bounded implementation
- downstream consumption of upstream outputs

### 13.2 Async proof

Multiple bounded tasks run independently and then get synthesized.

This proves:

- parallel delegation discipline
- output compatibility
- synthesis quality
- boundary preservation under concurrency

Keep both.

They reveal different failure modes.

## 14. Visual communication

If the project benefits from diagrams, launch materials, or operating-model visuals, treat visual communication as a first-class output of thinking.

Rules:

- define a visual system
- decide when an artifact is authoritative versus satirical or retrospective
- keep visual language consistent
- do not let visual work become decorative entropy

If your project does not need a visual lane, omit it.

If it does, give it a real contract.

## 15. Recommended files to create first

If you want to use this blueprint in a new project, create these first:

1. `AGENTS.md`
2. `.cursor/agents/orchestrator.md`
3. `.cursor/agents/explorer.md`
4. `.cursor/agents/implementer.md`
5. `.cursor/agents/reviewer.md`
6. `.cursor/agents/tester.md`
7. `.cursor/agents/hygienist.md`
8. `docs/AGENT_ORCHESTRATION.md`
9. `docs/MODEL_ROUTING.md`
10. `docs/CONTEXT_PACKETS.md`
11. `docs/USAGE_ACCOUNTING.md`
12. `docs/HYGIENE.md`
13. `docs/OBSERVABILITY.md`
14. `research/`
15. `.telemetry/` ignored by git

Add the visual or platform lanes only if they are genuinely needed.

## 16. Anti-patterns

Avoid these:

- letting every agent write anywhere
- delegating vague tasks
- treating cleanup as an afterthought
- relying on memory instead of packets
- logging everything without correlation
- keeping no evidence because “we remember what happened”
- using the strongest model for every step
- letting the orchestrator absorb ordinary lane work because it feels safer
- hiding uncertainty behind confident summaries
- pretending estimated usage is exact billing
- letting local tool artifacts drift into source control

## 17. What “good” looks like

A good setup feels like this:

- the orchestrator is decisive
- the orchestrator delegates aggressively but responsibly
- the lanes are specialized
- the packets are clear
- the evidence is fresh
- the cleanup is real
- the logs are structured
- the costs are visible enough to matter
- the repo boundaries are obvious
- the whole system can be copied to another project without carrying product-specific baggage

That is the actual blueprint.
