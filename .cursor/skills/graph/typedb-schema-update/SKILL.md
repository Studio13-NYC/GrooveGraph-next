# TypeDB Schema Update

## Purpose
Evolve the TypeDB schema with minimal semantic confusion and manageable migration cost.

## Inputs
- current schema
- desired domain change
- affected queries and app mappings

## Process
1. identify the conceptual change
2. prefer additive evolution first when possible
3. separate deprecated and replacement concepts clearly
4. identify affected queries and mappings
5. note migration sequence

## Outputs
- schema change proposal
- impacted queries
- migration notes
