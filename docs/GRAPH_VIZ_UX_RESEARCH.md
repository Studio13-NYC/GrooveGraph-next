# Workbench graph visualization — design + UI research

**Status:** Research brief (recommendations; not an implementation ticket).  
**Scope:** Sigma.js graph panel in the research workbench (`product/src/components/WorkbenchSigmaGraph.tsx`), data from [`WorkbenchVizGraph`](../product/src/types/workbench-viz-graph.ts) via `GET /api/sessions/[sessionId]/graph/viz`.

**Agents:** `design` (visual encoding, tokens, FOUNDATION), `ui` (Sigma/Graphology capabilities, layout, a11y).

---

## 1. Dataset and goals

- **Nodes:** Entities with display label and optional **kind** (`subtitle` today — maps from `provisionalKind` in session build).
- **Edges:** Directed relationships; optional **verb** (`label` on edges).
- **Sources:** In-memory session candidates and/or TypeDB-synced subgraph (entity IIDs vs candidate ids — both are opaque string ids for Sigma).
- **User tasks:** See triplet structure at a glance; distinguish **review state** and **entity kind** when those fields exist; avoid unreadable “hairballs” as sessions grow.

---

## 2. Design research (`design` agent)

### 2.1 Visual encoding matrix (token-backed)

Use **`product/src/visual-system/nycta-groovegraph-tokens.css`** — route hues are **semantic carriers** per FOUNDATION §3 (“color identifies route families or durable identity”).

| Channel | Encode | Token / treatment |
|--------|--------|-------------------|
| **Node fill** | `provisionalKind` (or entity class) | Hash or map known kinds to `--gg-route-red`, `--gg-route-blue`, `--gg-route-green`, `--gg-route-orange`, `--gg-route-purple`, `--gg-route-brown`, `--gg-route-gray`, `--gg-route-lime`; **unknown kind** → `--gg-slate` or `--gg-route-gray`. |
| **Node ring / border** | `review-status` (entity) | **Proposed:** default stroke `--gg-ink` hairline; **accepted:** subtle boost or `--gg-route-green` ring; **deferred:** dashed stroke (canvas or reducer); **rejected:** muted fill + `--gg-route-red` ring or exclude from default view. |
| **Node size** | Importance (optional) | Default one size; optional degree centrality or “focal entity” → `--gg-disc-sm` scale metaphor (small step up only). |
| **Edge stroke** | Uniform “trunk” at panel scale | Single `--gg-route-stroke-hairline` or **2px** equivalent in graph units; **verbs** are labels, not wildly varying thickness (aligns with FOUNDATION §1 uniform weight). |
| **Edge direction** | Directed triplets | Sigma `type: "arrow"` on directed edges (see §3). |
| **Accent** | Selection / hover / “directional” focus | `--gg-accent-directional` (`--gg-route-orange`) for highlighted path or focused node neighborhood. |

**Legend (required for interpretability):** A compact HTML legend above or beside the canvas listing **kind → swatch** and **status → treatment**. Sigma’s WebGL canvas is not accessible for screen readers alone; the legend carries semantic meaning (see §4).

### 2.2 FOUNDATION alignment

From [`design-language/FOUNDATION.mdc`](design-language/FOUNDATION.mdc):

- **§1 Map grammar** applies when the panel is “literally route-shaped”: prefer **orthogonal** feel where possible; Sigma’s default **curved edges** may conflict with **45° only** — acceptable as **schematic** if **line weight stays uniform** and **junctions** read as explicit nodes (not implied line crossings). If strict diagram grammar is required later, consider **edge program** customizations or export to SVG — higher cost.
- **Figure/ground:** Canvas background already uses neutral tokens (`--paper` / `--gg-sign-panel` mix in workbench CSS); keep **no warm substrate**.
- **Information at the decision point:** Graph supports **Graph review** — show **counts** and **source** (TypeDB vs session) in the caption (already partially present).

### 2.3 External references (visual + UX)

| Reference | What to borrow |
|-----------|-------------------|
| [Sigma.js Storybook — use-reducers](https://github.com/jacomyal/sigma.js/blob/main/packages/storybook/stories/1-core-features/4-use-reducers/index.ts) | Dynamic **highlight** / neighborhood emphasis without mutating base graph data. |
| [Sigma.js Storybook — custom-rendering](https://github.com/jacomyal/sigma.js/blob/main/packages/storybook/stories/1-core-features/5-custom-rendering/index.ts) | **Bordered nodes** if status rings need crisp separation from fills. |
| [Sigma.js website demo](https://www.sigmajs.org/demo) + [Storybook index](https://www.sigmajs.org/storybook) | Interactive reference for **zoom**, **label density**, **hover** behavior. |
| [yFiles — Guide to visualizing knowledge graphs](https://www.yfiles.com/resources/how-to/guide-to-visualizing-knowledge-graphs) | Match **layout** to structure; **2–3 shapes max**; color = type; **progressive disclosure** and filtering to reduce hairballs. |
| [Cambridge Intelligence — Graph visualization UX](https://cambridge-intelligence.com/graph-visualization-ux-how-to-avoid-wrecking-your-graph-visualization/) | Name **hairball / snowstorm / starburst** failure modes; prioritize **filtering** and **user goal** over showing everything. |
| [TypeDB — Graph visualisation guide](https://typedb.com/docs/guides/integrations/graph-viz/) | Confirms **application-side** graph (networkx/graphology) from TypeDB results; **TypeDB Studio** uses Sigma + Graphology — same stack family as this app. |

---

## 3. UI research (`ui` agent)

### 3.1 Sigma.js v3 (authoritative behaviors)

- **Data model:** [Graph data](https://www.sigmajs.org/docs/advanced/data) — nodes: `x`, `y`, `size`, `color`, `type` (`circle`, …), `label`, `zIndex`.
- **Reducers:** [Customization](https://www.sigmajs.org/docs/advanced/customization) — `nodeReducer` / `edgeReducer` for hover, selection, highlight without rewriting Graphology.
- **Labels:** `labelFont`, `labelSize`, `labelWeight`, `labelColor`; **`renderEdgeLabels: true`** for **verbs** with density control (`labelDensity`, `labelRenderedSizeThreshold` in settings).
- **Sizes / viewport:** [Node and Edge Sizes](https://www.sigmajs.org/docs/advanced/sizes/) — `autoRescale`, `zoomToSizeRatioFunction` (default `Math.sqrt`), `itemSizesReference` — tune when **fixed panel height** makes nodes too large/small.
- **Directed edges:** Set edge `type: "arrow"` in graphology attributes (per Sigma data docs).

### 3.2 Layout options (Graphology)

| Strategy | When | Notes |
|----------|------|--------|
| **Circular** (current) | Small **N** (≤ ~10–15) | Cheap, predictable; poor for dense or hierarchical structure. |
| **ForceAtlas2** | Medium graphs, exploratory | Add `graphology-layout-forceatlas2` (or run in worker); **async** + loading state; **may jiggle** on resize — debounce or snapshot positions. |
| **Hierarchical** | DAG-like subsets | Only if you later export **tree-like** or layered queries; needs `graphology` + layout lib or manual layer assignment. |
| **Radial (ego)** | Focus on one entity | “Expand neighbors” pattern — good for **progressive disclosure**. |

**Recommendation:** Tiered — **keep circle** for small N; **add FA2 or similar** when `nodes.length + edges.length` exceeds a threshold; **cap** max nodes rendered in panel (with “show N more” in legend).

### 3.3 Performance (embedded ~220px panel)

- Prefer **precomputed positions** once per graph payload; avoid **continuous** force in the render loop.
- Use **`partialGraph`** on `refresh` when only highlights change (Sigma API).
- **Large graphs:** Lower `labelDensity`, hide edge labels until zoom; consider **clustering** or **sampling** (later phase).

### 3.4 Accessibility

- **Canvas:** Treat as **decorative**; provide **`role="img"`** + **`aria-label`** with summary (counts, source) — already partially present; extend with **review status** summary when data exists.
- **Legend:** Keyboard-focusable controls if filters are added; **no** critical info only in canvas.
- **Motion:** Avoid layout animations that run continuously without user intent (WCAG).

---

## 4. DTO / API gaps

Current [`WorkbenchVizNode`](../product/src/types/workbench-viz-graph.ts) has **`id`, `label`, `subtitle?`**. **Review status** and **relationship status** are **not** in the DTO.

To implement **full** encoding matrix (§2.1):

| Field | Add to | Source |
|-------|--------|--------|
| `entityKind` or keep `subtitle` | `WorkbenchVizNode` | Session: `EntityCandidate.provisionalKind`; TypeDB: `provisional-entity-kind` attribute. |
| `reviewStatus` | `WorkbenchVizNode` | Session: `EntityCandidate.status`; TypeDB: `review-status` on `graph-entity`. |
| `reviewStatus` or `edgeKind` | `WorkbenchVizEdge` | Session: `RelationshipCandidate.status`; TypeDB: `rel-review-status`. |

**Edge verb** is already `label` on edges when present.

---

## 5. Ranked recommendations

### Phase A — MVP (high value, low risk)

1. **DTO:** Extend `WorkbenchVizGraph` with optional `reviewStatus` on nodes and edges (string union matching `ReviewStatus`).
2. **API:** Populate from [`build-from-session`](../product/src/lib/workbench-viz/build-from-session.ts) and TypeDB viz queries in [`typedb-graph-persistence.ts`](../product/src/lib/server/typedb-graph-persistence.ts).
3. **UI:** Sigma **`nodeReducer`/`edgeReducer`** for hover + selected node; **kind** → **route token** color; **status** → opacity or border via **custom-rendering** or reducer-sized borders.
4. **Legend:** HTML legend component (tokens + labels).
5. **Edges:** `type: "arrow"`; enable **edge labels** for verbs only when **E** below threshold.

### Phase B — Scale and exploration

1. **Layout:** Add **ForceAtlas2** (or similar) when N > threshold; **loading** state during layout.
2. **Filters:** By status / kind (checkboxes) — reduces hairballs per [Cambridge Intelligence](https://cambridge-intelligence.com/graph-visualization-ux-how-to-avoid-wrecking-your-graph-visualization/) / [yFiles](https://www.yfiles.com/resources/how-to/guide-to-visualizing-knowledge-graphs).
3. **Radial ego view** for “focus entity” (optional).

### Phase C — Strict diagram grammar (optional)

1. **Orthogonal edge routing** or **custom edge programs** — significant engineering; only if map diagram fidelity becomes a hard requirement.

---

## 6. References (URLs)

- Sigma: [Customization](https://www.sigmajs.org/docs/advanced/customization), [Data](https://www.sigmajs.org/docs/advanced/data), [Sizes](https://www.sigmajs.org/docs/advanced/sizes/), [Demo](https://www.sigmajs.org/demo), [Storybook](https://www.sigmajs.org/storybook)
- KG UX: [yFiles](https://www.yfiles.com/resources/how-to/guide-to-visualizing-knowledge-graphs), [Cambridge Intelligence](https://cambridge-intelligence.com/graph-visualization-ux-how-to-avoid-wrecking-your-graph-visualization/)
- TypeDB: [Graph visualisation](https://typedb.com/docs/guides/integrations/graph-viz/)
