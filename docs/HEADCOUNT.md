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
- `product-manager`
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

A synthesized release packet for a tiny product slice that includes:

- discovered surface
- product framing
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
2. `product-manager` frames the user, hero workflow, flexible persistence stance, and delayed-normalization guardrails.
3. `composer-meta` turns that discovery and product framing into a bounded execution rubric.
4. `graphic-artist` produces a visual brief from the discovered surface and rubric.
5. `implementer` applies the bounded change.
6. `reviewer` checks for regressions.
7. `tester` validates the user-visible result.
8. `hygienist` generates the cleanup proposal.
9. `infrastructure-deployment` defines the release path.
10. `orchestrator` synthesizes the final packet and rough cost total.

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
| 2 | `product-manager` | 1,500-3,000 | $0.0015-$0.004 |
| 3 | `composer-meta` | 1,800-3,200 | $0.002-$0.005 |
| 4 | `graphic-artist` | 1,400-2,800 | $0.001-$0.004 |
| 5 | `implementer` | 2,600-5,200 | $0.003-$0.008 |
| 6 | `reviewer` | 1,500-3,000 | $0.001-$0.004 |
| 7 | `tester` | 1,400-2,600 | $0.001-$0.003 |
| 8 | `hygienist` | 900-1,800 | $0.0005-$0.002 |
| 9 | `infrastructure-deployment` | 1,600-3,200 | $0.002-$0.004 |
| Total before final synthesis | serial subagents | 13,900-27,200 | $0.013-$0.037 |

The orchestrator should add its own synthesis cost on top when known.

## Async test

### Name

`headcount-async-launch-pack`

### Goal

Demonstrate that the orchestrator can launch multiple bounded tasks in parallel, manage incoming results, and synthesize them into one final launch pack.

### Final project

A synthesized launch pack containing:

- discovered surfaces
- product framing
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
- `product-manager`: define the user, hero workflow, persistence stance, and delayed-normalization guardrails
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
| B | `product-manager` | 1,400-2,800 | $0.0015-$0.004 |
| C | `composer-meta` | 1,600-3,000 | $0.002-$0.005 |
| D | `graphic-artist` | 1,200-2,400 | $0.001-$0.003 |
| E | `implementer` | 2,200-4,400 | $0.003-$0.007 |
| F | `reviewer` | 1,200-2,400 | $0.001-$0.003 |
| G | `hygienist` | 900-1,600 | $0.0005-$0.002 |
| H | `tester` | 1,200-2,200 | $0.001-$0.003 |
| I | `infrastructure-deployment` | 1,400-2,800 | $0.002-$0.004 |
| Total before final synthesis | async subagents | 12,100-23,800 | $0.013-$0.034 |

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

The `001` recorded runs on `2026-03-18` predate the `hygienist` and `product-manager` lanes and remain useful historical evidence for the earlier framework shape.

Current evidence is now refreshed by:

- `research/headcount/headcount-serial-run-002.md`
- `research/headcount/headcount-async-launch-pack-002.md`
- `research/product/productmanager-reboot-brief-001.md`

Use the `002` artifacts as the best executed evidence for the pre-`product-manager` lane set, and use `research/product/productmanager-reboot-brief-001.md` as the bootstrap evidence for the discovery-first `product-manager` lane.
