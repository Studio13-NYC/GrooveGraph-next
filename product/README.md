# Product

This package holds the **GrooveGraph Next smoke surface** and static **design/styleguide** assets served from `public/`.

- **Next.js app** (`app/`): CZA smoke homepage + `/api/smoke` for App Service validation.
- **Static SWA sibling** (`swa-smoke/`): parity smoke page for Azure Static Web Apps deploys (includes its own `cza-map.svg` copy for self-contained hosting).

GSAP demos in `public/*styleguide*.html` load GSAP from a CDN; the Next app does not depend on GSAP npm packages.

Heavier product implementation stays gated on framework and routing stability; this tree stays intentionally small until that work ships.
