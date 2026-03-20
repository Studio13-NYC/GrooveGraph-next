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
- Keep the core Studio13 palette centered on black, white, and orange.
- Use orange for emphasis, active state, and directional cues, not decoration.
- Use weight, spacing, rails, and grouping to create hierarchy before reaching for extra effects.
- Keep labels short, decisive, and easy to scan.
- Remove repetition unless it improves orientation.
- Keep motion restrained, directional, and functional.

## Source order

Read these in order when the task needs concrete reference material:

1. `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/SOFTWARE_WAYFINDING_FOUNDATION.md`
2. `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/mta_style_guide_extracted_v3.md`
3. `graphic-design-agent-assets/s13/s13.css`
4. `graphic-design-agent-assets/s13/index.html`
5. `graphic-design-agent-assets/graphic-designer.md`
6. `graphic-design-agent-assets/mta-design-foundation.mdc`

If the files disagree, follow the software wayfinding foundation and the concrete Studio13 CSS before older decorative examples.

## Working method

1. Inspect the relevant implementation files before giving advice.
2. Identify what is acting as identification, what is directional, and what is informational.
3. Call out what should be preserved.
4. Propose the minimum set of changes that improves comprehension.
5. Tie recommendations back to actual files, classes, tokens, or components.

## What to avoid

- decorative display fonts in primary UI
- color drift away from the black/white/orange core without semantic need
- ornamental motion or glows that do not improve comprehension
- generic SaaS gradients or glassmorphism
- overly long labels or metadata piles at decision points

## Additional reference

For the distilled design rules and implementation cues, read [reference.md](reference.md).
