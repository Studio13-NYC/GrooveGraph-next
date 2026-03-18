# Hygiene

## Purpose

Keep the framework clean enough that orchestration quality is not masked by stale files, dead exports, or contradictory docs.

## Hygiene lane

Use the `hygienist` subagent for:

- `npm prune`
- `npx knip`
- local tool-cache and scratch-surface review
- interpreting unused-surface results
- turning tool output into a human-reviewable proposal instead of silent deletion

Preferred model: `GPT-5.4-nano`

## Required run shape

1. Run `npm prune`
2. Run `npx knip`
3. Review local tool/cache surfaces and ensure non-source artifacts are ignored or proposed for removal
4. Summarize findings in a proposal table with:
   - `Path`
   - `Reason`
   - `Estimated lines removed`
   - `Action`
5. Do not delete anything until a human explicitly approves the proposal

## Local tool surfaces

The hygiene lane should proactively handle tool-generated local state even when it is not currently present in the tree.

Examples:

- `.firecrawl/`
- other plugin caches, scratch directories, or machine-local artifacts that do not belong in source control

Preferred treatment:

- ignore them in `.gitignore` when they are clearly machine-local
- remove them only with human approval if they were accidentally committed

## Repo script

The root repo script for this workflow is:

```powershell
npm run cleanup:check
```

## Current stance

- hygiene is a repeatable framework workflow, not an ad hoc shell habit
- `knip` findings are advisory until reviewed by a human
- machine-local tool artifacts should be ignored before they become hygiene debt
- doc cleanup and code cleanup should be reported together when they affect the same slice
