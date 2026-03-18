# Headcount

## Purpose

`Headcount` is the simple orchestration test suite for `GrooveGraph Next`.

It exists to prove two things:

- the orchestrator can manage real handoffs between specialized agents
- each agent can stay inside its role, follow instructions, and return usable output

It also captures rough reference spend for each slice so orchestration quality and cost discipline can be judged together.

## Test set

`Headcount` has two tests:

1. one serial workflow
2. one async workflow

Together they exercise every current agent lane:

- `orchestrator`
- `composer-meta`
- `explorer`
- `implementer`
- `reviewer`
- `tester`
- `hygienist`
- `graphic-artist`
- `infrastructure-deployment`

## Cost stance

These are not billing figures.

Use them as rough planning envelopes only:

- prefer runtime-returned `cost_summary` when available
- otherwise use the reference budget ranges below
- report totals as `exact`, `estimated`, or `unknown`

## Serial test

### Name

`headcount-serial-release-packet`

### Goal

Demonstrate a strict handoff chain where each agent receives the prior result, uses it correctly, and advances one final release packet under orchestrator control.

### Final project

A synthesized release packet for a tiny smoke-page revision that includes:

- discovered surface
- execution rubric
- visual brief
- bounded implementation artifact
- review findings
- validation result
- hygiene proposal
- deployment notes
- rolled-up rough slice cost

### Step order

1. `explorer` locates the smallest working surface.
2. `composer-meta` turns that discovery into a bounded execution rubric.
3. `graphic-artist` produces a visual brief from the discovered surface and rubric.
4. `implementer` applies the bounded change.
5. `reviewer` checks for regressions.
6. `tester` validates the user-visible result.
7. `hygienist` generates the cleanup proposal.
8. `infrastructure-deployment` defines the release path.
9. `orchestrator` synthesizes the final packet and rough cost total.

### What this tests

- serial handoff quality
- packet discipline
- scope control
- whether later agents truly consume earlier outputs
- whether the orchestrator can preserve reasoning across the full chain

### Pass criteria

- every packet is bounded and role-correct
- every step references the upstream output it depends on
- no agent silently expands scope
- the final synthesis reads like one coherent release packet
- each step returns `cost_summary` or explicitly returns `unknown`

### Reference budget

| Step | Agent | Rough token range | Rough cost range |
|---|---|---:|---:|
| 1 | `explorer` | 1,200-2,400 | $0.001-$0.003 |
| 2 | `composer-meta` | 1,800-3,200 | $0.002-$0.005 |
| 3 | `graphic-artist` | 1,400-2,800 | $0.001-$0.004 |
| 4 | `implementer` | 2,600-5,200 | $0.003-$0.008 |
| 5 | `reviewer` | 1,500-3,000 | $0.001-$0.004 |
| 6 | `tester` | 1,400-2,600 | $0.001-$0.003 |
| 7 | `hygienist` | 900-1,800 | $0.0005-$0.002 |
| 8 | `infrastructure-deployment` | 1,600-3,200 | $0.002-$0.004 |
| Total before final synthesis | serial subagents | 12,400-24,200 | $0.0115-$0.033 |

The orchestrator should add its own synthesis cost on top when known.

## Async test

### Name

`headcount-async-launch-pack`

### Goal

Demonstrate that the orchestrator can launch multiple bounded tasks in parallel, manage incoming results, and synthesize them into one final launch pack.

### Final project

A synthesized launch pack containing:

- discovered surfaces
- reusable packet/rubric
- title treatment and visual direction
- implementation scaffold
- hygiene notes
- risk list
- validation matrix
- deployment envelope
- rolled-up rough slice cost

### Parallel tasks

- `explorer`: map the launch surfaces
- `composer-meta`: draft the reusable run contract
- `graphic-artist`: set the title treatment and visual frame
- `implementer`: create the assembly scaffold
- `reviewer`: surface the major risks
- `hygienist`: audit the bounded surface and propose cleanup follow-up
- `tester`: define pass/fail checks
- `infrastructure-deployment`: define the release envelope

### Orchestrator responsibility

The orchestrator must:

- fan out independent packets
- collect results without losing the task boundary
- resolve overlap and redundancy
- produce one coherent final pack rather than a list of fragments
- roll up the rough slice cost

### Pass criteria

- async tasks do not block on each other
- each output shape is explicit before launch
- the final synthesis meaningfully combines all async results
- cost summaries are collected and summed when available

### Reference budget

| Step | Agent | Rough token range | Rough cost range |
|---|---|---:|---:|
| A | `explorer` | 1,000-2,200 | $0.001-$0.003 |
| B | `composer-meta` | 1,600-3,000 | $0.002-$0.005 |
| C | `graphic-artist` | 1,200-2,400 | $0.001-$0.003 |
| D | `implementer` | 2,200-4,400 | $0.003-$0.007 |
| E | `reviewer` | 1,200-2,400 | $0.001-$0.003 |
| F | `hygienist` | 900-1,600 | $0.0005-$0.002 |
| G | `tester` | 1,200-2,200 | $0.001-$0.003 |
| H | `infrastructure-deployment` | 1,400-2,800 | $0.002-$0.004 |
| Total before final synthesis | async subagents | 10,700-21,000 | $0.0115-$0.03 |

The orchestrator should add its own synthesis cost on top when known.

## Source of truth

The typed definitions for these tests live in:

- `framework/src/headcount.ts`

That file is the implementation source for:

- step order
- role mapping
- pass criteria
- reference budget ranges

Use this document as the human-readable runbook.

## Current evidence note

The recorded runs on `2026-03-18` predate the `hygienist` lane. They still validate the pre-hygienist framework shape, but the next `headcount` rerun should include the hygiene step so the evidence matches the current lane set.
