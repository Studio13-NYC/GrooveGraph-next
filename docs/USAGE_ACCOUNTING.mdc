# Usage Accounting

## Purpose

Usage accounting is a first-class framework feature in `GrooveGraph Next`.

The goal is to make orchestration cost-conscious at the slice level without turning the framework into a finance system.

- each subagent can return a rough `cost_summary`
- the orchestrator can roll those summaries into a subtotal for the slice
- the orchestrator can compare value against spend instead of guessing

## Canonical stance

Treat usage numbers in three tiers:

- `exact`: usage came from a provider or platform meter
- `estimated`: usage was derived locally from text length, tokenizer approximations, or manual calculation
- `unknown`: the runtime did not expose usable usage data

Never present these numbers as official accounting. This feature is for rough reference only.

## Preferred agent output

Each agent should return a `cost_summary` with its result:

- `measurementMode`
- optional `inputTokens`
- optional `outputTokens`
- optional `totalTokens`
- optional `costUsd`
- optional notes

## Current limitation

For built-in Cursor orchestration, exact token/cost telemetry may not be exposed by the host runtime.

That means:

- the framework can fully support exact accounting for model calls it owns directly
- the framework should fall back to `estimated` or `unknown` when the host does not expose usage

## Framework surface

The reusable implementation lives in:

- `framework/src/telemetry-log.ts`
- `framework/src/usage-accounting.ts`

It provides:

- append-only JSONL persistence for slice summaries
- normalized `cost_summary` handling
- per-slice rollups across agent outputs
- markdown formatting for lightweight reference summaries

## Example agent output

```text
cost_summary:
  measurement_mode: estimated
  input_tokens: 4200
  output_tokens: 600
  total_tokens: 4800
  cost_usd: 0.004200
```

## Example slice rollup

```text
Slice cost summary

- Measurement: estimated
- Tokens: 13842
- Cost: $0.018420
- Agent totals:
- explorer (GPT-5.4-mini) -> 4800 tokens, $0.004200, estimated
- reviewer (GPT-5.4-mini) -> 2600 tokens, $0.002600, estimated
- orchestrator (GPT-5.4) -> 6442 tokens, $0.011620, estimated
```

## Persistence

Persist rough slice summaries as append-only JSONL:

- default directory: `.telemetry/`
- default file: `.telemetry/slice-costs.jsonl`

Recommended shape:

```json
{
  "recordedAt": "2026-03-18T21:00:00.000Z",
  "sliceId": "deploy-smoke-page-001",
  "sessionId": "demo-session",
  "task": "Deploy smoke page revision",
  "orchestratorModel": "gpt-5.4",
  "summary": {
    "measurementMode": "estimated",
    "totalTokens": 13842,
    "costUsd": 0.01842,
    "agentSummaries": []
  }
}
```

This file is intentionally:

- local
- append-only
- rough-reference telemetry
- ignored by git

## Optional packet tracking

If the runtime wants stronger grouping, packets may include optional tracking metadata such as:

- `session_id`
- `chunk_id`
- optional `parent_chunk_id`
- `measurement_mode`

This is useful for aggregation, but it is not required for the lightweight reference model.

## Operational rule

When a task uses subagents:

1. ask each agent for a `cost_summary`
2. accept `exact`, `estimated`, or `unknown`
3. sum the known costs for the slice
4. append the slice summary to `.telemetry/slice-costs.jsonl`
5. report the total as rough reference unless every value is exact
