# Generalization Audit

## Purpose

This document audits `GrooveGraph-next` against `generalized.md` (the portable blueprint). It identifies what is reusable versus what is GrooveGraph-specific, and proposes bounded cleanup slices for framework extraction or public-example derivation.

The blueprint states: *"the whole system can be copied to another project without carrying product-specific baggage"* (§17).

## Audit Date

- Run: `2026-03-18`
- Reference: `generalized.md` (Generalized Project Blueprint)

---

## 1. Alignment with Blueprint

### 1.1 Core stance

| Blueprint requirement | Repo state | Evidence |
|---|---|---|
| One orchestrator owns decomposition and completion | Aligned | `docs/AGENT_ORCHESTRATION.md`, `.cursor/agents/orchestrator.md` |
| Bounded delegation with explicit packets | Aligned | `docs/CONTEXT_PACKETS.md`, packet template and example |
| One source of truth per concern | Aligned | `docs/INDEX.md`, precedence order in canonical docs |
| Evidence over vibes | Aligned | `research/`, `docs/WORKFLOW_VALIDATION.md`, headcount runs |
| Proposal-first cleanup | Aligned | `docs/HYGIENE.md`, hygienist lane, `cleanup:check` script |
| Traceability without log spam | Aligned | `docs/OBSERVABILITY.md`, `.telemetry/` design |

### 1.2 Repo shape

| Blueprint recommendation | Repo state | Evidence |
|---|---|---|
| `AGENTS.md` | Present | Root `AGENTS.md` |
| `generalized.md` | Present | Root (blueprint) |
| `.cursor/agents/` | Present | Orchestrator, explorer, implementer, reviewer, tester, hygienist, graphic-artist, composer-meta, infrastructure-deployment |
| `.cursor/rules/` | Present | subagent-routing, context-passing, forthright-guidance, etc. |
| `.cursor/skills/` | Present | agent-orchestrator, context-packet-builder |
| `docs/` | Present | Canonical policy docs per INDEX |
| `framework/` | Present | `@groovegraph-next/framework` |
| `product/` | Present | `@groovegraph-next/product` |
| `prototypes/` | Present | With README |
| `research/` | Present | headcount, hygiene artifacts |

### 1.3 Hygiene workflow

| Blueprint requirement | Repo state | Evidence |
|---|---|---|
| `npm prune` | Implemented | `npm run cleanup:check` |
| `npx knip` | Implemented | `npm run cleanup:check` |
| `.gitignore` audit for tool surfaces | Implemented | `.telemetry/`, `.firecrawl/` in `.gitignore`; `docs/HYGIENE.md` requires audit |
| Proposal table format | Implemented | `docs/HYGIENE.md` §Required run shape |
| No silent deletion | Implemented | Human approval required |

### 1.4 Observability and usage

| Blueprint requirement | Repo state | Evidence |
|---|---|---|
| `.telemetry/slice-costs.jsonl` | Designed | `docs/USAGE_ACCOUNTING.md`, `.telemetry/` in `.gitignore` |
| Structured identifiers | Documented | `docs/OBSERVABILITY.md` |
| Cost tiers (exact/estimated/unknown) | Documented | `docs/USAGE_ACCOUNTING.md` |

---

## 2. GrooveGraph-Specific vs Reusable

### 2.1 Expected product-specific (intentionally GrooveGraph)

These are correct for this repo and should remain. When forking, they are the primary substitution targets.

| Location | Content | Fork action |
|---|---|---|
| `package.json` | `name: "groovegraph-next"` | Replace with fork project name |
| `framework/package.json` | `@groovegraph-next/framework` | Replace with fork package scope |
| `product/package.json` | `@groovegraph-next/product` | Replace with fork package scope |
| `docs/AZURE_BASELINE.md` | `rg-groovegraph`, `swa-groovegraph`, `as-groovegraph-api`, `appi-groovegraph`, etc. | Replace with fork Azure resource names |
| `scripts/deploy-*.ps1` | Hardcoded `rg-groovegraph`, `as-groovegraph-api`, `swa-groovegraph` | Replace with fork resource names |
| `product/swa-smoke/index.html` | Fetch from `as-groovegraph-api.azurewebsites.net` | Replace with fork API URL |
| `product/app/layout.tsx` | "GrooveGraph Next Smoke Test" | Replace with fork title |
| `docs/OBSERVABILITY.md` | `appi-groovegraph`, GrooveGraph domains | Replace with fork telemetry resource |
| `research/headcount/*.md` | References to GrooveGraph Azure resources | Historical; fork produces new evidence |

### 2.2 Framework surfaces with product branding

Per the blueprint, the framework layer should avoid product-domain specifics where possible. These files use "GrooveGraph Next" in role descriptions and could be generalized for a reusable template.

| Location | Current wording | Recommendation |
|---|---|---|
| `AGENTS.md` | "GrooveGraph Next Operating Contract", "GrooveGraph era" | Acceptable for this repo; fork replaces |
| `docs/AGENT_ORCHESTRATION.md` | "GrooveGraph Next" in purpose | Same |
| `docs/MODEL_ROUTING.md` | "GrooveGraph Next" in canonical source | Same |
| `docs/CONTEXT_PACKETS.md` | Example: "legacy GrooveGraph repo", "GrooveGraph Next repo" | Add templating note for forks |
| `.cursor/agents/*.md` | "for GrooveGraph Next" in descriptions | Same; fork does find-replace |
| `.cursor/rules/subagent-routing.mdc` | "GrooveGraph Next work" | Same |

### 2.3 Blueprint gaps

| Item | Status |
|---|---|
| `generalized.md` not listed in `docs/INDEX.md` | Resolved: added to INDEX under Root references |
| `.cursor/rules/infrastructure-deployment.mdc` references `rg-groovegraph` | Expected; infrastructure lane is product-scoped |

---

## 3. Hygiene Evidence (This Run)

| Check | Result |
|---|---|
| `npm run cleanup:check` | Pass (2026-03-18) |
| `npm prune` | 65 packages audited, 0 vulnerabilities |
| `npx knip` | 0 unused-surface findings |
| `.gitignore` coverage | `.telemetry/`, `.firecrawl/` present; matches `docs/HYGIENE.md` known targets |

---

## 4. Highest-Value Next Cleanup Slice

**Proposed slice:** Add the portable blueprint (`generalized.md`) to the documentation index and record hygiene evidence for traceability.

**Rationale:**

- `docs/INDEX.md` is the canonical doc map but omits `generalized.md`, which is the source blueprint for the whole system.
- Explicitly linking the blueprint improves discoverability and clarifies that `AGENTS.md` is the project-specific instantiation of `generalized.md`.
- Appending hygiene evidence to `research/` keeps the audit traceable per the blueprint's evidence contract.

**Scope:**

- Update `docs/INDEX.md` to include `generalized.md` under root references.
- Add a dated section to `research/hygiene/HYGIENE_LOG.md` with this run's evidence (log consolidated 2026-03-21).

---

## 5. Fork Checklist (Public Example)

When deriving `Studio13-NYC/multiagent-startup-cursor` or another project:

1. Replace package names and scopes (`groovegraph-next` → project name).
2. Replace Azure resource names in scripts, `AZURE_BASELINE.md`, and OBSERVABILITY.md.
3. Replace product titles and API URLs in `product/`.
4. Find-replace "GrooveGraph Next" in agent and rule descriptions if desired.
5. Update `CONTEXT_PACKETS.md` example `reference_boundary` if using generic placeholders.
6. Run `npm run cleanup:check` and fix any new findings.
