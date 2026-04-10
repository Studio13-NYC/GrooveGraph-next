# Codebase Search

## Purpose
Locate the real implementation points, not just likely filenames.

## Inputs
- feature or bug description
- known symbols, routes, components, or queries

## Process
1. search for identifiers, route names, and UI labels
2. trace imports, exports, and call sites
3. identify source of truth modules
4. map affected files by ownership layer

## Outputs
- candidate files
- source-of-truth modules
- likely edit points
