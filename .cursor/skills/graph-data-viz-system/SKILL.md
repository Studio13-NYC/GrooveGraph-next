---
name: graph-data-viz-system
description: Deep graph and network visualization direction for GrooveGraph Next. Use when the user mentions graph data visualization, node-link views, Cytoscape, network analysis, relationship maps, ontology views, or when the `graphic-artist` lane needs guidance for graph-shaped interfaces and explainable network visuals.
---
# Graph Data Viz System

Use this skill when a visual artifact must explain or explore connected data rather than merely decorate it.

## Outcomes

Return:

- graph-viz framing
- view model
- node, edge, and label strategy
- interaction plan
- density and readability guardrails

## Starting reference

Start with Cytoscape as a serious graph-viz reference point.

Why it matters:

- it is built for complex network analysis and visualization
- it treats attributes as first-class alongside topology
- it supports domain-independent network analysis rather than one narrow chart type

Do not copy Cytoscape's product UI literally. Borrow its seriousness about structure, visual mapping, and dense graph readability.

## GrooveGraph graph-viz stance

Default GrooveGraph graph views should feel:

- legible before they feel impressive
- investigative before decorative
- attribute-aware rather than topology-only
- useful at multiple zoom levels
- explicit about uncertainty, provenance, and provisional structure

## Default visual grammar

Prefer:

- clear node classes
- restrained edge vocabulary
- labels that appear intentionally, not all at once
- selected-path emphasis over global noise
- companion panels for evidence and metadata

Avoid:

- hairball-by-default layouts
- too many colors doing the same job
- permanent full-label mode on dense graphs
- ornamental edge effects that obscure direction or meaning

## Recommended view families

- node-link graph for relationship exploration
- ego network for focused entity inspection
- timeline-plus-graph hybrid for change over time
- cluster overview for pattern finding
- table-plus-graph split view for precision work

## Interaction defaults

Graph interfaces should usually support:

1. pan and zoom
2. selection and focus state
3. neighborhood expansion
4. filtering by type, confidence, or source
5. details panel with evidence and provenance

## Mapping rules

Use channels intentionally:

- color for type or status
- size for importance only when the metric is meaningful
- stroke or glow for active or selected state
- opacity for confidence or de-emphasis
- line style only for truly distinct relationship classes

## Additional reference

For network layout strategy, node and edge rules, and GrooveGraph-specific graph UI patterns, read [reference.md](reference.md).
