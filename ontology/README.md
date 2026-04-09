# Ontology — GrooveGraph domain model

Repo-root **`ontology/`** holds the **canonical, storage-independent** model for Research Workbench knowledge: investigations, evidence, reviewed graph entities and relationships, and optional normalized music subtypes. It is expressed in **TypeQL** for **TypeDB**, the only graph store the product writes to.

## Canonical vs current implementation

| Layer | Role |
|-------|------|
| **This ontology** (`groovegraph-schema.tql`) | Contract for entity types, relation types, and attributes in the knowledge graph. |
| **Application session model** (`product/src/types/research-session.ts`) | Source of truth for **in-process / file-backed** session JSON until you centralize more in TypeDB. |
| **TypeDB (live)** | **Graph persistence** via `product/src/lib/server/typedb-graph-persistence.ts` and `product/.env.example` (`TYPEDB_*`). The workbench applies a subset of types aligned with this folder (`research-session`, `graph-entity`, `graph-relationship`, `session-includes-entity`). |

## What lives here

| File | Role |
|------|------|
| `groovegraph-schema.tql` | **Canonical** TypeQL: product-oriented types (`graph-entity`, `research-session`, …). |
| `README.md` | This file. |
| `TYPEDB_DATABASE_RESET.md` | Operational notes for a **clean TypeDB database** (new DB / wipe + schema). |

**Legacy Neo4j → TypeDB migration** (Aura introspection, aura-prefixed snapshot TypeQL, batch migrator, and related scripts) lives under **`archive/neo4j-branch-only/`** for reference—not used by the active app.

## Scripts still in `ontology/scripts/`

| Script | Role |
|--------|------|
| `lib/typedb-env.mjs` | Shared env parsing for TypeDB (used by one-off test scripts and mirrored conceptually in `product` config). |
| `test-typedb-connection.mjs`, `test-typedb-schema-syntax.mjs` | Optional smoke checks against your TypeDB instance. |

Run from repo root with `node ontology/scripts/<name>.mjs` and `product/.env.local` (or repo `.env.local`) containing `TYPEDB_*`.

## Design stance

- **Phase 1** still favors **weak typing** on `graph-entity` (`provisional-entity-kind` + structured JSON attributes) until normalization earns richer types.
- **Canonical music subtypes** (`artist-entity`, `recording-entity`, …) are optional **TypeDB** specializations for later normalization.

## Source of truth in code (for alignment, not definition)

- Session and candidate shapes: `product/src/types/research-session.ts`
- Graph writer: `product/src/lib/server/typedb-graph-persistence.ts`
- Product expectations: `docs/product/RESEARCH_WORKBENCH_PRD.mdc`

## Conceptual mapping (session model ↔ TypeDB)

| Ontology (TypeDB) | Notes |
|-------------------|--------|
| `research-session` | Key: `session-id` |
| `graph-entity` | Lists often JSON string attributes in TypeQL |
| `session-includes-entity` | Links session ↔ entity; `inclusion-candidate-key` |
| `graph-relationship` | Identity: `rel-session-id` + `rel-relationship-id` |

## Session artifacts not yet synced by default

These exist in the session model and in this ontology as **first-class types**; the workbench sync focuses on entities/relationships/sessions. A fuller rollout can persist:

- `SourceDocument`, `EvidenceSnippet`, `Claim`, `ReviewDecision`, `SessionMessage`, `SessionEvent`, free-form `notes[]`.

## Review and confidence vocabularies

**`review-status`:** `proposed` | `accepted` | `rejected` | `deferred`.

**`confidence-level`:** `low` | `medium` | `high`.

## JSON-shaped attributes

Distinct attribute types per slot satisfy TypeDB’s rule that a type cannot own the same attribute type twice. Values may hold JSON text during migration from weakly typed payloads; **replace with normalized relations** as the TypeDB schema hardens.

## TypeDB alignment checklist

1. **TypeQL version** (TypeDB 2.x vs 3.x): match grammar to your server.
2. **Keys:** tighten linking patterns as needed.
3. **Normalize** JSON attributes into entities/relations where query patterns need structure.

## Research workbench (live sync)

The Next.js app under `product/` syncs accepted (and optionally deferred) graph candidates to **TypeDB** only. Configure `TYPEDB_*` in `product/.env.local` (see `product/.env.example`). See **`TYPEDB_DATABASE_RESET.md`** for provisioning a clean database.
