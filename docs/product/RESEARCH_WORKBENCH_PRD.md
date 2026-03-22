# PRD — Research workbench (OpenAI workspace)

**Status:** Draft  
**Scope:** `research/tools/openai-research-workspace` (route `/`)  
**Delivery order (locked):** **1) Triplet UX** → **2) Neo4j persistence** → **3) Session graph visualization**  
**Sources:** UX interview (thread), [`docs/ux/RESEARCH_WORKBENCH_UX_INTERVIEW.md`](../ux/RESEARCH_WORKBENCH_UX_INTERVIEW.md), design briefs in [`docs/design-language/`](../design-language/)

**Design owner (start here):** [`.cursor/agents/graphic-artist.md`](../../.cursor/agents/graphic-artist.md) — this lane **owns** Figma-informed layout, token fidelity, and manual-first chrome for Phases 1 and 3. **Collaboration contract:** [`docs/design-language/FIGMA_MCP.md`](../design-language/FIGMA_MCP.md) (`create_design_system_rules`, `generate_figma_design`, `get_design_context`, Code Connect when available).

---

## 1. Summary

The research workbench is the discovery-first surface for artist-seed investigations, streaming dialogue, evidence, provisional **relationship triplets**, and **claims**. This PRD defines **what to ship next** in three phases. Phases are **sequential**: each phase delivers value on its own and must not be blocked by later phases.

---

## 2. Problem

- **Triplet review** is hard to scan: the layout does not read as natural language (**subject — relationship — object**), which slows decisions when switching sessions often.
- **Evidence-first** job-to-be-done is clear, but **downstream value** is unlocked only when accepted structure can **leave the session** and be **visualized** as a graph.
- **Reliability:** failed turns must not discard user input.

---

## 3. Target user (from interview)

- **Primary job:** Explore a topic and **gather evidence quickly** (not “build a graph first”).
- **Behavior:** Switches sessions **several times per day**; wants **new session** as the default path; **past sessions** should appear only after an explicit control (not the default list).
- **Layout:** On large screens, default split favors **Review** (~60–70% of width); **no** reliance on small screens for core work.
- **Claims:** Secondary to triplets; **contextual capture** is enough — **not** required as first-class graph entities.
- **Success:** Session data can be **persisted to Neo4j**, then **visualized** as a graph for that session.

---

## 4. Goals

| ID | Goal |
|----|------|
| G1 | Triplet rows read as **subject \| relationship \| object** with **clear, scannable** hierarchy and metadata. |
| G2 | Accepted (and optionally deferred) graph candidates **persist to Neo4j** with a defined mapping from session artifacts. |
| G3 | User can open a **graph visualization** of the **current session’s** persisted data (or equivalent scope). |
| G4 | **Composer / draft** survives errors and retry paths (no silent loss of typed content). |

---

## 5. Roles and design collaboration

| Role | Responsibility for this PRD |
|------|-------------------------------|
| **`graphic-artist`** ([`.cursor/agents/graphic-artist.md`](../../.cursor/agents/graphic-artist.md)) | **Leads Phase 1 and Phase 3 visual work:** triplet row layout, index/split/index disclosure, removal of the module legend, graph viz presentation. Uses **Figma MCP** per [`FIGMA_MCP.md`](../design-language/FIGMA_MCP.md): baseline frames in [`groovegraph-design-system.fig`](../design-language/groovegraph-design-system.fig) / hosted GrooveGraph file, **`get_design_context`** before large UI edits, html-to-design capture when refreshing screenshots. |
| **`implementer`** | Implements React/CSS/API changes against PRD acceptance criteria and Figma handoff; wires persistence (Phase 2) and Neo4j. |
| **`product-manager`** | Optional: scope cuts, open questions (§10). |

**Surface for collaboration:** All Figma ↔ repo expectations (tool order, `fileKey` / `nodeId`, tokens-win rule, Code Connect ownership) live in **[`docs/design-language/FIGMA_MCP.md`](../design-language/FIGMA_MCP.md)**. The PRD does not duplicate that workflow; it **references** it.

---

## 6. Non-goals (this PRD)

- Replacing the **manual-first** visual system with transit metaphors (see [`docs/design-language/FOUNDATION.md`](../design-language/FOUNDATION.md)).
- **Mobile-first** parity (desktop-first is acceptable).
- **Claims** as mandatory nodes in Neo4j (unless a later product decision explicitly expands scope).

---

## 7. Phased delivery

### Phase 1 — Triplet UX (ship first)

**Design lead:** `graphic-artist` + [`FIGMA_MCP.md`](../design-language/FIGMA_MCP.md) (frames/spec before or alongside code).

**Objective:** Graph review feels like reading a sentence, not a dashboard card.

**Requirements**

1. **Proposition row** uses a **three-column** layout:
   - **Subject** column: the **entity stack** (name + kind + aliases) **sits flush to the relationship** (stack block **end-aligned** toward the verb so the name meets the verb’s left edge). **Primary label** and **secondary metadata** below share one **vertical left edge** (aligned under the name, not the card’s far left).
   - **Relationship** column: **centered**; relationship text (or edit control) in a **container whose width follows content** (dynamic, not full-width stretch). **No horizontal gap** between column content and the verb where possible (columns **hug** the verb).
   - **Object** column: the **entity stack** **sits flush to the relationship** from the other side (**start-aligned** toward the verb). **Primary label** and metadata below share one **vertical left edge** under the object name (not centered on the page).
2. **Visual hierarchy:** One clear **reading order**: subject → relationship → object; then **details** under each side.
3. **Remove** the top **module color legend** strip (per UX decision); keep module identity via **plate bands** / existing tokens only.
4. **Index:** Default UI emphasizes **new session**; **past sessions** live behind **explicit disclosure** (e.g. button, drawer, collapsible panel) — not the default list.
5. **Default split** (wide viewports): **~60–70%** width to **Review** column, remainder to Investigation — **persisted** in local storage or equivalent so it survives reloads.
6. **Evidence module (stacked, locked in code):** **Field notes** and **Sources** are **two sections stacked vertically** (not side-by-side). **Field notes** is **expanded** on first paint; **Sources** is **collapsed**. Each section has a **header button** with a **chevron** affordance, `aria-expanded`, and `aria-controls` pointing at its scroll region. Each body is **independently scrollable** (`overflow: auto` in its own pane). Implementation: `EvidenceCollapsibleSection` in `research/tools/openai-research-workspace/src/components/WorkbenchNextView.tsx`; styles under `.gg-next-evidence-*` in `app/workbench.css`.
7. **Evidence / Claims vertical alignment (locked in code):** The **Evidence** plate and **Claims** plate use the **same fixed band height** — `height` and `max-height` both set to **`--gg-workbench-module-max-h`** (same token as Investigation / Graph review cap: `min(58vh, 680px)` in `.gg-next-root`). This gives nested flex children a **definite height** so scroll regions do not collapse; inner scroll panes use **`min-height: 0`** in the flex chain.

**Acceptance**

- [ ] A new user can read a triplet **without** re-learning a custom layout metaphor.
- [ ] Module legend strip is **gone** from the workbench UI.
- [ ] Past sessions are **not** in the default view without an explicit action.
- [ ] Default column split matches **Review-heavy** bias and persists.
- [ ] Evidence shows **two stacked** sections; Field notes **open**, Sources **closed** by default; each section **scrolls independently** inside its band.
- [ ] Evidence and Claims plates share the **same** height band (aligned across columns).

---

### Phase 2 — Neo4j persistence

**Objective:** Session decisions and entities can be written to **Neo4j** in a repeatable way.

**Requirements**

1. **Data model** (document in this repo or `framework/`): mapping from **session entities / relationships / decisions** (and optional **claims** as properties or separate nodes — product decision) to **Neo4j** labels, relationship types, and properties.
2. **Operations:** At minimum: **upsert** accepted entities and relationships; **idempotent** or clearly versioned writes to avoid duplicate edges on retry.
3. **Configuration:** Connection via **environment** (URI, auth, database); failures surface **clear messages**; **do not** clear user drafts.
4. **Scope:** Persistence runs **after** explicit user action (e.g. “Sync to graph”, “Export session”, or “Persist accepted”) — exact trigger **TBD** in implementation plan.

**Acceptance**

- [ ] Accepted triplets (and agreed scope of entities) appear in Neo4j **as specified**.
- [ ] Failed writes are **recoverable**; **composer** and in-progress edits **preserved** (aligns with G4).

---

### Phase 3 — Session graph visualization

**Design lead:** `graphic-artist` + [`graph-data-viz-system`](../../.cursor/skills/graph-data-viz-system/SKILL.md) + [`FIGMA_MCP.md`](../design-language/FIGMA_MCP.md) as needed for the viz shell.

**Objective:** User can see a **graph view** of the **session’s** persisted data (or linked subgraph).

**Requirements**

1. **Input:** Reads from Neo4j (or same API that exposes persisted session data).
2. **Scope:** Minimum — **nodes and edges** corresponding to the session’s persisted graph; **labels** readable; **filters** optional (nice-to-have).
3. **Integration:** Entry point from the workbench (e.g. “View graph”) — **desktop-only** acceptable.
4. **Visual language:** Follow [`docs/design-language/FOUNDATION.md`](../design-language/FOUNDATION.md) and [`graph-data-viz-system`](../../.cursor/skills/graph-data-viz-system/SKILL.md) for investigative clarity.

**Acceptance**

- [ ] User can open a **graph visualization** of the **current session** after persistence.
- [ ] Performance acceptable for **typical** session sizes (define concrete limits in implementation).

---

## 8. Cross-cutting requirements

| Area | Requirement |
|------|-------------|
| Errors | **Retry** must not lose **typed message** / composer draft (Q8). |
| Claims | **Contextual** capture; **not** required in Neo4j graph core unless Phase 2 spec expands. |
| Design | **Owner:** `graphic-artist`. **Figma / MCP:** [`docs/design-language/FIGMA_MCP.md`](../design-language/FIGMA_MCP.md). **Copy / IA:** [`docs/design-language/WORKBENCH_VOCAB.md`](../design-language/WORKBENCH_VOCAB.md). |

---

## 9. Success metrics (initial)

| Metric | Target |
|--------|--------|
| Triplet review time | Qualitative: “reads like a sentence” in internal pilot |
| Persistence | 100% of **accepted** items in test sessions appear in Neo4j |
| Graph viz | Session graph loads in **&lt; X s** on reference hardware (set X in implementation) |
| Reliability | Zero **lost drafts** on simulated API failure in manual QA |

---

## 10. Open questions

1. **Neo4j hosting:** Aura vs self-hosted vs local dev — **environment** strategy.
2. **Persistence trigger:** Automatic on each decision vs. explicit **batch sync** button.
3. **Claims in Neo4j:** Properties on session node, text nodes, or omit entirely.
4. **Graph library:** Cytoscape.js, D3, other — align with existing product patterns.

---

## 11. References

- [`.cursor/agents/graphic-artist.md`](../../.cursor/agents/graphic-artist.md) — design owner; Figma MCP authority order
- [`docs/design-language/FIGMA_MCP.md`](../design-language/FIGMA_MCP.md) — collaboration surface (tools, workflow, file keys)
- [`docs/ux/RESEARCH_WORKBENCH_UX_INTERVIEW.md`](../ux/RESEARCH_WORKBENCH_UX_INTERVIEW.md)
- [`docs/design-language/GRAPHIC_ARTIST_WORKBENCH_NEXT_INSTRUCTIONS.md`](../design-language/GRAPHIC_ARTIST_WORKBENCH_NEXT_INSTRUCTIONS.md)
- [`research/tools/openai-research-workspace/README.md`](../../research/tools/openai-research-workspace/README.md)
