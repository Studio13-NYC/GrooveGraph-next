# One index to rule the refs

**Date:** 2026-03-21  
**Lanes:** `composer-meta`, `hygienist` (proposal-first, then executed)

GrooveGraph Next had grown a polite kind of clutter: nineteen tiny files under `refs/`, each doing the same job—remind the model where the real document lives. They were honest aliases, but they multiplied every time we split a concern. The hygienist lane was invented partly to stop silent deletion; this pass was the other half of that story: **merge first, delete only when the story is preserved**.

## What we consolidated

**Refs.** `refs/INDEX.md` is now the single chat-friendly map from topic to canonical path, including `.cursor/rules` mirrors. The per-topic stub files are gone. If your muscle memory said `@refs/agents.md`, aim at `@refs/INDEX.md` and the agents row instead—one update surface, fewer drift vectors.

**Headcount evidence.** Serial runs for App Service smoke and SWA smoke were captured in markdown siblings under the old `research/headcount/` tree. That folder was later removed on consolidation; the same narratives live in **git history** (see `docs/HEADCOUNT.mdc` and `docs/WORKFLOW_VALIDATION.mdc` path notes).

**Hygiene runs.** Historical hygiene logs lived under `research/hygiene/`; new generalization hygiene evidence should be appended to **`docs/GENERALIZATION_AUDIT.mdc`** §3 and/or **`docs/DECISION_LOG.mdc`** per `docs/HYGIENE.mdc`.

**Research workspace validation.** Bootstrap pass and first Prince end-to-end session are documented together in `docs/research-workbench-validation.md` (Part A / Part B). `docs/WORKFLOW_VALIDATION.mdc` and `product/README.md` point at the canonical app and validation record.

**Product surface.** `product/README.md` describes the canonical workbench app, env, graph sync, and deploy pointers. Static HTML under `product/public/` (e.g. design-system board) supports Figma capture workflows per `docs/design-language/FIGMA_MCP.mdc`.

## Why it matters

Documentation hygiene is not aesthetics. It is **latency and trust**: fewer places to edit, less chance that an alias rots while the canonical doc moves. The hygienist’s table format still applies—this work was reviewed against a removal proposal before anything hit the tree.

If you fork the repo, start from `docs/INDEX.mdc` and `refs/INDEX.md`; they are the two maps. Everything else is supposed to be boring after that.
