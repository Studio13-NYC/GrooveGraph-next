# ProductManager Reboot Brief 001

## Run

- Lane: `product-manager`
- Date: `2026-03-18`
- Scope: discovery-first reboot framing from historical product context and in-repo goals
- Source boundary: canonical docs and this repository only; writable research artifact under `research/product/`

## Context packet

```yaml
goal: >
  Produce the first ProductManager-style discovery-first reboot brief using
  canonical docs and this repository as the only source boundary.
why_now: >
  GrooveGraph Next is adding a canonical product-manager lane and needs a
  durable research artifact to define the product path.
tracking:
  session_id: productmanager-bootstrap
  chunk_id: reboot-brief-001
  measurement_mode: unknown
scope:
  writable:
    - research/product/
  readable:
    - docs/
    - AGENTS.mdc
    - docs/product/
constraints:
  - Do not preserve the old ontology blindly.
  - Keep phase 1 discovery-first.
  - Separate starter types from provisional graph structures.
  - Recommend delayed normalization only when evidence justifies it.
expected_output:
  format: brief
  must_include:
    - primary user framing
    - hero workflow
    - search -> collect -> persist -> revisit loop
    - minimal starter type set
    - weakly typed phase-1 surfaces
    - normalization triggers
    - legacy keep/reject/defer guidance
    - recommended first bounded product slice
```

## Primary user framing

The reboot should optimize first for a discovery curator: someone starting with an incomplete music question, a seed entity, or a vague hypothesis and trying to turn scattered evidence into a reusable graph. This is closer to a researcher or product operator than a canonical catalog maintainer.

## Core product decision

Reboot GrooveGraph as a discovery-first evidence system, not as an ontology-first music database.

The strongest legacy ideas are:

- graph-shaped discovery and traversal
- provenance on collected evidence
- review-before-write workflows for uncertain material
- broad multi-source enrichment

The weakest legacy assumption is the need to lock the product into a large canonical ontology before enough evidence exists.

## Hero workflow

1. Start with a seed: artist, track, album, label, studio, or plain-language question.
2. Search broadly across sources and web results.
3. Collect raw evidence, candidate entities, candidate relationships, and citations aggressively.
4. Persist everything into a session-level evidence graph.
5. Revisit the session to compare, reject, merge, and normalize only the stable patterns.
6. Re-run discovery from the enriched session.

## Search -> collect -> persist -> revisit

- Search: broad fan-out from a seed, not narrow triplet authoring.
- Collect: store snippets, URLs, extracted mentions, candidate nodes, candidate edges, and confidence.
- Persist: keep append-only session storage with provenance; preserve uncertainty in phase 1.
- Revisit: human or agent review turns repeated, high-confidence patterns into normalized graph facts.

## Minimal starter type set

Split the starter set into canonical types and operational evidence types.

Canonical starter types:

- `Artist`
- `Recording`
- `Release`
- `Person`
- `Label`
- `StudioOrPlace`

Operational evidence types:

- `InvestigationSession`
- `SourceDocument`
- `EvidenceSnippet`
- `EntityCandidate`
- `RelationshipCandidate`
- `Claim`
- `ReviewDecision`

Everything else from the old ontology should begin as optional metadata or candidate labels, not required schema.

## Weakly typed phase-1 surfaces

Phase 1 should stay flexible on purpose:

- `EntityCandidate` with `kind`, `displayName`, aliases, external IDs, and JSON attributes
- `RelationshipCandidate` with `from`, `to`, `verb`, confidence, and evidence refs
- `Claim` as a normalized textual assertion linked to evidence
- `SourceDocument` and `EvidenceSnippet` as first-class persisted records
- session-scoped states such as `proposed`, `reviewed`, `accepted`, and `rejected`

## Normalization triggers

Only harden the ontology when one of these patterns repeats:

- the same entity shape appears across multiple sessions or sources
- a relationship repeats with independent evidence
- reviewers repeatedly approve the same structure
- the query UX keeps needing the same filter or operator
- a candidate type becomes operationally necessary for ranking, dedupe, or display

## Legacy keep, reject, defer

| Legacy element | Decision | Why |
|---|---|---|
| Provenance on every enrichment write | Keep | This is the strongest durable product behavior |
| Review-before-apply workflow | Keep | It matches discovery-first uncertainty |
| Graph as a result/exploration surface | Keep | It is still the hero output |
| Broad multi-source enrichment | Keep | Core to the product promise |
| Giant upfront ontology | Reject | Too rigid for phase 1 discovery |
| Triplet-first authoring | Reject | Powerful but brittle and expert-only |
| Neo4j-first canonical persistence | Reject for phase 1 | Prematurely hardens structure before repeated evidence exists |
| Dense graph as the primary input UI | Reject | Good for output, weak for onboarding |
| Full query builder | Defer | Valuable later, not needed for the first proof |
| Advanced graph visualization polish | Defer | Not on the critical path |
| Continuous auto-enrichment | Defer | Review loop matters more first |
| Fine-grained music subtypes | Defer | Too specific before evidence volume justifies them |

## Recommended first bounded product slice

Build one narrow but convincing slice: artist-seed discovery session.

- input: one artist name or URL
- system searches broadly and collects candidate releases, collaborators, labels, studios, and supporting evidence
- user reviews a staged evidence graph
- accepted items become the first normalized subgraph for that artist
- user can revisit and continue the investigation later

Why this slice:

- artist flows are the clearest legacy strength
- it demonstrates the full loop without requiring the full ontology
- it creates a reusable template for labels, tracks, studios, and related entities later

## Cost summary

These are rough product-planning notes, not billing figures.

```text
cost_summary:
  measurement_mode: unknown
  notes: Host runtime does not expose exact usage for this lane bootstrap artifact.
```

## Judgment

GrooveGraph should reboot as an evidence-first discovery workspace that happens to produce graphs, not as a predefined graph schema that users must feed correctly. Keep provenance, review, and graph exploration; reject ontology rigidity and triplet-centric input; ship an artist-seed investigation slice first.
