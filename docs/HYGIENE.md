# Hygiene

## Purpose

Keep the framework clean enough that orchestration quality is not masked by stale files, dead exports, or contradictory docs.

## Hygiene lane

Use the `hygienist` subagent for:

- `npm prune`
- `npx knip`
- interpreting unused-surface results
- turning tool output into a human-reviewable proposal instead of silent deletion

Preferred model: `GPT-5.4-nano`

## Required run shape

1. Run `npm prune`
2. Run `npx knip`
3. Summarize findings in a proposal table with:
   - `Path`
   - `Reason`
   - `Estimated lines removed`
   - `Action`
4. Do not delete anything until a human explicitly approves the proposal

## Repo script

The root repo script for this workflow is:

```powershell
npm run cleanup:check
```

## Current stance

- hygiene is a repeatable framework workflow, not an ad hoc shell habit
- `knip` findings are advisory until reviewed by a human
- doc cleanup and code cleanup should be reported together when they affect the same slice
