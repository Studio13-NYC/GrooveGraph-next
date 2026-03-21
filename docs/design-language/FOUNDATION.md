# GrooveGraph Next — design language foundation

This document is the **single merged authority** for how GrooveGraph Next interprets NYCTA / Vignelli transit graphics for maps, diagrams, signage-shaped UI, and related artifacts.

**Physical and digitized sources** (archived under `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/`):

1. **`vignelli-subway-map-19721.jpg`** — 1972 New York City Subway diagram (Massimo Vignelli). Primary reference for **color**, **line weight**, **parallel corridors**, **curve language**, **symbols**, and **figure/ground** (land, water, parks).
2. **`mta_style_guide_extracted_v3.md`** — Normalized notes from the **NYCTA Graphics Standards Manual** (identification / directional / informational signs, type grids, discs, arrows, modular plates, exit/transfer, glossary). Use for **sign semantics** and **reproduction discipline** (“photographic precision”, no arbitrary redraw).
3. **`SOFTWARE_WAYFINDING_FOUNDATION.md`** (same folder) — How signage rules translate to **software**: decision-point information, hierarchy, motion restraint, map grammar as interface logic.

**Machine-readable tokens:** `framework/src/visual-system/nycta-groovegraph-tokens.css` — import in any workspace app via  
`@import "@groovegraph-next/framework/nycta-groovegraph-tokens.css";`  
(add `"@groovegraph-next/framework": "file:../framework"` or another correct relative path to `framework/` from that package’s `package.json`).  
Re-export next to map scans: `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/nycta-groovegraph-tokens.css`.  
**Index of what to read first:** `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/CANONICAL.md`

---

## 1. Map grammar (1972 diagram)

These rules are **non-negotiable** for new-regime map-shaped or route-shaped graphics:

- **Angles:** Lines are built from **horizontal**, **vertical**, and **45° diagonal** segments only. No organic geography, no arbitrary Bézier “hand” curves for route trunks.
- **Weight:** Primary route lines read as **one uniform trunk weight** across the system at a given scale. Thickness communicates “this is a line” — not individual line personality.
- **Parallel corridors:** When multiple routes share a path, they appear as **parallel tracks** with a **fixed gutter**, visually on the order of **half a line width** between centers — bundled, not merged into one ambiguous stroke.
- **Corners:** Bends use **large, consistent radii** (engineered arcs), not sharp kinks and not expressive swoops. The same radius family should repeat across a piece.
- **Color:** Color identifies **route families** or **durable service identity**, not mood or decoration.
- **Stations:** Simple **high-contrast dots** on the line; **interchanges** read as **deliberate junctions** (e.g. open ring or emphasized node) — transfer is **explicit**, never implied only by crossing lines.
- **Figure / ground:** **Neutral land** (same white / dark canvas as product — no warm substrate), **white water fields**, **flat grey park blocks** — high clarity, minimal texture.

For **software** (dashboards, graph views, workflows), translate map grammar into:

- **Rails** for primary journeys, **parallel lanes** for concurrent workflows, **explicit interchange states** when context changes (e.g. search → evidence → graph review).

---

## 2. Signage system (NYCTA manual, via v3 extract)

### Information only at the decision point

- **Never before, never after** — show what the rider needs **at** the branching moment.

### Three categories

1. **Identification** — names the place (station / screen / object).
2. **Directional** — leads toward the next decision (nav, breadcrumbs, primary actions).
3. **Informational** — schedules, rules, supporting detail (metadata, help, secondary copy).

### Typography (conceptual)

- One **neo-grotesk / Standard Medium** discipline: **Helvetica** first for web, then Arial and compatible sans fallbacks.
- **X-height** drives scale, not arbitrary point sizes.
- **Directional** copy stays **short** (manual: typically ≤ 2 lines on a directional plate at standard sizes).
- **Informational** copy may run longer but stays **modular** (manual: up to ~6 lines in the informational discipline at standard sizes).
- **Letter spacing** follows a modular system at sign scale; on screen, keep **tracking restrained** and **internally consistent** per surface.

### Modular plates

- Plate widths follow a **1 / 2 / 4 / 8** module pattern (in the manual, in foot units by height module); conceptually: **do not invent one-off banner sizes** — snap content to a small set of horizontal modules.
- **Black band** at the top of many plates is part of the **identity** of the sign system.

### Arrows and route discs

- **Arrow precedes** the inscription it governs; **route discs follow** directional text when both appear.
- **Discs:** route color field, **white** letters or numerals, **alphabetical then numerical** ordering when multiple discs sit together.
- Disc reproduction sizes in the manual (11 in / 5.5 in / 1.25 in at full scale) inform **relative** web sizes (`--gg-disc-sm|md|lg` in tokens), not literal inch sizing on screen.

### High-visibility exceptions

- **Exit** — **white on red** (attention and danger-adjacent clarity).
- **Transfer** — **black on yellow** (high notice, distinct from exit).

---

## 3. Color: map + UI

### Default canvas (UI and diagrams)

- **`--gg-surface-canvas`** / legacy **`--paper`:** **white** in light mode, **near-black** in dark mode (`prefers-color-scheme: dark`).
- **`--gg-map-land`:** aliases **`--gg-surface-canvas`** — diagram land fill uses the **same neutral base** as the app (no cream or beige).

**Route and map colors** are defined in **`nycta-groovegraph-tokens.css`**, aligned to the **1972 diagram** and commonly published **MTA** line colors (modern hex equivalents).  
**Do not** substitute ad hoc pastel route sets for authoritative new-regime maps unless a brief explicitly calls for a historical reproduction variant.

**Directional accent for software** uses the **same orange as the orange route family** (`--gg-route-orange` / `--gg-accent-directional`) so “accent” and “route color” stay **one system**.

**Map-like documents** and governance graphics use **neutral figure/ground** (land = canvas, water = white field, parks = grey); the **application shell** follows the same light/dark canvas unless the brief specifies otherwise.

---

## 4. Line and symbol tokens (implementation)

Use CSS / SVG variables from **`framework/src/visual-system/nycta-groovegraph-tokens.css`** (via the framework package import):

- `--gg-route-stroke-ui`, `--gg-route-stroke-ui-bold`, `--gg-route-stroke-hairline`
- `--gg-route-parallel-gap`
- `--gg-radius-r1` … `--gg-radius-r5` (five-step bend family, ~×√2 between steps)
- `--gg-disc-sm`, `--gg-disc-md`, `--gg-disc-lg`

**SVG:** `stroke-linecap: round; stroke-linejoin: round;` for route paths unless emulating a specific flat print edge.

---

## 5. Motion (cross-lane)

Motion is **directional** and **structure-bearing** — see `.cursor/skills/gsap-motion-system/SKILL.md`. It must respect **`prefers-reduced-motion`**.

---

## 6. Graph-shaped interfaces

Treat relationship views as **investigative**, not decorative — see `.cursor/skills/graph-data-viz-system/SKILL.md`. Map grammar still applies: **explicit junctions**, **bundled edges**, **color = durable meaning**.

---

## 7. Legacy satire regime

For **retrospective critique** only: whiteboard / editorial-cartoon language (dense annotation, tape, marker energy). **Do not** mix satire and new-regime NYCTA language in one asset unless **contrast is the subject**.

---

## 8. When sources appear to conflict

1. **Map geometry and color families** — defer to **`vignelli-subway-map-19721.jpg`** and `nycta-groovegraph-tokens.css`.
2. **Sign semantics, plate logic, exit/transfer** — defer to **`mta_style_guide_extracted_v3.md`**.
3. **Software behavior and hierarchy** — defer to **`SOFTWARE_WAYFINDING_FOUNDATION.md`**.
4. **GrooveGraph-specific motion or graph UX** — defer to the relevant Cursor **skills** after the above.

---

## 9. Maintenance

- If manual OCR extracts are corrected, update **`mta_style_guide_extracted_v3.md`** only; retire duplicate claims in older extract files (see `CANONICAL.md`).
- If tokens change, update **`framework/src/visual-system/nycta-groovegraph-tokens.css`** and **`framework/src/visual-system/tokens.ts`** together (keep TypeScript and CSS in sync).
