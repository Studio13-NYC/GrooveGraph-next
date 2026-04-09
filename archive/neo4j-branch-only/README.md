# Archived Neo4j → TypeDB migration artifacts

These files supported **Neo4j Aura introspection**, **aura-prefixed TypeQL snapshot generation**, and **batch migration into TypeDB**. They are **not** part of the active `main` product path (the app uses **TypeDB only** via `product/src/lib/server/typedb-graph-persistence.ts`).

- **`ontology/`** — `groovegraph-neo4j-aura-snapshot.tql`, `sources/*.json`, and `scripts/*.mjs` (migrate, generators, `test-insert`).
- **`product/scripts/`** — `introspect-neo4j-schema.mjs`, `verify-neo4j-entities.mjs`.

Archived scripts import `ontology/scripts/lib/typedb-env.mjs` from the live repo. Run them from the **repository root** with `node` (install `neo4j-driver` at repo root if needed: `npm i neo4j-driver`).

Example:

```bash
node archive/neo4j-branch-only/ontology/scripts/neo4j-to-typedb-migrate.mjs --database=mydb
```

The pre–TypeDB app layout is preserved on git branch **`neo4j`** (commit `48c0ca9`).
