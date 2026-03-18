# Headcount Serial Run 002

## Run

- test: `headcount-serial-release-packet`
- outcome: `PASS`
- final project: one-file SWA smoke-page parity revision that renders the existing API `body` field beneath the red status banner

## Selected revision

Mirror the existing smoke API `body` line on `product/swa-smoke/index.html` directly beneath the red `status` banner, using the same fallback copy already established by `product/app/page.tsx`, with no API contract change and no layout redesign.

## Handoff chain

### 1. Explorer

- set the minimum writable surface to `product/swa-smoke/index.html`
- used `product/app/page.tsx`, `product/app/api/smoke/route.ts`, `docs/HEADCOUNT.md`, and `docs/AZURE_BASELINE.md` as read-only references

### 2. Composer Meta

- fixed the contract:
  - change one static page only
  - do not edit the API route
  - do not edit the App Service page
  - do not redesign the smoke page
  - success means the explanatory `body` line appears under the red banner on the SWA smoke page

### 3. Graphic Artist

- constrained the visual move to one muted supporting line:
  - directly below the red status banner
  - same content column
  - subordinate treatment
  - no hierarchy drift or redesign

### 4. Implementer

- changed exactly one file: `product/swa-smoke/index.html`
- added a `body` text element under `#status`
- added the same fallback copy already used by the app page
- updated the fetch hydration to render `data.body`

### 5. Reviewer

- no findings
- the bounded one-file change preserved the existing fallback behavior and avoided layout drift

### 6. Tester

- pass
- strongest practical evidence gathered:
  - local static server run from `product/swa-smoke`
  - browser validation at `http://localhost:3001`
  - visible explanatory line rendered beneath the red status banner
- local cross-origin hydration from `http://localhost:3001` to `https://as-groovegraph-api.azurewebsites.net/api/smoke` was blocked by CORS, so fallback rendering is verified locally but deployed SWA hydration still requires environment-faithful validation

### 7. Hygienist

- pass
- no removal proposal
- the change introduced no scratch surfaces, dead files, or cleanup follow-up

### 8. Infrastructure Deployment

- recommended SWA-only release path for this slice
- preserved:
  - `rg-groovegraph`
  - `plan-groovegraph`
  - `appi-groovegraph`
  - alerting
  - `as-groovegraph-api`
- overwritten in principle:
  - `swa-groovegraph` only

## Release packet

### Scope

- one implementation file: `product/swa-smoke/index.html`
- no API shape change
- no page redesign

### User-visible result

- the static SWA smoke page keeps the current headline, red status banner, and image
- the page now also renders the existing explanatory `body` sentence directly beneath the red status banner

### Validation result

- local browser evidence: pass
- static fallback rendering: pass
- local remote-hydration check: blocked by CORS from `localhost`, so deployed SWA validation remains required
- reviewer: no findings
- hygiene pass on the changed surface: no action required

### Release path

1. run `scripts/deploy-swa-smoke.ps1`
2. verify the deployed `swa-groovegraph` homepage
3. confirm the explanatory line appears beneath the red status banner and hydrates from `as-groovegraph-api` without the localhost CORS limitation seen during local validation

### Rollback

- redeploy the previous known-good static bundle to `swa-groovegraph`
- no App Service rollback and no shared Azure resource rollback are required

## Rough slice cost reference

These are not billing figures. They are rough orchestration-reference estimates.

| Agent | Model | Measurement mode | Estimated tokens | Estimated cost |
|---|---|---|---:|---:|
| `explorer` | `GPT-5.4-mini` | `estimated` | 1800 | $0.0020 |
| `composer-meta` | `Composer 1.5` | `estimated` | 2500 | $0.0035 |
| `graphic-artist` | `GPT-5.4-mini` | `estimated` | 2100 | $0.0025 |
| `implementer` | `GPT-5.3-codex` | `estimated` | 3900 | $0.0055 |
| `reviewer` | `GPT-5.4-mini` | `estimated` | 2250 | $0.0025 |
| `tester` | `GPT-5.4-mini` | `estimated` | 2000 | $0.0020 |
| `hygienist` | `GPT-5.4-nano` | `estimated` | 1350 | $0.0013 |
| `infrastructure-deployment` | `GPT-5.4-mini` | `estimated` | 2400 | $0.0030 |
| Total | serial subagents | `estimated` | 18300 | $0.0223 |

Notes:

- values are midpoint-style rough references derived from the current `docs/HEADCOUNT.md` envelope and the actual lane mix used in this rerun
- orchestrator synthesis cost is still not metered by this runtime and is excluded from the subtotal above

## Judgment

This serial `headcount` rerun is stronger evidence than `001` for the current framework because:

- it exercises the full current lane set, including `hygienist`
- it converges on one real one-file revision
- it includes browser-visible validation rather than static inspection alone
- it proves the serial handoff chain can still stay bounded after the framework gained cleanup ownership
