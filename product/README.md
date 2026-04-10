# GrooveGraph product (research workbench)

This package is the **canonical GrooveGraph Next.js app**: the text-first investigation / graph-review workbench served at **`/`** in development and on App Service in production ([groovegraph.s13.nyc](https://groovegraph.s13.nyc/)).

## Environment

Copy `.env.example` → **`.env.local` in `product/`** — this is the **canonical** env file for local dev and for **`scripts/push-env-to-appservice.ps1`** / **`scripts/set-typedb-appservice.ps1`** (Azure App Service). A repo-root `.env.local` is optional for other tooling only.

- `OPENAI_API_KEY` (required for investigation turns)
- optional model vars per `.env.example`
- **Graph sync (TypeDB):** set `TYPEDB_*` (or `TYPEDB_CONNECTION_STRING`) per `.env.example`.
- After changing `.env.local`, **restart** `npm run dev`.

To **refresh the checked-in TypeQL snapshot** of your live database, from repo root run **`npm run dump:typedb-schema`** (reads `product/.env.local` first, then repo-root `.env.local`). Output: **`docs/DB-Schema-Export.typeql`**.

## Run

From the **repository root**:

```powershell
npm install
npm run dev
```

Open **http://localhost:3000**. **Graph viz option prototypes** (Sigma): **http://localhost:3000/viz-check**. Production build: `npm run build -w @groovegraph-next/product`.

## Persistence

Session JSON lives under **`product/.data/`** (gitignored). Graph sync writes to **TypeDB** when `TYPEDB_*` is set. The workbench applies its schema subset before writes (`product/src/lib/server/graph-persistence/typedb-workbench-schema.ts`). For a **clean database**, create or empty a DB in TypeDB Cloud / Console, point `TYPEDB_*` at it, then use **Sync to graph** (or run `npm run dump:typedb-schema` after defining schema elsewhere). Re-importing batch migration data into the same DB without a clean slate can duplicate instances—prefer a **new database name** for a fresh load. Live schema reference: **`docs/DB-Schema-Export.typeql`** (regenerate with `dump:typedb-schema`).

## Validation history

Consolidated evidence: **`docs/research-workbench-validation.md`**.

## Deploy

App Service (standalone): from repo root, **`scripts/deploy-appservice-product.ps1`**. See **`docs/AZURE_BASELINE.mdc`**.

