# Visual style guide — GrooveGraph Next

## Where the real spec lives

**Authoritative merged language (read this for art direction):**

- [`docs/design-language/FOUNDATION.md`](design-language/FOUNDATION.md)

**Archival sources and tokens:**

- `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/CANONICAL.md` — what to read; what is superseded
- `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/vignelli-subway-map-19721.jpg` — **primary visual reference** (1972 diagram)
- `graphic-design-agent-assets/MTA-Graphic_Deisgn_Standards/mta_style_guide_extracted_v3.md` — NYCTA manual notes
- `framework/src/visual-system/nycta-groovegraph-tokens.css` — **CSS custom properties** (canonical). Import: `@import "@groovegraph-next/framework/nycta-groovegraph-tokens.css";` from any workspace package that depends on `@groovegraph-next/framework`.

**Definitive interactive reference (HTML5, typography through CSS motion):**

- With the product dev server: `http://localhost:3000/design-system-styleguide.html` — source: `product/public/design-system-styleguide.html`

**Interactive animation reference (GSAP + ScrollTrigger, NYCTA tokens, 12 principles):**

- With the product dev server: `http://localhost:3000/animation-styleguide.html` — source: `product/public/animation-styleguide.html`

**Research workbench (OpenAI workspace, NYCTA tokens in `globals.css`):**

- Local: `http://localhost:3011/` redirects to `/workbench-next`; classic shell at `/classic` — package: `research/tools/openai-research-workspace`, `npm run dev:research-workspace` from repo root. Production: `https://groovegraph.s13.nyc/` → `/workbench-next`.

**External print reference (purchase / library):**

- [Standards Manual: NYCTA Graphics Standards Manual](https://standardsmanual.com/products/nyctacompactedition)

---

## One-sentence summary

New-regime GrooveGraph graphics follow **Vignelli-era NYCTA map grammar** (orthogonal + 45°, uniform trunk weight, parallel corridors, engineered radii, route color as meaning) and **NYCTA signage semantics** (identification / directional / informational, decision-point information only), translated to software per **`SOFTWARE_WAYFINDING_FOUNDATION.md`** in the same MTA assets folder.

---

## Quick token pointer

Hex and geometry live in **`framework/src/visual-system/nycta-groovegraph-tokens.css`**. Default canvas (UI and maps): **white** (light) / **near-black** (dark) — **no warm beige**. TypeScript mirror: **`framework/src/visual-system/tokens.ts`**.

---

## Use this system for

- Governance maps, routing charts, framework diagrams, operating-model visuals
- Map-like or route-like UI metaphors and campaign graphics for the “new regime”

---

## Motion

Directional, structure-bearing, `prefers-reduced-motion` safe — see `.cursor/skills/gsap-motion-system/SKILL.md`.

---

## Graph data visualization

Investigative clarity, progressive disclosure — see `.cursor/skills/graph-data-viz-system/SKILL.md`.

---

## Legacy satire regime

Whiteboard / editorial-cartoon language for **retrospective critique** only. Do not blend with new-regime NYCTA language unless contrast is the point.

---

## Review checklist

- Does the piece read as **order** (new regime) or **disorder** (satire), intentionally?
- Are **route colors** tied to **durable meaning**, not decoration?
- Do lines obey **map grammar** (angles, weight, parallels, explicit interchanges)?
- Would the composition work at a glance on a wall or a small screen?
- Are jokes carried by **structure and labels**, not random styling?
