# Visual Style Guide

## Default new-regime visual system

The default visual language for future authoritative GrooveGraph Next graphics is a vintage NYCTA-inspired signage and transit-map system associated with Massimo Vignelli and Bob Noorda.

Visual anchor:

- [Standards Manual: NYCTA Graphics Standards Manual Compact Edition](https://standardsmanual.com/products/nyctacompactedition)

This reference matters because it demonstrates what disciplined civic information design looks like: high legibility, route logic, strong typographic hierarchy, limited but vivid color, and visual authority without decorative confusion.

For software-facing translation of this system, use `.cursor/skills/studio13-wayfinding-system/SKILL.md` and its companion `reference.md` as the implementation-facing layer.

Treat the full Vignelli-era NYCTA map as the definitive reference for route geometry, line behavior, color families, bundling, and interchange logic.

## Use this system for

- governance maps
- framework diagrams
- routing charts
- operating model visuals
- future "new regime" campaign graphics

## Core traits

- disciplined grid
- strong typographic hierarchy
- warm off-white paper or signage surfaces
- heavier route strokes
- rounded corners and curves
- bold route colors with restraint
- minimal copy
- navigational clarity over ornament

## Production spec

### Suggested palette

Use these as the default starting values for new-regime graphics:

- paper: `#F2E9D8`
- black: `#111111`
- slate: `#5E6670`
- red route: `#D7332F`
- blue route: `#1B67C9`
- green route: `#11804B`
- orange route: `#E97722`
- magenta route: `#C433A8`
- yellow route: `#F2C230`
- gray route: `#8E8B84`

These may be tuned per asset, but the system should stay recognizably civic and route-based rather than decorative.

### Typography

Preferred direction:

- primary: Helvetica-like neo-grotesk or similarly neutral transit-style sans
- fallback: Arial, system sans, or a clean geometric substitute only when needed

Hierarchy:

- very large bold title
- medium strong subtitle
- compact labels with strong legibility
- minimal body copy

For Studio13-style web and interface surfaces:

- treat titles and object names as identification
- treat actions, breadcrumbs, and section markers as directional
- treat metadata and supporting copy as informational
- keep those three layers visually distinct before adding more ornament

### Layout grammar

- use a clear grid
- leave generous negative space
- prefer route logic over illustration clutter
- use rounded route geometry for new-regime maps
- keep labels orthogonal and legible

### Stroke and node guidance

- route strokes should be bold enough to read at a glance
- station markers should be high-contrast and simple
- corner radii should feel deliberate and repeated across the piece
- avoid thin decorative linework in new-regime assets

### Map grammar

Treat the transit map itself, not just the signage system around it, as a core visual reference.

Rules:

- color names route families or durable system identity, not mood
- the line is a structural actor and should explain the system before labels do
- route geometry should use a small repeatable radius family rather than arbitrary curves
- shared corridors should read as bundled parallel lanes with fixed spacing
- crossings are not automatically transfers; transfer logic should be explicit
- interchanges should feel like controlled compression points, not decorative overlap

Recommended route behavior:

- primary trunks should read first through line weight, continuity, and adjacency
- branches should split cleanly with enough lead-in distance to make the divergence legible
- bends should preserve direction and vector, not become calligraphic
- repeated radii should make the system feel engineered rather than hand-drawn

Suggested stroke scale:

- `1x` hairline for dividers and minor guides
- `2x` route for secondary workflow rails and graph connections
- `3x` trunk for primary paths, active corridors, and dominant graph routes

Suggested radius family:

- `R1` tight turn for compact UI elbows
- `R2` standard route turn for most product and graph bends
- `R3` broad sweep for major route changes or dominant transitions

For software-facing surfaces:

- use route rails and stage strips to connect related modules across a page
- use parallel lanes when two workflows coexist, such as investigation and review
- use interchanges for deliberate handoffs between search, evidence, and graph review

For graph-facing surfaces:

- use edge color for durable relationship families or investigation tracks
- use opacity, badges, or stroke treatment for confidence and state instead of overloading color
- prefer route-aware bundling and branch clarity over force-directed spaghetti
- let hubs behave like interchanges where route families meet

## Avoid

- generic SaaS gradients
- neon AI art direction
- floating-glass dashboard aesthetics
- decorative complexity without meaning

## Motion direction

When a GrooveGraph artifact needs animation or interactive motion, treat motion as part of the visual system rather than an afterthought.

### Core motion traits

- directional rather than decorative
- tied to structure, hierarchy, and sequence
- paced clearly enough to read at a glance
- strong on transforms and opacity before paint-heavy effects

### New-regime motion

Use motion that feels like route logic becoming visible:

- route or diagram strokes drawing into place
- station-like nodes snapping into alignment
- measured staggered typography
- section-by-section story progression
- clean layout transitions instead of chaotic element drift

Recommended GSAP families:

- `DrawSVGPlugin`
- `ScrollTrigger`
- `SplitText`
- `Flip`
- `ScrollToPlugin`

### Old-regime satire motion

If the goal is critique or historical absurdity, motion may become more frantic, but it should still communicate intentionally:

- jitter
- over-busy annotation reveals
- awkward bounce or wiggle used as commentary
- intentionally messy timing to underscore systemic disorder

Recommended GSAP families:

- `ScrambleTextPlugin`
- `RoughEase`
- `CustomWiggle`
- `CustomBounce`
- `Observer`

### Implementation stance

- prefer `gsap` plus `@gsap/react` for React or Next.js motion surfaces
- register plugins explicitly
- centralize shared plugin registration when multiple components use GSAP
- import the smallest plugin set that serves the artifact unless you are building a deliberate motion sandbox
- respect reduced-motion preferences and ensure the artifact still communicates without animation

## Graph data visualization

Treat graph data visualization as a first-class GrooveGraph surface, not a special-effect layer.

Starting reference:

- [Cytoscape](https://cytoscape.org/)

This reference matters because it treats complex networks, attribute mapping, and exploratory analysis as one design problem instead of reducing graph work to decorative node clouds.

### Core graph-viz traits

- investigative clarity over spectacle
- progressive disclosure over hairball-by-default density
- topology plus attributes, not topology alone
- graph plus evidence, not graph in isolation
- visible review state, confidence, and provisional status where relevant

### Default graph view grammar

- use node-link views for relationship exploration
- prefer restrained edge vocabulary
- let labels appear selectively based on focus, hover, or zoom
- pair the graph with side panels for evidence, metadata, and review actions
- use filtering, search, and neighborhood expansion as primary interaction tools

### Node and edge mapping

- use color for durable type or status
- use size only when a metric genuinely matters
- use opacity for confidence or de-emphasis
- use border, badge, or halo for active selection and review state
- use line style only for clearly distinct relationship classes

### GrooveGraph-specific stance

- discovery-first graph surfaces should make provisional structure obvious
- accepted, deferred, and proposed states should not look identical
- provenance should be easy to inspect from the selected node, edge, or companion panel
- a graph should help the user decide what to keep, not merely prove that connections exist

## Legacy satire mode

For retrospective critique of the old regime, switch to a different system:

- manic whiteboard composition
- dry absurdist editorial-cartoon energy
- dense local labels and annotation
- visible tape, notes, arrows, crossed-out naming

Use this for:

- failure diagrams
- old-regime org charts
- workaround satire
- "how we got here" explanatory humor

## Typography direction

- new regime: clean modernist sans, large hierarchy, signage logic
- old regime: whiteboard marker, printed labels, annotation energy

## Color direction

- new regime: route colors on warm neutral ground
- old regime: dry-erase black, red corrections, dull blues, sticky-note yellow

## Template families

Maintain these recurring artifact types:

1. governance map
2. routing chart
3. comparison poster
4. single-panel satire
5. campaign title card

Store examples under `assets/examples/` as the system matures.

## Regime choice rule

Choose the visual regime like this:

- if the artifact is authoritative, directional, or future-facing -> new-regime NYCTA mode
- if the artifact is retrospective, critical, or mocking old complexity -> old-regime satire mode
- do not blend both systems in one asset unless the contrast is the point

## Review checklist

- Does the piece immediately communicate order or disorder, as intended?
- Is the title treatment strong enough?
- Would the composition still work from a distance?
- Are the jokes carried by structure and labels rather than by random novelty?
