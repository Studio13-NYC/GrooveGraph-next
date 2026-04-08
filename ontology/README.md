# Ontology — GrooveGraph domain model

Repo-root **`ontology/`** holds the **canonical, storage-independent** model for Research Workbench knowledge: investigations, evidence, reviewed graph entities and relationships, and optional normalized music subtypes. It is expressed in **TypeQL** because **TypeDB is the planned graph store**; nothing here should be read as “defined by Neo4j.”

## Canonical vs current implementation

| Layer | Role |
|-------|------|
| **This ontology** (`groovegraph-schema.tql`) | Contract for what exists in the **knowledge graph** from a product and migration perspective: entity types, relation types, attributes. **Neo4j is not authoritative.** |
| **Application session model** (`research-session.ts`) | Source of truth for **in-process / file-backed** session JSON until you centralize more in a database. |
| **Neo4j (today)** | **Interim persistence** for a slice of accepted graph candidates (`neo4j-graph-persistence.ts`). Treat it as a **legacy adapter** that maps onto this ontology for export and cutover. |
| **TypeDB (target)** | **Primary graph** implied by this folder: load schema here, implement writers/readers against TypeQL, retire Neo4j when parity and migration are done. |

Planning a Neo4j → TypeDB move means: **freeze conceptual types here**, implement a **TypeDB writer** (and optionally a **one-off or incremental migrator** from Neo4j that maps labels/properties/rel-types into these types), then drop Neo4j—not the other way around.

## What lives here

| File | Role |
|------|------|
| `groovegraph-schema.tql` | **Canonical** TypeQL: product-oriented types (`graph-entity`, `research-session`, …). Storage-agnostic naming. |
| `groovegraph-neo4j-aura-snapshot.tql` | **Generated** TypeQL from a live Aura introspection: one entity type per Neo4j label, one relation type per relationship type, attributes from sampled property keys (`aura-*` prefix). Use for **migration and gap analysis**, not as the long-term canonical names. |
| `sources/neo4j-introspection.json` | **Machine snapshot** from the database (labels, rel types, counts, property keys + inferred value kinds). Regenerate before re-running the generator. |
| `scripts/generate-typeql-from-introspection.mjs` | Builds `groovegraph-neo4j-aura-snapshot.tql` from the JSON. |
| `README.md` | This file. |

### Refresh Aura → JSON → TypeQL

From repo root (uses root `.env.local` for Aura):

```bash
cd research/tools/openai-research-workspace
node --env-file="../../../.env.local" scripts/introspect-neo4j-schema.mjs
cd ../../..
node ontology/scripts/generate-typeql-from-introspection.mjs
```

Or, if `research/tools/openai-research-workspace/.env.local` holds Neo4j vars: `npm run introspect-neo4j -w @groovegraph-next/openai-research-workspace` then `node ontology/scripts/generate-typeql-from-introspection.mjs` from the repo root.

Root shortcuts: `npm run ontology:introspect` and `npm run ontology:generate`.

### Neo4j Aura → TypeDB Cloud (read-only from Neo4j)

1. Refresh introspection + TypeDB 3 schema lines (if your Aura graph changed):

   `npm run ontology:introspect` → `npm run ontology:generate` → `node ontology/scripts/generate-typedb3-schema-lines.mjs`

2. Push into TypeDB (**never deletes** Neo4j or TypeDB; only creates the target DB if missing, then inserts):

   `npm run ontology:migrate`

   Optional: `node ontology/scripts/neo4j-to-typedb-migrate.mjs --database=other-db` to target another database name. Re-running a full load into the **same** database duplicates data—use a new database name in TypeDB Console for a clean second import.

3. **If the relationship phase stops mid-way** (network blip, laptop sleep, etc.), resume without re-importing nodes:

   `node ontology/scripts/neo4j-to-typedb-migrate.mjs --rels-only --skip-schema --rel-offset=19800`

   Set `--rel-offset=` to the last **“rels processed”** count you saw (it skips that many rows from Neo4j’s relationship stream in order). Nodes must already be in TypeDB with `aura-migration-neo4j-element-id`.

## Design stance

- **Phase 1** still favors **weak typing** on `graph-entity` (`provisional-entity-kind` + structured JSON attributes) until normalization earns richer types.
- **Canonical music subtypes** (`artist-entity`, `recording-entity`, …) are optional **TypeDB** specializations for later normalization, independent of whether Neo4j ever used separate labels.

## Source of truth in code (for alignment, not definition)

- Session and candidate shapes: `research/tools/openai-research-workspace/src/types/research-session.ts`
- Current graph **adapter** (Neo4j): `research/tools/openai-research-workspace/src/lib/server/neo4j-graph-persistence.ts`
- Product expectations: `docs/product/RESEARCH_WORKBENCH_PRD.mdc`, `research/product/productmanager-reboot-brief-001.md`

## Conceptual mapping: ontology ↔ Neo4j adapter (migration aid)

Use this table **only** when reading existing Aura/Browser data or building a migrator. The **left column is canonical**.

| Ontology (TypeDB) | Neo4j today (adapter) | Notes |
|-------------------|------------------------|--------|
| `research-session` | node label `ResearchSession` | Key: `session-id` ↔ `id` |
| `graph-entity` | node label `Entity` | Properties align by name (camelCase in Neo4j ↔ snake-ish attribute types in TypeQL); lists often JSON strings in TypeQL |
| `session-includes-entity` | rel type `SESSION_INCLUDES_ENTITY` | `inclusion-candidate-key` ↔ `candidateKey` |
| `graph-relationship` | rel type `GRAPH_REL` | Identity: `rel-session-id` + `rel-relationship-id` ↔ `sessionId` + `relationshipId` |

Neo4j merge rules (candidate keys, external ids, `nameNorm` + kind) are **implementation details of the adapter**, not part of the ontology. TypeDB should use **keys and constraints** you define when you implement the target schema.

## Session artifacts not in the Neo4j adapter

These exist in the session model and in this ontology as **first-class types**; the current Neo4j sync does **not** write them. A full TypeDB rollout can persist them without going through Neo4j:

- `SourceDocument`, `EvidenceSnippet`, `Claim`, `ReviewDecision`, `SessionMessage`, `SessionEvent`, free-form `notes[]` (notes can be added to TypeQL when you model them).

## Review and confidence vocabularies

**`review-status`:** `proposed` | `accepted` | `rejected` | `deferred`.

**`confidence-level`:** `low` | `medium` | `high`.

## JSON-shaped attributes

Distinct attribute types per slot satisfy TypeDB’s rule that a type cannot own the same attribute type twice. Values may hold JSON text during migration from weakly typed session/Neo4j payloads; **replace with normalized relations** as the TypeDB schema hardens.

## TypeDB alignment checklist

1. **TypeQL version** (TypeDB 2.x vs 3.x): translate `sub entity` / `sub attribute` style if your server requires the newer comma form.
2. **Keys:** replace string `session-id` duplication on children with relations-only linking if you prefer a stricter graph.
3. **Normalize** JSON attributes into entities/relations where query patterns need structure.
4. **Migration:** define insert/match templates from Neo4j export → TypeDB `insert` (or batch loader), validate counts and spot-check `graph-relationship` and `session-includes-entity`, then switch the app to TypeDB and remove the Neo4j adapter.

## Research workbench (live sync)

The Next.js app under `research/tools/openai-research-workspace` syncs accepted (and optionally deferred) graph candidates through a small **graph persistence** port. Set `GRAPH_PERSISTENCE_BACKEND=neo4j` (default) or `typedb`, plus the matching env vars in that package’s `.env.example`. The TypeDB adapter applies a workbench subset of types consistent with `groovegraph-schema.tql` (`research-session`, `graph-entity`, `graph-relationship`, `session-includes-entity`) alongside any existing migrated Aura schema in the same database.
