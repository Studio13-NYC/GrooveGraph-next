# Headcount serial evidence (consolidated)

Canonical human-readable evidence for the `headcount-serial-release-packet` test. Earlier separate files (`headcount-serial-run-001.md`, `headcount-serial-run-002.md`) were merged here to reduce duplication.

---

## Run 001 — App Service smoke (`product/app/page.tsx`)

### Run

- test: `headcount-serial-release-packet`
- outcome: `PASS`
- final project: one-file smoke-page release packet for rendering the existing API `body` field beneath the red status banner

### Selected revision

Render the existing `body` field from `product/app/api/smoke/route.ts` on `product/app/page.tsx` as subordinate explanatory copy beneath the red status banner, with no API contract change and no page redesign.

### Handoff chain

### 1. Explorer

- recommended the smallest credible revision: reuse the existing `body` field already served by `/api/smoke`
- identified `product/app/page.tsx` as the only writable implementation surface required for the real change
- treated `product/swa-smoke/index.html` as comparison context only, not part of the minimum implementation surface

### 2. Composer Meta

- fixed the contract:
  - only `product/app/page.tsx` may change
  - do not edit the API route
  - do not redesign the page
  - success means one additional explanatory line appears and nothing else materially changes

### 3. Graphic Artist

- constrained the visual move to one quiet supporting line:
  - directly below the red status banner
  - same content column
  - small, muted, subordinate treatment
  - no hierarchy drift or redesign

### 4. Implementer

- changed exactly one file: `product/app/page.tsx`
- added `body` to the local `SmokePayload` type
- restored fallback `body` copy for the local payload
- rendered `payload.body` beneath the red status banner in muted left-aligned text

### 5. Reviewer

- no findings
- called out one honest testing gap:
  - static review alone was not enough to confirm rendered hierarchy

### 6. Tester

- pass
- strongest practical evidence gathered:
  - successful `npm run build:product`
  - successful local app run
  - successful local `/api/smoke`
  - homepage HTML showing the explanatory line beneath the red status banner

### 7. Infrastructure Deployment

- recommended App Service-only release path for this slice
- preserved:
  - `rg-groovegraph`
  - `plan-groovegraph`
  - `appi-groovegraph`
  - alerting
  - `swa-groovegraph`
- overwritten in principle:
  - `as-groovegraph-api` only

### Release packet

#### Scope

- one implementation file: `product/app/page.tsx`
- no API shape change
- no visual redesign

#### User-visible result

- the smoke page keeps the current headline, red status banner, and image
- the page now also renders the existing explanatory `body` sentence directly beneath the red status banner

#### Validation result

- local build: pass
- local runtime evidence: pass
- static review: no findings

#### Release path

1. run `scripts/deploy-appservice-smoke.ps1`
2. verify:
  - `https://as-groovegraph-api.azurewebsites.net`
  - `https://as-groovegraph-api.azurewebsites.net/api/smoke`
3. confirm the explanatory line appears beneath the red status banner on the deployed App Service homepage

#### Rollback

- redeploy the previous known-good App Service package to `as-groovegraph-api`
- no shared Azure resource rollback is required

### Rough slice cost reference

These are not billing figures. They are rough orchestration-reference estimates.

| Agent | Model | Estimated tokens | Estimated cost |
| --- | --- | ---:| ---:|
| `explorer` | `GPT-5.4-mini` | 1960 | $0.0020 |
| `composer-meta` | `Composer 1.5` | 2500 | $0.0035 |
| `graphic-artist` | `GPT-5.4-mini` | 2100 | $0.0025 |
| `implementer` | `GPT-5.3-codex` | 3900 | $0.0055 |
| `reviewer` | `GPT-5.4-mini` | 1960 | $0.0025 |
| `tester` | `GPT-5.4-mini` | 2460 | $0.0020 |
| `infrastructure-deployment` | `GPT-5.4-mini` | 2400 | $0.0030 |
| **Total** | serial subagents | 17280 | $0.0210 |

Notes:

- where a subagent returned only a range or `unknown`, the estimate was normalized to the midpoint of the `headcount` reference envelope in `docs/HEADCOUNT.md`
- orchestrator synthesis cost is not included in the subtotal above

### Judgment

This serial `headcount` run succeeded at the thing it was designed to test:

- the handoff chain remained bounded
- later agents actually consumed earlier outputs
- the implementation stayed inside a one-file scope
- review and validation remained role-correct
- the final result reads like one coherent release packet rather than a pile of disconnected agent responses

---

## Run 002 — SWA static smoke (`product/swa-smoke/index.html`)

### Run

- test: `headcount-serial-release-packet`
- outcome: `PASS`
- final project: one-file SWA smoke-page parity revision that renders the existing API `body` field beneath the red status banner

### Selected revision

Mirror the existing smoke API `body` line on `product/swa-smoke/index.html` directly beneath the red `status` banner, using the same fallback copy already established by `product/app/page.tsx`, with no API contract change and no layout redesign.

### Handoff chain

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

### Release packet

#### Scope

- one implementation file: `product/swa-smoke/index.html`
- no API shape change
- no page redesign

#### User-visible result

- the static SWA smoke page keeps the current headline, red status banner, and image
- the page now also renders the existing explanatory `body` sentence directly beneath the red status banner

#### Validation result

- local browser evidence: pass
- static fallback rendering: pass
- local remote-hydration check: blocked by CORS from `localhost`, so deployed SWA validation remains required
- reviewer: no findings
- hygiene pass on the changed surface: no action required

#### Release path

1. run `scripts/deploy-swa-smoke.ps1`
2. verify the deployed `swa-groovegraph` homepage
3. confirm the explanatory line appears beneath the red status banner and hydrates from `as-groovegraph-api` without the localhost CORS limitation seen during local validation

#### Rollback

- redeploy the previous known-good static bundle to `swa-groovegraph`
- no App Service rollback and no shared Azure resource rollback are required

### Rough slice cost reference

These are not billing figures. They are rough orchestration-reference estimates.

| Agent | Model | Measurement mode | Estimated tokens | Estimated cost |
| --- | --- | --- | ---:| ---:|
| `explorer` | `GPT-5.4-mini` | `estimated` | 1800 | $0.0020 |
| `composer-meta` | `Composer 1.5` | `estimated` | 2500 | $0.0035 |
| `graphic-artist` | `GPT-5.4-mini` | `estimated` | 2100 | $0.0025 |
| `implementer` | `GPT-5.3-codex` | `estimated` | 3900 | $0.0055 |
| `reviewer` | `GPT-5.4-mini` | `estimated` | 2250 | $0.0025 |
| `tester` | `GPT-5.4-mini` | `estimated` | 2000 | $0.0020 |
| `hygienist` | `GPT-5.4-nano` | `estimated` | 1350 | $0.0013 |
| `infrastructure-deployment` | `GPT-5.4-mini` | `estimated` | 2400 | $0.0030 |
| **Total** | serial subagents | `estimated` | 18300 | $0.0223 |

Notes:

- values are midpoint-style rough references derived from the current `docs/HEADCOUNT.md` envelope and the actual lane mix used in this rerun
- orchestrator synthesis cost is still not metered by this runtime and is excluded from the subtotal above

### Judgment

This serial `headcount` rerun is stronger evidence than Run 001 for the current framework because:

- it exercises the full current lane set, including `hygienist`
- it converges on one real one-file revision
- it includes browser-visible validation rather than static inspection alone
- it proves the serial handoff chain can still stay bounded after the framework gained cleanup ownership
