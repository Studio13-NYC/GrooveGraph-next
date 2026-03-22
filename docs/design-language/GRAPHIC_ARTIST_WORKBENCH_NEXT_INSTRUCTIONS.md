# Instructions for `graphic-artist` — Research Workbench

Use this brief when designing or implementing the research workbench at **`/`** in `research/tools/openai-research-workspace`. **Visual reference:** the shipped **manual / plate** shell (`.gg-next-root`); preserve **functional requirements** (same APIs, session lifecycle, decisions, edits).

**Vocabulary:** [`WORKBENCH_VOCAB.md`](WORKBENCH_VOCAB.md). **Figma:** [`FIGMA_MCP.md`](FIGMA_MCP.md). **Design system file:** [`groovegraph-design-system.fig`](groovegraph-design-system.fig) — work in this document; baseline type **Helvetica Neue** (see `--gg-font-sans`). **Hosted:** [GrooveGraph](https://www.figma.com/design/0qV7zjnUZ6kAHBzI0wxFEt) (`fileKey` `0qV7zjnUZ6kAHBzI0wxFEt`) — use `get_design_context` with **`node-id`** from the URL (e.g. `5-2` → `5:2`).

---

## 1. Role

You are the **graphic-artist** lane (`.cursor/agents/graphic-artist.md`). You own **composition, typography hierarchy, token binding**, **manual / plate grammar**, and **motion intent**. Output must be executable in code without orphan hex or decorative SaaS chrome.

---

## 2. Functional requirements (non-negotiable, from product)

- List sessions; select one; create session from seed string.
- Stream messages (user / assistant) with markdown; compose and **send turn**.
- Show **field notes** and **sources** as **stacked sections** (Field notes on top, Sources below) — each **collapsible** with a header + chevron; Field notes **expanded** and Sources **collapsed** by default; **independent scroll** in each body (see §5 Evidence row).
- **Graph review**: relationship triplets with accept / defer / reject; **edit** triplet (entities, verb, aliases).
- **Claims** with same decision row.
- **Resizable** two-column split on wide viewports; stack on narrow.
- Surface **errors** clearly.
- Respect **`prefers-reduced-motion`** for any motion (prefer none or opacity-only).

---

## 3. Design authority (order)

1. `docs/design-language/FOUNDATION.md` (§ Context split)
2. `docs/design-language/FIGMA_MCP.md` + Figma **`get_design_context`** when frames exist
3. `framework/src/visual-system/nycta-groovegraph-tokens.css` — **only** CSS color/geometry source
4. `graphic-design-agent-assets/.../SOFTWARE_WAYFINDING_FOUNDATION.md` — decision-point information

---

## 4. First principles (software + language)

- **Purpose:** The workbench reads as a **standards manual page**: **index** (sessions), **primary modules** (investigation, evidence), **split** (resize), **review modules** (graph, claims). Every block answers *where am I*, *what do I do next*, or *what supports that action* — **without** transit journey metaphors.
- **Canvas:** `--gg-surface-canvas` / `--paper` only—no warm substrate.
- **Three layers:** every region is **identification** (what place is this), **directional** (what next), or **informational** (supporting detail). No tutorial prose in the identification band.
- **Color:** Token hues are **functional coding**; **one** directional accent for primary forward action: `--gg-accent-directional`.

---

## 5. Deliverable: layout model (manual page, not a transit board)

Reject a **“fat header + two equal columns of stacked lane cards”** dashboard layout as the spatial idea. Use a **manual / plate** model:

| Zone | Role | Layout idea |
|------|------|----------------|
| **Masthead** | Identification + directional | Full-width **sign plate**: `--gg-sign-band` strip, **GrooveGraph** (identification), one **directional** line (active session / next step only). |
| **Module identity** | Orientation | **Plate bands** + token hues (Investigation, Evidence, Graph review, Claims). **No** top module-legend strip per PRD — swatches are not a second navigation layer. |
| **Index column** | Session register | **Narrow column** (~260–280px): **New session** plate + vertical **list** of sessions (disc/dot + title + time). Selected session uses **directional** emphasis (`--gg-accent-directional` / band), not “stop” language. |
| **Investigation module** | Primary workspace | Message stream + composer; **orange** band = directional emphasis for this stage. |
| **Evidence module** | Informational support | **Stacked sections** (not columns): **Field notes** then **Sources** — each **collapsible** (header button + chevron, `aria-expanded`). **Field notes** open by default; **Sources** collapsed. Each section body **scrolls independently**. **Blue** band. **Height band** matches **Claims**: `height` / `max-height` = `--gg-workbench-module-max-h` so flex + overflow do not collapse. Spacing between sections: `--gg-route-parallel-gap` via stack `gap`. |
| **Split** | Resize | Draggable **split** control; hairline + engineered handle; label **Split**, not transfer. |
| **Review modules** | Decision | **Graph review** (magenta family) and **Claims** (yellow family) as separate **plates**. |

Typography: **Helvetica Neue** via `--gg-font-sans` (same stack as [`groovegraph-design-system.fig`](groovegraph-design-system.fig)); kickers at **type-grid-1** scale + `--gg-tracking-label`, titles **type-grid-2/3**, body **leading-body**. Plates use **`--gg-sign-panel`**, corners **`--gg-radius-r1`–`r3`** consistently.

---

## 6. CSS architecture

- Workbench rules scoped under **`.gg-next-root`** in `app/workbench.css` (imported from the root layout).
- Prefer **logical properties**, **8px grid**, **token variables** for borders, radii, strokes.

---

## 7. Completion criteria

- The workbench reads as a **manual-first** surface (structure + plate grammar + index + split); **no** module-legend strip.
- Tokens only from `nycta-groovegraph-tokens.css` (+ `color-mix` on those tokens).
- Accessibility: focus states, separator `aria-label`, button labels match **WORKBENCH_VOCAB**.
- **Graphic-artist sign-off:** layout matches sections 4–6; no conflicting regime (no dark Studio13 map chrome unless brief explicitly asks).

---

## 8. Handoff

- **Implementer** wires React to existing `/api/sessions/*` routes; do not change API contracts in this task.
- **Animator** may later add **short** GSAP only if it reinforces plate reveal or split affordance; default static.
