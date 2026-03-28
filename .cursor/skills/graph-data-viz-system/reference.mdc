# Graph Data Viz Reference

## Cytoscape as the starting model

Cytoscape is a strong starting reference because it frames graph visualization as a combination of:

- complex network visualization
- attribute-aware visual mapping
- analysis and interaction, not just static display

See [Cytoscape](https://cytoscape.org/).

For GrooveGraph Next, the lesson is not "make Cytoscape again." The lesson is to take graph structure seriously enough that visual clarity, attribute mapping, and investigative workflows are designed together.

## Primary design problem

Graph visualization fails when every relationship is shown with equal emphasis at all times.

Design for:

- progressive disclosure
- operator focus
- meaningful filtering
- graph plus evidence

This is especially important for GrooveGraph because early graph structure is provisional and discovery-first. The UI has to show what is known, what is inferred, and what still needs review.

## View patterns

### 1. Exploration graph

Use for open-ended browsing:

- force or constrained-force layout
- neighborhood reveal from a selected node
- confidence and source filters
- labels on focus, hover, or zoom threshold

### 2. Entity detail graph

Use for one primary subject:

- ego network centered on the current entity
- strong first-ring relationships
- weaker or deferred edges visually reduced
- side panel for source documents and claims

### 3. Pattern graph

Use for repeated structures:

- cluster-aware grouping
- hulls, bands, or grouped backgrounds with restraint
- count summaries before full expansion

### 4. Story graph

Use for narrative explanation:

- staged reveals
- guided selection sequence
- graph plus captions or notes

## Layout rules

Choose layout based on task, not habit:

- force-directed for exploratory topology
- concentric or radial for ego views
- dag-like or layered for directional pipelines
- geographic or timeline hybrids only when those dimensions are semantically real

Do not treat the layout engine as art direction. Post-process and curate the final view.

## Node rules

- node shape should encode only a small number of durable classes
- node size should not fluctuate without a clear metric
- selected nodes need strong contrast
- provisional nodes should read as provisional
- accepted and deferred states should be visually distinguishable

Useful channels:

- fill color for type
- border or badge for review status
- opacity for confidence
- icon or small glyph for external-source richness

## Edge rules

- reduce edge vocabulary aggressively
- reserve arrowheads for relationships where direction matters
- use thickness only when weight truly means something
- curve or bundle only when it improves readability
- fade background edges during focused exploration

In GrooveGraph specifically:

- edges should often communicate confidence or review status
- provenance should be inspectable from the edge or adjacent panel, not hidden

## Label rules

- labels are not all-or-nothing
- dense graphs need thresholded or focused labels
- important entities can be pinned
- relationship labels should appear selectively, usually on focus

When in doubt, prefer:

- stable node labels
- contextual relationship labels
- rich detail in the side panel

## Companion surfaces

The graph should rarely stand alone.

Pair it with:

- source list
- claim list
- filters
- search
- entity metadata panel
- review actions

The graph shows structure. The side surfaces explain why the structure exists.

## GrooveGraph-specific patterns

### Discovery mode

- provisional nodes and edges
- evidence-first side panels
- easy accept, defer, reject workflow
- graph updates should feel inspectable, not magical

### Normalization mode

- stronger type cues
- canonical labels
- clearer relationship taxonomy
- reduced provisional styling

### Ambiguity mode

- alternative candidates can coexist
- uncertainty should be visible
- do not visually overstate confidence just because the layout is polished

## Motion pairing

If motion is added, coordinate with the GSAP skill:

- use motion to reveal paths, clusters, and state changes
- avoid constant simulation unless it truly helps understanding
- selection, expansion, and recentering are the best places for motion

Good pairings:

- graph expansion with `Flip`
- route or edge reveal with `DrawSVGPlugin`
- guided narrative scroll with `ScrollTrigger`

## Review checklist

- Can a user tell what the current focus is in under two seconds?
- Is node color doing one job consistently?
- Are review state and confidence visually legible?
- Does the graph remain useful when labels are reduced?
- Can the user get from a node or edge to supporting evidence quickly?
