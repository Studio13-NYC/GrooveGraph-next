# TypeDB Query Author

## Purpose
Write or refine TypeDB queries that are readable and semantically correct.

## Inputs
- retrieval objective
- relevant schema types
- constraints and expected shape

## Process
1. confirm **read vs write** intent; use **read** transactions / `oneShotQuery(..., "read")` unless mutating data or schema
2. state the retrieval intent
3. map the intent to entities, relations, and attributes (use `isa!` when direct type matches matter)
4. write the clearest query that satisfies the need
5. verify assumptions about multiplicity and ownership
6. describe output mapping needs

## Outputs
- query draft
- schema assumptions
- result-shaping notes
