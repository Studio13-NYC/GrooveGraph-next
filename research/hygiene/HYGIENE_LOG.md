# Hygiene log (consolidated)

Single rolling record for bounded `npm run cleanup:check` runs (`npm prune` + `npx knip`). Older files `hygiene-run-001.md` through `003` were merged here.

---

## 2026-03-18 — Run 001

- Run id: `hygiene-run-001`
- Lane: `hygienist`
- Scope: repo-level cleanup workflow bootstrap and bounded hygiene check
- Command: `npm run cleanup:check`

### Outcome

- Status: `pass`
- Final result: `npm prune` and `npx knip` completed successfully with no actionable removal findings

### Notes

- The first attempt exposed a real gap: `knip` was invoked from the repo script surface without being declared in `devDependencies`.
- The framework was corrected by adding `knip` to the root repo and rerunning the hygiene workflow.
- The second run exited successfully and produced no unused-surface findings.

### Proposal table

| Path | Reason | Estimated lines removed | Action |
| --- | --- | ---:| --- |
| No removal recommended | Current evidence shows a clean `npm prune` plus `knip` pass with no unused-surface findings | 0 | Keep as-is and rerun after substantive framework or product changes |

### Judgment

This was a useful hygiene run because it fixed the cleanup workflow itself and then proved the repo is currently clean by the selected tools, rather than merely assuming cleanliness.

---

## 2026-03-18 — Run 002

- Run id: `hygiene-run-002`
- Lane: `hygienist` (orchestrator-driven audit)
- Scope: repo-level hygiene check as part of generalization audit slice
- Command: `npm run cleanup:check`

### Outcome

- Status: `pass`
- `npm prune`: completed, 65 packages audited, 0 vulnerabilities
- `npx knip`: 0 findings

### .gitignore coverage

Per `docs/HYGIENE.md`, known tool surfaces were audited:

| Surface | In .gitignore | Notes |
| --- | --- | --- |
| `.telemetry/` | Yes | Slice-cost JSONL, append-only |
| `.firecrawl/` | Yes | Firecrawl CLI cache |

No missing coverage detected for known local tool surfaces.

### Proposal table

| Path | Reason | Estimated lines removed | Action |
| --- | --- | ---:| --- |
| None | Clean pass; no unused-surface or dependency findings | 0 | Keep as-is |

### Context

This run was executed during the generalization audit (`docs/GENERALIZATION_AUDIT.md`). Hygiene evidence supports the audit's conclusion that the framework surface is clean and ready for bounded generalization work.

---

## 2026-03-19 — Run 003

- Run id: `hygiene-run-003`
- Lane: `hygienist` (orchestrator-driven audit)
- Scope: research workspace end-to-end validation, documentation refresh, and milestone post slice
- Command: `npm run cleanup:check`

### Outcome

- Status: `pass`
- `npm prune`: completed, 68 packages audited, 0 vulnerabilities
- `npx knip`: 0 findings

### .gitignore coverage

Per `docs/HYGIENE.md`, known tool and machine-local surfaces were audited:

| Surface | In .gitignore | Notes |
| --- | --- | --- |
| `.telemetry/` | Yes | Slice-cost JSONL, append-only |
| `.firecrawl/` | Yes | Reserved machine-local web tooling cache |
| `.data/` | Yes | Local research-session persistence for experimental workspaces |

No missing coverage detected for known local tool or research-workspace surfaces.

### Proposal table

| Path | Reason | Estimated lines removed | Action |
| --- | --- | ---:| --- |
| None | Clean pass; narrowed `research-runtime.ts` export surface so hygiene returned to zero findings | 0 | Keep as-is |

### Context

This run was executed after the first true end-to-end OpenAI Research Workspace artist-seed validation. Hygiene evidence confirms that the repo's expanded research-tool surface still passes the documented cleanup workflow and that local research-session artifacts remain ignored rather than becoming source-control debt.
