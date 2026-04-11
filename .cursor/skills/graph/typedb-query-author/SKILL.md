# TypeDB Query Author

## Purpose
Write or refine TypeDB 3 TypeQL queries that are readable, type-correct, and safe to run against GrooveGraph Next’s database.

## Inputs
- Retrieval objective (read vs write vs schema change)
- Relevant types from **`docs/DB-Schema-Export.typeql`** (or a fresh `npm run dump:typedb-schema` export)
- Constraints and expected answer shape (`conceptRows` vs documents vs `ok`)

## Process
1. State intent: **read** (`match` + optional `reduce` / `select`) vs **data write** vs **schema** (`define` / `undefine` — only when explicitly in scope).
2. Resolve connection mentally: same env as **`product/src/lib/server/config.ts`** / **`scripts/lib/typedb-env.mjs`** — `product/.env.local` (or repo `.env.local` fallbacks) **or** injected **`TYPEDB_*`** on **`process.env`** (e.g. Cursor Cloud secrets); use **read** `oneShotQuery` or an explicit read transaction for inventory-style work.
3. Map intent to **entities**, **relations** (`links` / relation shorthand), and **attributes** (`has`). Use **`isa!`** for leaf entity types when subtypes would pollute the result.
4. Write the smallest pipeline that answers the question; prefer explicit role names when the relation is fixed, or `links ($e)` when any role from `$e` to `$r` counts ([links statement](https://typedb.com/docs/typeql-reference/statements/links/)).
5. Check **multiplicity**: a `match` can return duplicate rows per instance if the pattern fans out (e.g. multiple `has` bindings) — adjust with `reduce`, `select`, or narrower patterns before counting.
6. For interpolated strings, mirror **`escapeTypeqlString`** in **`product/src/lib/server/graph-persistence/helpers.ts`** (never paste raw user text into TypeQL).
7. Note how **`product/src/lib/server/typedb-graph-persistence.ts`** maps **`conceptRows`** (`Concept` `kind`: `entity` | `relation` | `attribute` | `value`) into app types.

## Outputs
- Query draft (TypeQL) and transaction type (`read` / `write` / `schema`)
- Schema assumptions (types, keys, cardinality)
- Result-shaping notes (which variables to read, aggregation pitfalls)

## Repo references
- **`product/src/lib/server/typedb-graph-persistence.ts`** — `openReadTx` / `openWriteTx` timeouts, `runInTx`, examples
- **`.cursor/rules/engineering/typedb-connection-and-typeql.mdc`** — connection, transactions, agent guardrails
- **`node scripts/typedb-entity-relation-inventory.mjs`** — example read queries per leaf entity type
