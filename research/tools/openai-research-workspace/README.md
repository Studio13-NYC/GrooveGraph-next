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
- for Neo4j persistence: `NEO4J_URI`, `NEO4J_USERNAME` (or `NEO4J_USER`), `NEO4J_PASSWORD`, and optionally `NEO4J_DATABASE` (defaults to `neo4j`)

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

**Neo4j (optional):** With Aura credentials in `.env.local`, use **Sync to graph** in the Graph review panel. The server upserts **accepted** entities and relationships only (and optionally **deferred** if **Include deferred** is checked). Items still **proposed** are not written — accept them in Graph review first, then sync. After sync, the UI shows how many nodes/edges were written and session acceptance counts.

**Finding data in Neo4j Browser:** Aura often sets **`NEO4J_DATABASE`** to your **instance id** (not `neo4j`). Pick that database in the Browser sidebar (or `:use <name>`) before `MATCH` queries; otherwise you will see an empty graph. Entities use the **`Entity`** label; `displayName` / `nameNorm` hold searchable text (e.g. Paul Weller → `nameNorm` `paul weller`).

**Neo4j Bloom (`Artist` / `IS_A` / `EntityType`) vs research sync:** Bloom searches like **`Artist name: paul weller`** match a **different subgraph** than the workbench. This app does **not** create `Artist`, `IS_A`, or `EntityType` nodes — those come from your Bloom project / ontology or other loaders on the same Aura database. **Sync to graph** only writes **`Entity`**, **`ResearchSession`**, **`GRAPH_REL`**, and **`SESSION_INCLUDES_ENTITY`**. Rich triplet data (albums, bands, influences, etc.) appears on **`Entity`** nodes and **`GRAPH_REL`** edges, not on the `Artist` node Bloom shows by default. The same person can exist as **two nodes** (`Artist` and `Entity`) until a later **normalization** step links or merges them (PRD).

**Cypher to inspect workbench data** (Browser or Bloom “Cypher” / query):

```cypher
MATCH (e:Entity)
WHERE toLower(e.displayName) CONTAINS 'paul'
OPTIONAL MATCH (e)-[r:GRAPH_REL]-(other:Entity)
RETURN e, r, other
LIMIT 80
```

**CLI check** (from this directory): `npm run verify-neo4j -- "paul weller"` — lists matching `Entity` rows and total entity count.

Each entity is matched in order: prior `sessionId:candidateId` key, overlapping `externalIds`, then normalized `displayName` + `provisionalKind`; matching nodes are merged with new aliases, evidence ids, and attributes. Labels: `ResearchSession`, `Entity`; relationship types: `SESSION_INCLUDES_ENTITY`, `GRAPH_REL`.

## Validation notes

See:

- `research/openai-research-workspace-validation.md` for bootstrap and first true end-to-end session evidence
