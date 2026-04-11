# TypeDB Schema Update

## Purpose
Evolve the TypeDB schema with minimal semantic confusion and manageable migration cost.

## Inputs
- current schema
- desired domain change
- affected queries and app mappings

## Process
1. identify the conceptual change
2. compare with committed **`docs/DB-Schema-Export.typeql`**; after applying changes in Studio or migration scripts, refresh with **`npm run dump:typedb-schema`**
3. prefer additive evolution first when possible; avoid **`undefine`** / destructive deletes unless the task explicitly authorizes them
4. separate deprecated and replacement concepts clearly
5. identify affected queries, **`typedb-workbench-schema.ts`** lines, and application mappings
6. note migration sequence (data backfill, dual-write, cutover)

## Outputs
- schema change proposal
- impacted queries
- migration notes
