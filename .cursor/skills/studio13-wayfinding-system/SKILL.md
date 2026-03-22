---
name: studio13-wayfinding-system
description: Studio13 wayfinding and art-direction system for GrooveGraph Next. Use when the work touches visual hierarchy, page composition, typography, interface critique, campaign graphics, signage-inspired UI, or when the `graphic-artist` lane needs concrete MTA/NYCTA-derived rules for web surfaces.
---
# Studio13 Wayfinding System

Use this skill when a visual decision needs to become concrete art direction for GrooveGraph surfaces.

## Outcomes

Return:

- art-direction summary
- hierarchy plan
- typography direction
- color and emphasis rules
- layout and grouping rules
- implementation references when the work maps to HTML, CSS, or component surfaces

## Primary stance

Think like a **standards-manual / environmental graphics** designer: the **1970 NYCTA Graphics Standards Manual** discipline (grid, plates, bands, functional color) adapted to software — **not** a subway-themed product.

Every surface should answer:

- where am I?
- what is this?
- what do I do next?

## Core rules

- Treat identification, directional, and informational layers as distinct jobs.
- Use Helvetica first, then Arial or compatible sans-serif fallbacks.
- **Directional emphasis** uses the **NYCTA orange** token (`--gg-accent-directional` / `--gg-route-orange` in `nycta-groovegraph-tokens.css`) — one system with diagram color families, not a separate decorative accent.
- **Diagram hues** come only from **`nycta-groovegraph-tokens.css`** for new-regime work.
- Use weight, spacing, **grid alignment**, and grouping to create hierarchy before reaching for extra effects.
- Keep labels short, decisive, and easy to scan.
- Remove repetition unless it improves orientation.
- Keep motion restrained, directional, and functional.
- **Avoid transit metaphors** in UI copy (**lines**, **stops**, **interchanges**, **routes** as journey nouns); use **manual** terms — see `docs/design-language/WORKBENCH_VOCAB.md`.

## Source order

Read these in order when the task needs concrete reference material:

1. `docs/design-language/FOUNDATION.md`
2. `docs/design-language/FIGMA_MCP.md` (when Figma is in scope)
3. `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/vignelli-subway-map-19721.jpg` (for **diagram** / map-like visuals)
4. `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/SOFTWARE_WAYFINDING_FOUNDATION.md`
5. `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/mta_style_guide_extracted_v3.md`
6. `framework/src/visual-system/nycta-groovegraph-tokens.css` (package import: `@groovegraph-next/framework/nycta-groovegraph-tokens.css`)
7. `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/CANONICAL.md`
8. `graphic-design-agent-assets/graphic-designer.md`
9. `graphic-design-agent-assets/mta-design-foundation.mdc`

If the files disagree, follow **FOUNDATION.md**, then the **software wayfinding foundation**, then v3 manual notes; use the **vignelli map** for **diagram** geometry only.

## Working method

1. Inspect the relevant implementation files before giving advice.
2. Identify what is acting as identification, what is directional, and what is informational.
3. Call out what should be preserved.
4. Propose the minimum set of changes that improves comprehension.
5. Tie recommendations back to actual files, classes, tokens, or components.

## What to avoid

- decorative display fonts in primary UI
- color drift away from **NYCTA tokens** without explicit semantic need
- ornamental motion or glows that do not improve comprehension
- generic SaaS gradients or glassmorphism
- arbitrary curves on **map-style** route graphics (use horizontal, vertical, 45°, repeatable radii)
- overly long labels or metadata piles at decision points
- **Transit journey metaphors** in default product UI copy

## Additional reference

For the distilled design rules and implementation cues, read [reference.md](reference.md).
