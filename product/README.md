# GrooveGraph product (research workbench)

This package is the **canonical GrooveGraph Next.js app**: the text-first investigation / graph-review workbench served at **`/`** in development and on App Service in production ([groovegraph.s13.nyc](https://groovegraph.s13.nyc/)).

## Environment

Copy `.env.example` → `.env.local` in **`product/`** (Next only loads this folder’s env).

- `OPENAI_API_KEY` (required for investigation turns)
- optional model vars per `.env.example`
- **Graph sync (TypeDB):** set `TYPEDB_*` (or `TYPEDB_CONNECTION_STRING`) per `.env.example`.
- After changing `.env.local`, **restart** `npm run dev`.

Optional ontology smoke scripts read **`product/.env.local` first**, then repo-root `.env.local` (see `ontology/README.md`).

## Run

From the **repository root**:

```powershell
npm install
npm run dev
```

Open **http://localhost:3000**. Production build: `npm run build -w @groovegraph-next/product`.

## Persistence

Session JSON lives under **`product/.data/`** (gitignored). Graph sync uses the configured backend; see repo **`ontology/README.md`** for TypeDB / ontology alignment.

## Validation history

Consolidated evidence: **`docs/research-workbench-validation.md`**.

## Deploy

App Service (standalone): from repo root, **`scripts/deploy-appservice-product.ps1`**. See **`docs/AZURE_BASELINE.mdc`**.

