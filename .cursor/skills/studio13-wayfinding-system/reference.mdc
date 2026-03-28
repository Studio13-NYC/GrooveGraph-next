# Studio13 Wayfinding Reference

This reference distills the highest-signal rules from `graphic-design-agent-assets/` into software-facing guidance for GrooveGraph Next.

## Design translation

The transit-signage model maps to software like this:

- identification: titles, object names, section headers, route labels
- directional: navigation, grouped actions, filters, breadcrumbs, next-step links
- informational: metadata, status, supporting copy, timestamps, explanatory notes

Default ordering:

1. identification first
2. directional next
3. informational last

Show information at the point of decision:

- never before
- never after

## Typography

Use:

- Helvetica first
- Arial second
- compatible sans-serif fallback only when required

Rules:

- avoid decorative display fonts for primary UI
- use uppercase for short labels, markers, and directional cues
- use mixed case for titles, body copy, and longer reading
- rely on weight, spacing, and alignment instead of novelty faces
- keep the type scale limited and consistent

## Color

New-regime **map and route** colors are **not** ad hoc Studio13 oranges — they are the **NYCTA / Vignelli** system:

- Use **`framework/src/visual-system/nycta-groovegraph-tokens.css`** (`--gg-route-*`, `--gg-map-water`, `--gg-map-park`, `--gg-surface-canvas`, `--gg-ink`). **`--gg-map-land`** mirrors the canvas — no warm substrate.
- **Directional emphasis** in UI = **`--gg-accent-directional`** (same as **orange route** on the map).

Usage rules:

- land / water / ink / route families do most of the work on **map-like** surfaces
- extra hues appear only for **coded** meaning (route family, exit, transfer, status)
- do not introduce decorative palette drift

**Note:** `graphic-design-agent-assets/styles.css` is a **legacy dark Studio13 theme** for other contexts — do not treat it as the authoritative palette for NYCTA new-regime GrooveGraph graphics.

## Layout

Layout should feel like a signage system:

- strong alignment
- clear grouping
- visible rails and columns
- measured spacing
- bounded sections
- negative space around decisions

Preferred behavior:

- each section should have one clear role
- each section should answer a specific orientation question
- repeated metadata should be reduced or regrouped

## Map grammar

The NYCTA / Vignelli map language adds another layer beyond signage:

- the route line is a system primitive
- color identifies service families across distance
- bends use controlled, repeatable radii
- shared corridors are parallel bundles, not improvised overlap
- interchanges are explicit and compressed, not decorative

Translate that into software like this:

- use continuous rails or route strips to connect related modules
- use bundled parallel lanes when two workflows share a corridor
- use a small family of repeated corner radii instead of arbitrary curves
- make route continuity legible before relying on labels or helper text
- treat handoff points between search, evidence, and review as interchanges

Concrete rules:

- color should identify durable route or object families, not momentary decoration
- black, white, and neutral canvas (light/dark) should still do most of the structural work
- orange remains the directional accent for current path, emphasis, and next action
- blue should be reserved for links, citations, or other stable reference affordances unless a true route family requires it
- green and red should remain review-state colors, not general surface accents

Route geometry rules:

- define a small stroke scale and reuse it
- define a small bend-radius family and reuse it
- keep parallel-lane spacing fixed through turns when routes share a corridor
- make splits and merges deliberate enough that the eye can track each route
- do not use organic bezier drift when an engineered turn would read more clearly

## Labeling

Labels should be:

- short
- unambiguous
- grouped by intent
- visually distinct from informational copy

If a surface feels crowded, first shorten labels and reduce repeated support text before changing style.

## Motion

Motion should be:

- short
- directional
- functional
- restrained

Good uses:

- entrance sequencing
- focus transitions
- orientation
- clarifying hierarchy

Bad uses:

- bounce-heavy spectacle
- ornamental looping
- glow-first animation
- movement that obscures decisions

## Useful MTA-derived semantics

Apply these structural ideas to UI:

- arrow first, message second, marker last
- directional elements should visibly govern the thing they point to
- route bullets and coded marks should be optically centered and used consistently
- modular sign-plate thinking maps well to bounded cards, headers, and action clusters

## Concrete implementation cues from `s13.css`

The Studio13 example surface reinforces:

- Helvetica Neue / Helvetica / Arial as the operative stack
- black surfaces with restrained orange accents
- uppercase label style with wider tracking
- limited type sizes and clear role separation
- hover and focus states that clarify interaction rather than dramatize it

Use those implementation cues for software-facing surfaces before inventing new stylistic rules.
