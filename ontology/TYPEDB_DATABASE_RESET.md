# TypeDB: clean database (operational)

Use this when you want an **empty TypeDB database** with **no legacy experiments**, then apply **canonical + workbench** schema only.

## Steps

1. **Create a new database** in TypeDB Cloud / Console (or delete the old one if your policy allows).
2. **Point the app** at it: set `TYPEDB_CONNECTION_STRING` or `TYPEDB_USERNAME` / `TYPEDB_PASSWORD` / `TYPEDB_ADDRESS` / `TYPEDB_DATABASE` in `product/.env.local`.
3. **First sync** from the Research Workbench (“Sync to graph”) applies the workbench TypeQL subset (`WORKBENCH_TYPEDB3_SCHEMA_LINES` in code) idempotently before writes.
4. Optionally **define** the full canonical model from `groovegraph-schema.tql` in TypeDB Studio if you want every type declared ahead of time (the workbench subset is enough for basic sync).

Re-importing data from Neo4j Aura (batch job) is **not** part of the active repo path; see `archive/neo4j-branch-only/README.md` for archived scripts.

## Notes

- Re-running a full batch migrator into the **same** database without a clean slate can **duplicate** instances—prefer a **new database name** for a fresh load.
- The product does **not** connect to Neo4j at runtime.
