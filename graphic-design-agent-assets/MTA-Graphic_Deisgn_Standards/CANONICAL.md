# Canonical MTA / NYCTA assets (GrooveGraph Next)

This folder is the **archival source** for scans, the 1972 diagram reference, and extracted manual notes. **Do not** treat every file as equally authoritative — use the list below.

## Authoritative (read these)

| File | Role |
|------|------|
| `vignelli-subway-map-19721.jpg` | **Primary visual reference** for route colors, uniform line weight, parallel spacing, 90°/45° geometry, large curve radii, station dots, interchange rings, land/water/park tone. |
| `mta_style_guide_extracted_v3.md` | **Primary text reference** for NYCTA Graphics Standards Manual content (sign types, grids, discs, arrows, plates, exit/transfer, glossary). |
| `SOFTWARE_WAYFINDING_FOUNDATION.md` | **Software translation** of signage discipline (identification / directional / informational, decision-point information, layout, motion restraint). |
| `nycta-groovegraph-tokens.css` | **Re-export** of the shared token sheet — canonical file: **`framework/src/visual-system/nycta-groovegraph-tokens.css`**. Apps: `@import "@groovegraph-next/framework/nycta-groovegraph-tokens.css";` |

## Repo-wide prose spec

| File | Role |
|------|------|
| `docs/design-language/FOUNDATION.mdc` | Merged design language: map grammar + manual rules + software + GrooveGraph regimes. |
| `docs/VISUAL_STYLE_GUIDE.mdc` | Short entry point and checklist; defers detail to FOUNDATION + this folder. |

## Superseded or archival (do not extend)

| File | Note |
|------|------|
| `mta_style_guide_extracted.md` | Early extract; use **v3** for manual structure. |
| `mta_style_guide_extracted_v2.md` | Intermediate extract; use **v3**. |
| `mta_style_guide_standards.css` | **Shim only** — re-exports `nycta-groovegraph-tokens.css` for old links. |
| `../styles.css` | Legacy **dark Studio13 theme** (other contexts); **not** the default NYCTA UI canvas (default canvas is white / dark per tokens). |

## Related agent metadata

- `../graphic-designer.md` — Studio13-oriented designer prompt; paths updated for this repository.
- `../mta-design-foundation.mdc` — Cursor rule fragment; see also `.cursor/rules/mta-design-foundation.mdc`.
