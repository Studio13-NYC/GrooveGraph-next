# OpenAI Research Workspace

This research tool is the first GrooveGraph experimentation surface for a text-first investigation workflow.

It is intentionally housed under `research/` so the team can try real OpenAI-centered interactions before promoting any workflow into the eventual `product/` surface.

Status:

- bootstrap implementation complete
- validated end to end with a real local artist-seed session
- currently proven with a `Prince` session that persisted sources, evidence, claims, and provisional graph candidates

## What it does

- starts a durable artist-seed research session
- uses the OpenAI `Responses API` with a persisted conversation
- enables built-in `web_search`
- records sources, snippets, claims, and graph candidates
- lets you accept, reject, or defer provisional items

## Environment

Copy `.env.example` to `.env.local` and set:

- `OPENAI_API_KEY`
- optionally `OPENAI_RESEARCH_MODEL`
- optionally `OPENAI_RESEARCH_EXTRACTION_MODEL`

## Run

From the repo root:

```powershell
npm run dev:research-workspace
```

The workspace runs on `http://localhost:3011`.

### UI routes

| Route | Purpose |
|-------|---------|
| `/` | **Research workbench** (default): NYCTA manual-first plates (`--gg-sign-band`, session index, split control — **no** module-legend strip per PRD). **Evidence:** Field notes + Sources are **stacked** collapsible sections (notes open, sources closed by default), each independently scrollable; **Claims** uses the same **height band** (`--gg-workbench-module-max-h`). Briefs: `docs/design-language/FOUNDATION.md`, `GRAPHIC_ARTIST_WORKBENCH_NEXT_INSTRUCTIONS.md`, `FIGMA_MCP.md`, `docs/product/RESEARCH_WORKBENCH_PRD.md`. Legacy paths `/workbench-next` and `/classic` **308-redirect** to `/`. |

Production: [groovegraph.s13.nyc](https://groovegraph.s13.nyc/) serves this app on App Service; deploy with `.\scripts\deploy-appservice-research-workbench.ps1` from the repo root (deploy may lag this repo).

## Persistence

Session artifacts are stored locally under `.data/` and are ignored by git.

## Validation notes

See:

- `research/openai-research-workspace-validation.md` for bootstrap and first true end-to-end session evidence
