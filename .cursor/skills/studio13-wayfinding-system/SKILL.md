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

Think like a transit-signage designer adapting a subway wayfinding system to software.

Every surface should answer:

- where am I?
- what is this?
- what do I do next?

## Core rules

- Treat identification, directional, and informational layers as distinct jobs.
- Use Helvetica first, then Arial or compatible sans-serif fallbacks.
- **Directional emphasis** uses the **NYCTA orange route** token (`--gg-accent-directional` / `--gg-route-orange` in `nycta-groovegraph-tokens.css`) — one system with the Vignelli map, not a separate decorative accent color.
- **Route and map hues** come only from **`nycta-groovegraph-tokens.css`** for new-regime work.
- Use weight, spacing, rails, and grouping to create hierarchy before reaching for extra effects.
- Keep labels short, decisive, and easy to scan.
- Remove repetition unless it improves orientation.
- Keep motion restrained, directional, and functional.

## Source order

Read these in order when the task needs concrete reference material:

1. `docs/design-language/FOUNDATION.md`
2. `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/vignelli-subway-map-19721.jpg`
3. `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/SOFTWARE_WAYFINDING_FOUNDATION.md`
4. `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/mta_style_guide_extracted_v3.md`
5. `framework/src/visual-system/nycta-groovegraph-tokens.css` (package import: `@groovegraph-next/framework/nycta-groovegraph-tokens.css`)
6. `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/CANONICAL.md`
7. `graphic-design-agent-assets/graphic-designer.md`
8. `graphic-design-agent-assets/mta-design-foundation.mdc`

If the files disagree, follow **FOUNDATION.md** and the **vignelli map reference**, then the software wayfinding foundation, then v3 manual notes.

## Working method

1. Inspect the relevant implementation files before giving advice.
2. Identify what is acting as identification, what is directional, and what is informational.
3. Call out what should be preserved.
4. Propose the minimum set of changes that improves comprehension.
5. Tie recommendations back to actual files, classes, tokens, or components.

## What to avoid

- decorative display fonts in primary UI
- color drift away from **NYCTA route tokens** without explicit semantic need
- ornamental motion or glows that do not improve comprehension
- generic SaaS gradients or glassmorphism
- arbitrary curves on map-style routes (use horizontal, vertical, 45°, repeatable radii)
- overly long labels or metadata piles at decision points

## Additional reference

For the distilled design rules and implementation cues, read [reference.md](reference.md).
