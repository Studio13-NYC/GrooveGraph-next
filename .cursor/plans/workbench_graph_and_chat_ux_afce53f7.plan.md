---
name: Workbench graph and chat UX
overview: Fix graph filter layout (true collapse + vertical rail + responsive behavior), align entity kind colors/filters with schema-backed semantics and explicit tokens, repair Sigma double-click/focus, add per-session viz snapshot history (hook + stale UX + selection rules), clarify chat role labels, and bind Investigation column height to the viewport with independent scroll regions.
todos:
  - id: filter-rail
    content: Replace details with explicit collapsible; vertical filter rail + flex layout; narrow breakpoint stack/drawer; rail density + tap targets
    status: pending
  - id: schema-kinds
    content: KindFamily normalization + explicit provisionalKind→family table; token matrix in tokens CSS; unknown-kind handling; comment doc for merge policy
    status: pending
  - id: sigma-focus
    content: Fix double-click vs camera; refresh/camera centers on focus; verify no race after rebuild
    status: pending
  - id: viz-history
    content: useSessionVizHistory hook; fingerprint push; back/forward tertiary chrome; stale snapshot label; reset selection/focus on navigate
    status: pending
  - id: chat-viewport
    content: Body flex min-height 0 chain; Investigation scroll; compose fixed; role copy + subtitle; textarea max-height
    status: pending
  - id: verify
    content: Manual pass (incl. narrow + history + a11y focus); tsc/build
    status: pending
isProject: false
---

# Workbench: filters, focus, history, chat layout, schema-aligned kinds

## Context

- **Graph agent ([`.cursor/agents/graph.mdc`](d:\Studio13\Lab\Code\GrooveGraph-next\.cursor\agents\graph.mdc))** does not enumerate UI kinds; it defers to **[`docs/DB-Schema-Export.typeql`](d:\Studio13\Lab\Code\GrooveGraph-next\docs\DB-Schema-Export.typeql)**. That file defines concrete node types such as `aura-node-person`, `aura-node-artist`, `aura-node-band`, `aura-node-album`, `aura-node-release`, `aura-node-track`, `aura-node-studio`, `aura-node-label`, `aura-node-genre`, `aura-node-instrument`, `aura-node-effect`, `aura-node-performance`, etc. **Provisional kinds** in session/viz code are free strings ([`research-runtime.ts`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\lib\server\research-runtime.ts)); mapping should normalize those strings onto schema-aligned **families** for palette + filters.
- **“USER” in chat** is the message `role` from the session ([`WorkbenchNextView.tsx`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\components\WorkbenchNextView.tsx) ~375: `entry.role`). It is not a separate “section”—it labels **your** turns vs the model.

---

## Agent review (folded in)

Cross-lane tension to respect during implementation: **Design** wants token purity and calm hierarchy; **Graph** wants explicit semantics and honest snapshots; **UI** wants responsive shells and predictable focus. The sections below incorporate their concrete asks.

### Design (fold-in)

- **Token matrix:** Do not “mirror” hex in TS ad hoc. Add **named semantic tokens** in [`nycta-groovegraph-tokens.css`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\visual-system\nycta-groovegraph-tokens.css) (e.g. `--gg-viz-family-people`, …) with a short comment tying each to route grammar / FOUNDATION. `graph-viz-styles` references those names only.
- **Rail density:** ~200–240px rail with **seven** families risks cramped controls. Enforce **minimum tap targets** (~40px row height where possible), **truncation + title** on long labels, optional **subsection accordions** inside the rail if needed.
- **History controls:** Back/forward are **tertiary** (not another orange CTA). Use existing secondary/neutral button styles; keep graph map plate hierarchy: canvas primary, chrome secondary.

### Graph (fold-in)

- **Mapping is policy, not schema dump:** Merging `aura-node-person` / `artist` / `band` into **People** is an explicit **product/graph** choice. Document in a **comment block** atop the normalizer (and list each `provisionalKind` synonym tested against real sessions).
- **Unknown kinds:** Avoid silently hiding data. **Log or count** unknown `provisionalKind` in dev; in UI, **Other** + hash fallback remains visible when “all families” selected; consider a small **footer or dev-only** hint when unmapped kinds exist (plan minimum: ensure they are not dropped by filter logic by mistake).
- **History vs mental model:** v1 history is **API snapshot** only (not filter/focus). UX copy should not imply “every exploration step” unless we add a second stack later. Each history entry carries **`capturedAt` / `updatedAt`**; show a **stale snapshot** line near back/forward (e.g. “Graph as of …”) when not viewing the latest fingerprint.
- **Integrity:** When navigating back, **clear selection and focus** if the node id is absent in the snapshot (see UI fold-in).

### UI (fold-in)

- **Responsive rail:** At narrow width (reuse ~980px or graph plate breakpoint), **stack rail above canvas** or use a **drawer / icon toggle** that opens filters over the canvas—do not leave a fixed 240px rail that crushes the WebGL view.
- **History hook is mandatory:** Implement **`useSessionVizHistory`** with a stable contract: `pushFingerprint`, `index`, `setIndex`, `canBack`, `canForward`, `effectiveGraph`, `latestFingerprint`, `entriesMeta` (for stale label). Parent passes `effectiveGraph` into `WorkbenchSigmaGraph`; avoid ad hoc state sprawl in the view file.
- **Graph chrome row:** One horizontal strip for **back | forward | position (e.g. 3/7) | optional filter collapse** when rail is hidden/collapsed—consistent components, not scattered controls competing with footer.
- **Focus management:** On filter panel expand/collapse, avoid **focus loss** traps; move focus to the toggle or first control intentionally if needed. After **history** navigation, **reset** `selectedNodeId` / `focusedNodeId` when ids are invalid for the new graph.

---

## 1) Graph filters: collapsible + vertical rail

**Problem:** The filter UI uses a controlled `<details open={filtersOpen} onToggle={...}>` in [`WorkbenchSigmaGraph.tsx`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\components\WorkbenchSigmaGraph.tsx). That pattern often fights native `<details>` behavior, so it may **not feel collapsible**. Chips are also laid out horizontally, wasting vertical space.

**Approach:**

- Replace `<details>` with an explicit **collapsible panel**: a button (`aria-expanded`) + a region (`aria-controls`) and CSS (max-height / overflow) or a simple “Filters” toggle. Persist open state in `localStorage` (keep existing key intent).
- **Layout:** Change the graph panel to a **horizontal split**: **left narrow rail** (~200–240px, `min-width`, `overflow-y: auto`) containing **stacked** sections (Status, Include deferred, Entity types with Select all / Clear all); **right** = existing canvas + overlay. Update [`workbench.css`](d:\Studio13\Lab\Code\GrooveGraph-next\product\app\workbench.css) (e.g. `.gg-next-sigma-panel` → flex row; new `.gg-next-graph-filter-rail`).
- **Responsive:** Below breakpoint, rail **stacks above** canvas or becomes **drawer**; filters toggle in **graph chrome** row when rail is collapsed (see Agent review).

---

## 2) Schema-aligned kinds + “official” NYCTA colors

**Problem:** [`graph-viz-styles.ts`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\lib\workbench-viz\graph-viz-styles.ts) hard-codes three filter keys (`person` / `recordings` / `studio`) and a flat `KIND_FILL` map. That under-serves schema richness and may mis-assign colors.

**Approach (with `graph` + schema discipline):**

- Add a **normalization layer**: map `provisionalKind` / `subtitle` strings → **KindFamily** enum aligned to schema clusters, e.g. `People` (person, artist, band), `Recordings` (album, release, track, performance), `Studios`, `Labels`, `Genres`, `Gear` (instrument, effect), `Other` (fallback hash). Maintain an explicit **synonym table** in code (reviewable list).
- **Tokens:** Add **named viz tokens** in [`nycta-groovegraph-tokens.css`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\visual-system\nycta-groovegraph-tokens.css); `kindToFillColor` resolves **family → CSS var** (or a single TS map whose values are **only** `var(--gg-viz-…)` strings), not arbitrary hex duplicates.
- Update **`passesKindFilters`** (and filter UI) to use the **family** set; keep “select all / clear all” semantics (all on = show everything including unmapped kinds; all off = empty graph with message).
- **Document** family→schema intent in comments next to the normalizer (graph agent fold-in). Optional: one line in `docs/` only if the team wants durable runbook.

---

## 3) Double-click + focus: make the graph visibly respond

**Current behavior** ([`WorkbenchSigmaGraph.tsx`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\components\WorkbenchSigmaGraph.tsx)): focus is implemented by **rebuilding** the Graphology graph with a **translation offset** so the focused node sits at the circle origin; `focusedNodeId` is in the Sigma `useEffect` dependency list.

**Likely issues:**

- Sigma’s default **camera** may **consume double-clicks** (zoom) so `doubleClickNode` never wins—common in Sigma v2. **Mitigation:** inspect installed Sigma settings in `package.json` / types and set options to **disable double-click zoom** or equivalent, or attach a **native `dblclick`** handler on the container with **hit-testing** via `sigma.getNodeAtEvent` if the API supports it.
- After rebuild, call **`sigma.refresh()`** / **`sigma.getCamera().animate`** if needed so the viewport recenters on the focused node (translation + default camera may still leave the user “off center”).
- **Click vs double-click:** keep debounced single-click for selection; ensure `clearClickTimer` runs on double-click (already present)—verify no race after fast rebuild.

**Verification:** Manual test: double-click toggles focus, node size changes, view recenters; single-click still updates footer selection only.

---

## 4) Back / forward through graph “versions” in the session

**Goal:** User can explore, then **backtrack** and **go forward** through graph states the session has used.

**Definition (v1):** Treat each **distinct successful** response from `GET /api/sessions/[id]/graph/viz` (and/or each time the resolved `WorkbenchVizApiResponse` graph payload **changes** by fingerprint) as a **history entry**. Store `{ graph, source, capturedAt or session updatedAt }` in a **per-session** stack with an index pointer.

**Implementation:**

- **`useSessionVizHistory` hook** (required): contract includes push on new fingerprint, index, bounds, `effectiveGraph`, metadata for UI label.
- Wire from [`WorkbenchNextView.tsx`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\components\WorkbenchNextView.tsx); pass **effective graph** into `WorkbenchSigmaGraph`.
- **UI:** **Graph chrome** row: tertiary **Back** / **Forward**, optional `3 / 7`, **stale** hint when `index < latest` (e.g. “As of …”). Do not use primary CTA styling.
- **Selection:** On history change, **clear or reconcile** selection/focus if node ids missing in the active snapshot.
- Reset history when `selectedSessionId` changes.

**Out of scope for v1:** history entries for **pure filter/focus** changes (local-only); second stack if product asks later.

---

## 5) Chat: viewport-bound column, transcript scroll, compose always visible

**Problem:** While `.gg-next-stream` has `overflow: auto`, the **ancestor chain** ([`gg-next-root`](d:\Studio13\Lab\Code\GrooveGraph-next\product\app\workbench.css) flex + [`gg-next-body`](d:\Studio13\Lab\Code\GrooveGraph-next\product\app\workbench.css) grid) may not pass a **definite height**, so the Investigation plate can grow with content instead of constraining to the viewport.

**Approach:**

- Ensure **main column layout** propagates `min-height: 0` and a **bounded height**: e.g. `.gg-next-body` uses `flex: 1; min-height: 0; overflow: hidden` (class + align with inline grid in TSX), and grid rows use `minmax(0, 1fr)` where appropriate.
- **Investigation plate:** inner layout = column: heading (fixed) → **`.gg-next-stream`** (`flex: 1; min-height: 0; overflow-y: auto`) → **`.gg-next-platform`** (`flex-shrink: 0`). Cap **textarea** with `max-height` + `overflow-y: auto` so a huge draft doesn’t consume the column.
- **Narrow layout:** same height discipline when the single column stacks.

---

## 6) “User section” clarity

- **No new feature:** Rename bubble labels from raw `user` / `assistant` to human copy (**“You”** / **“Research assistant”**) in [`WorkbenchNextView.tsx`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\components\WorkbenchNextView.tsx), with `aria-label` (“Your message” / “Assistant reply”).
- Add one line under the Investigation title (`.gg-next-plate-subtitle`) explaining the thread is **your questions and the assistant’s answers**.

---

## Files to touch (expected)

| Area | Files |
|------|--------|
| Filters + layout + focus | [`WorkbenchSigmaGraph.tsx`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\components\WorkbenchSigmaGraph.tsx), [`workbench.css`](d:\Studio13\Lab\Code\GrooveGraph-next\product\app\workbench.css) |
| Kind families + colors | [`graph-viz-styles.ts`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\lib\workbench-viz\graph-viz-styles.ts), [`nycta-groovegraph-tokens.css`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\visual-system\nycta-groovegraph-tokens.css) |
| History hook + chrome | New hook under e.g. `product/src/hooks/useSessionVizHistory.ts`, [`WorkbenchNextView.tsx`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\components\WorkbenchNextView.tsx) |
| Chat layout + labels | [`WorkbenchNextView.tsx`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\components\WorkbenchNextView.tsx), [`workbench.css`](d:\Studio13\Lab\Code\GrooveGraph-next\product\app\workbench.css) |
| Types (if needed) | [`workbench-viz-graph.ts`](d:\Studio13\Lab\Code\GrooveGraph-next\product\src\types\workbench-viz-graph.ts) |

---

## Testing

- **Graph:** collapse/expand filters; rail scrolls; **narrow** layout stacks/drawer works; double-click focus toggles and recenters; back/forward steps through distinct viz payloads; **stale** label when not on latest; selection clears when ids missing after back.
- **Chat:** Long thread: **only** message list scrolls; compose visible; textarea capped; resize viewport.
- **A11y:** filter toggle `aria-expanded` + keyboard; history `aria-disabled` at ends; intentional focus after filter toggle/history where applicable.
