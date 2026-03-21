# Instructions for `graphic-artist` — Research Workbench (Next regime)

Use this brief when designing or implementing **`/workbench-next`** in `research/tools/openai-research-workspace`. Do **not** treat the classic `/` layout as a visual reference—only preserve **functional parity** (same APIs, session lifecycle, decisions, edits).

---

## 1. Role

You are the **graphic-artist** lane (`.cursor/agents/graphic-artist.md`). You own **composition, typography hierarchy, token binding, map/signage metaphor**, and **motion intent**. Output must be executable in code without orphan hex or decorative SaaS chrome.

---

## 2. Functional requirements (non-negotiable, from product)

- List sessions; select one; create session from seed string.
- Stream messages (user / assistant) with markdown; compose and **send turn**.
- Show **field notes** and **sources** (collapsible sources acceptable).
- **Graph review**: relationship triplets with accept / defer / reject; **edit** triplet (entities, verb, aliases).
- **Claims** with same decision row.
- **Resizable** two-corridor split on wide viewports; stack on narrow.
- Surface **errors** clearly.
- Respect **`prefers-reduced-motion`** for any motion (prefer none or opacity-only).

---

## 3. Design authority (order)

1. `docs/design-language/FOUNDATION.md`
2. Vignelli / NYCTA map grammar (orthogonal + 45°, trunk weight, parallel gutter, interchange clarity)
3. `framework/src/visual-system/nycta-groovegraph-tokens.css` — **only** CSS color/geometry source
4. `graphic-design-agent-assets/.../SOFTWARE_WAYFINDING_FOUNDATION.md` — decision-point information

---

## 4. First principles (software + language)

- **Purpose:** The workbench is **investigative wayfinding**: the user chooses a **line** (session), rides the **research trunk** (dialogue + evidence), then **transfers** at a signed **interchange** to **review** (graph + claims). Nothing is decorative—every block answers *where am I*, *what do I do next*, or *what supports that action*.
- **Canvas:** `--gg-surface-canvas` / `--paper` only—no warm substrate.
- **Three layers:** every region is labeled **identification** (what place is this), **directional** (what next), or **informational** (supporting detail). No tutorial prose in the identification band.
- **Color:** Route tokens are **signal**; **one** directional accent: `--gg-accent-directional` for the primary forward action only.

---

## 5. Deliverable: a *new* layout (not a skin)

Reject the classic **“fat header + two equal columns of stacked lane cards”** as the spatial idea. Replace with a **transit board + corridors** model:

| Zone | Map metaphor | Layout idea |
|------|----------------|-------------|
| **Masthead** | System identification plate | Full-width **sign plate**: `--gg-sign-band` strip, then **GrooveGraph** (identification), one **directional** line (session pick / next step only). Optional link to classic workspace. |
| **Diagram strip** | System map legend | Thin **schematic** (SVG): orthogonal/45° only—nodes for **Session → Investigate → Evidence → [interchange] → Graph → Claims**; stroke from `--gg-route-stroke-*`; no illustration noise. |
| **Lines rail** | Route board | **Narrow column** (fixed ~260–280px): “New line” compact plate + **vertical list** of sessions as **stops** (disc or dot + title + time), active = **interchange** emphasis (`--gg-route-orange` ring or rail), not a generic selected row. |
| **Discovery corridor** | Parallel trunk | **One column** housing **Investigation** (primary height: message stream + platform composer) and **Evidence** below or tabbed—**parallel gutter** spacing (`--gg-route-parallel-gap` rhythm) between notes vs sources blocks. |
| **Interchange** | Transfer | Same resize behavior; visually **engineered** (hairline rails, optional label). |
| **Review corridor** | Branch lines | **Graph review** then **Claims**—each as sign plate with **purple** / **yellow** rail token meaning preserved from classic. |

Typography: `--gg-font-sans`, kickers at **type-grid-1** scale + `--gg-tracking-label`, titles **type-grid-2/3**, body **leading-body**. Plates use **`--gg-sign-panel`**, corners **`--gg-radius-r1`–`r3`** consistently.

---

## 6. CSS architecture

- All Next-regime rules scoped under a **single root** class (e.g. `.gg-next-root`) loaded only on `/workbench-next`.
- **No reliance** on classic `.workspace-*` class overrides for the primary layout; classic remains on legacy classes.
- Prefer **logical properties**, **8px grid**, **token variables** for borders, radii, strokes.

---

## 7. Completion criteria

- `/workbench-next` is **visually distinct** from `/` at a glance (structure + plate grammar + rail + diagram strip).
- Tokens only from `nycta-groovegraph-tokens.css` (+ `color-mix` on those tokens).
- Accessibility: focus states, separator `aria-label`, button labels unchanged in meaning.
- **Graphic-artist sign-off:** layout matches sections 4–6; no conflicting regime (no dark Studio13 map chrome unless brief explicitly asks).

---

## 8. Handoff

- **Implementer** wires React to existing `/api/sessions/*` routes; do not change API contracts in this task.
- **Animator** may later add **short** GSAP only if it reinforces interchange or plate reveal; default static.
