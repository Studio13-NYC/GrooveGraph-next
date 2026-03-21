# One index to rule the refs

**Date:** 2026-03-21  
**Lanes:** `composer-meta`, `hygienist` (proposal-first, then executed)

GrooveGraph Next had grown a polite kind of clutter: nineteen tiny files under `refs/`, each doing the same job—remind the model where the real document lives. They were honest aliases, but they multiplied every time we split a concern. The hygienist lane was invented partly to stop silent deletion; this pass was the other half of that story: **merge first, delete only when the story is preserved**.

## What we consolidated

**Refs.** `refs/INDEX.md` is now the single chat-friendly map from topic to canonical path, including `.cursor/rules` mirrors. The per-topic stub files are gone. If your muscle memory said `@refs/agents.md`, aim at `@refs/INDEX.md` and the agents row instead—one update surface, fewer drift vectors.

**Headcount evidence.** Serial runs for App Service smoke and SWA smoke lived in two markdown siblings. They are one file now: `research/headcount/headcount-serial-evidence.md`, with clear Run 001 / Run 002 sections. The older async pack that predated the `hygienist` lane was retired; `headcount-async-launch-pack-002.md` stays canonical and calls out that predecessor explicitly.

**Hygiene runs.** Three short runs with the same skeleton became `research/hygiene/HYGIENE_LOG.md`, dated sections, same proposal tables and judgments. File count drops; the knip story, generalization audit link, and `.data/` gitignore note all remain findable.

**Research workspace validation.** Bootstrap pass and first Prince end-to-end session are documented together in `research/openai-research-workspace-validation.md` (Part A / Part B). `docs/WORKFLOW_VALIDATION.md`, `research/README.md`, and the tool README now point at the single path.

**Product surface.** `product/README.md` now describes the smoke app, the SWA static sibling, and the static styleguides in `public/` instead of deferring everything to a vague future. Static HTML demos that need motion load GSAP from a CDN; the Next smoke bundle stays a small React surface.

## Why it matters

Documentation hygiene is not aesthetics. It is **latency and trust**: fewer places to edit, less chance that an alias rots while the canonical doc moves. The hygienist’s table format still applies—this work was reviewed against a removal proposal before anything hit the tree.

If you fork the repo, start from `docs/INDEX.md` and `refs/INDEX.md`; they are the two maps. Everything else is supposed to be boring after that.
