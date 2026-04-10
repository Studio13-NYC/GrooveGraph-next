---
name: Neo4j branch + TypeDB-only main
overview: Archive pre-TypeDB app on branch neo4j; on main, TypeDB-only product, simplified graph status (Connected/Disconnected, 1 min poll, no recheck); new empty TypeDB + Aura re-import where the migrator MUST persist canonical prefix-free type and attribute names (per groovegraph-schema); Neo4j only as offline migration source; remove dual-backend factory from product.
todos:
  - id: branch-neo4j
    content: Create branch neo4j at 48c0ca9 (3778eb0^); push if needed; note old layout vs main
    status: pending
  - id: graph-status-ui
    content: Masthead shows only Connected or Disconnected; remove Recheck; poll every 60s; simplify API payload if useful
    status: pending
  - id: typedb-only-product
    content: Remove factory split, NEO4J_*, GRAPH_PERSISTENCE_BACKEND, neo4j/sync, Neo4j branch in status probe, neo4j deps and adapters
    status: pending
  - id: ontology-aura-strategy
    content: New empty TypeDB DB; redesign neo4j-to-typedb-migrate + schema pipeline so inserts use only canonical names (no aura-/neo4j- prefixes); apply define from groovegraph (+ workbench subset); document env and runbook
    status: pending
  - id: simplify-typedb-adapter
    content: After import uses only canonical types, remove aura-specific IID/isa! workarounds where safe
    status: pending
---

# Neo4j archive branch + TypeDB-native main

> **Update (2026-04-10):** Repo-root `ontology/` was removed. Live TypeQL snapshot: **`docs/DB-Schema-Export.typeql`** (`npm run dump:typedb-schema`). References to `ontology/` paths below are historical.

## Branch `neo4j` (confirmed)

- **Snapshot:** `48c0ca9` (first parent of `3778eb0`). **Understood:** this is the **older project structure** (pre–sole-Next consolidation). It preserves the Neo4j-era app for reference; it does **not** match current `main` folder layout.

---

## Graph backend status on `main` (product UX)

**Goal:** Treat the graph as TypeDB-only; status is binary for the user.

| Current | Target |
|--------|--------|
| Labels: Graph writes · TypeDB/Neo4j · DB name · Connected/Unreachable/Not configured | **Connected** or **Disconnected** only (no engine name; optional subtle DB name in tooltip only if you still want ops detail) |
| Poll every 45s ([`ResearchWorkbench.tsx`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\components\ResearchWorkbench.tsx) `setInterval(..., 45_000)`) | Poll every **60_000** ms |
| “Recheck” button ([`WorkbenchNextView.tsx`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\components\WorkbenchNextView.tsx)) | **Remove** button; rely on interval + initial mount fetch |

**Implementation notes:**

- Map server state to two user-facing strings, e.g. `reachable === true` → **Connected**; else **Disconnected** (including not configured—still “Disconnected” from the product’s point of view). Optionally keep detailed `message` in `title` for hover/debug only.
- After Neo4j removal, [`graph-backend-status.ts`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\lib\server\graph-backend-status.ts) only probes TypeDB; simplify `GraphBackendStatusPayload` (drop `writeBackend` or hardcode).

---

## Feasibility: “copy clean type, delete prefixed type” + instances

**Primary strategy (current plan):** Avoid this entire class of work by **emitting canonical names during Aura import** (section above). The following remains **fallback** if you ever need to repair a DB that already contains prefixed types.

**What you described** is the right *conceptual* migration shape for a system that does not offer in-place type rename:

1. **Schema:** For each legacy type (e.g. `aura-node-artist`), define a **new** type with the desired name, mirroring supertypes, `owns`, `@key`, and relation roles (`plays` / `relates`).
2. **Data:** For each instance of the old type, **insert** a new instance of the new type with the same attribute values (mapped to **new attribute types** if those were also prefixed), **rewire** all relations to/from the new instance, then **delete** the old instance.
3. **Schema cleanup:** When no instances remain, **undefine** the old types and old attribute types (order matters: dependents first).

**Feasible:** Yes, as a **custom migration job** (TypeQL batches or driver loops), with caveats:

- **Relations:** Every edge touching migrated nodes must be deleted and recreated (or updated if your TypeDB version supports the exact update semantics you need). This is the easy place to corrupt the graph if done partially.
- **Attribute types:** Prefixed attributes (`aura-artist-name`, …) do not automatically move; you either define parallel clean attribute types and copy values, or collapse into fewer canonical attributes—**design decision per field**.
- **Scale:** The generated [`groovegraph-neo4j-aura-snapshot.tql`](d:\Studio13\Lab\Code\GrooveGraph-next\ontology\groovegraph-neo4j-aura-snapshot.tql) encodes **many** entity/relation/attribute types. Automating “copy type” is scriptable from schema introspection or the `.tql` file, but **volume** makes this a multi-day engineering + validation effort, not a quick edit.
- **Workbench overlap:** Migrated Aura nodes and native `graph-entity` / `research-session` may share a database; migration scripts must **not** tear down canonical workbench types. Prefer migrating only the `aura-*` subgraph, or isolate in a **new database** first.
- **Risk:** Long transaction sizes, partial failure, and schema dependency order require **idempotent batches**, checkpoints, and a **dry-run** on a copy of the database.

**Alternative that best matches “as if we started with TypeDB”:**

- **New TypeDB database** (or wipe non-workbench data): apply only [`groovegraph-schema.tql`](d:\Studio13\Lab\Code\GrooveGraph-next\ontology\groovegraph-schema.tql) + the workbench subset you already use; **re-sync** sessions from the app. You **lose** one-off migrated Aura graph data unless you separately ETL only what you need into **canonical** types (often smaller than renaming the entire `aura-*` lattice).

**Recommendation to encode in the plan:** Decide explicitly—**(A)** full in-place rename/migration of `aura-*` types and instances, **(B)** greenfield DB + app re-sync (+ optional targeted ETL into canonical model), or **(C)** keep legacy data in a **separate** TypeDB database for analytics only and never load aura schema into the app’s primary DB.

---

## Chosen data path: clean TypeDB + Aura re-import with **canonical names only**

**Intent:** New **empty** TypeDB database, then a **single** Neo4j Aura → TypeDB load that writes **only** names that belong in the long-term ontology—**no `aura-`, `neo4j-`, or other migration-branding prefixes** on entity types, relation types, or attribute types that appear as the persisted model.

**Acceptance criteria (import output):**

- Entity, relation, and attribute **type identifiers** in TypeDB match [`ontology/groovegraph-schema.tql`](d:\Studio13\Lab\Code\GrooveGraph-next\ontology\groovegraph-schema.tql) (plus the small **workbench** subset the app already defines, e.g. `graph-entity`, `session-includes-entity`—already prefix-free).
- Neo4j labels and property keys are **mapped** into that canonical vocabulary (e.g. label `Artist` → canonical entity type + attributes you have defined; many-to-one or “lump into `graph-entity` + JSON” where the full PERA model is not yet defined—**still no new prefixed type names**).
- **Exception — “functional behind the scenes”:** At most **one neutral trace attribute** if still needed for idempotency or resume (e.g. stable external id), with a **non-branded** name such as `source-element-id` or `migration-source-id` defined in the canonical schema, **not** `aura-migration-neo4j-element-id`. Prefer matching on natural keys if you can drop the trace field entirely.

**Engineering work (required — current script does not meet this bar):**

- Today [`ontology/scripts/neo4j-to-typedb-migrate.mjs`](d:\Studio13\Lab\Code\GrooveGraph-next\ontology\scripts\neo4j-to-typedb-migrate.mjs) emits **`aura-node-*` / `aura-rel-*` / `aura-*` attributes** and uses [`ontology/sources/typedb3-schema-lines.json`](d:\Studio13\Lab\Code\GrooveGraph-next\ontology\sources\typedb3-schema-lines.json) derived from the old snapshot path. That path must be **replaced or heavily reworked** so schema `define` lines and insert TypeQL use **only** types that exist in (or are intentionally added to) `groovegraph-schema.tql`.
- Likely steps: maintain an explicit **label/rel/property → canonical type/attribute** map (config or generated from introspection + human review); regenerate [`ontology/scripts/generate-typedb3-schema-lines.mjs`](d:\Studio13\Lab\Code\GrooveGraph-next\ontology\scripts\generate-typedb3-schema-lines.mjs) output from **canonical** schema, not from [`groovegraph-neo4j-aura-snapshot.tql`](d:\Studio13\Lab\Code\GrooveGraph-next\ontology\groovegraph-neo4j-aura-snapshot.tql); retire or quarantine `generate-typeql-from-introspection.mjs` as the **default** import path.
- **Operational sequence** (after code change): create empty DB → point `TYPEDB_*` → run migrate with `--database=…` and batching as today → verify TypeDB schema has **zero** `aura-` / `neo4j-` type names → workbench sync to same DB.

**In-place rename (earlier section):** Becomes **fallback only** if you must ship before the migrator rewrite; the **preferred** plan is to **never create** prefixed types on the new instance.

---

## End state: “TypeDB from the beginning”

On `main`, converge to:

- Single graph implementation: TypeDB HTTP driver + [`typedb-graph-persistence.ts`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\lib\server\typedb-graph-persistence.ts) (no `getGraphPersistence()` branching).
- No `GRAPH_PERSISTENCE_BACKEND`, no Neo4j driver in `product`, no `neo4j/sync` alias.
- Ontology and docs describe **one** runtime persistence story (TypeDB); Neo4j appears only as an **offline migration source** if you still run Aura import.
- Primary TypeDB database: **one** ontology—canonical schema + data imported from Aura **under those names** + workbench sync; no parallel `aura-*` lattice.
- Graph status: **Connected / Disconnected**, 1-minute polling, no manual recheck button.

---

## Execution order (unchanged in spirit)

1. Branch `neo4j` @ `48c0ca9`.
2. TypeDB-only codepath + remove switching “middleware” (factory + env + dual probe).
3. Graph status UI + 60s poll + payload simplification.
4. **Implement** canonical-name migrator + schema pipeline (see “Engineering work” above); validate on a scratch database.
5. **Ops:** New empty TypeDB DB → run updated import; wire env to the new database.
6. Simplify TypeDB adapter after live DB has no legacy `aura-imported-node` / prefixed types.
