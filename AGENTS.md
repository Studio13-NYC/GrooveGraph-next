# AGENTS.md

## Cursor Cloud specific instructions

### Overview

npm-workspaces monorepo with three packages. See root `package.json` for workspace definitions and all dev/build/start scripts.

### Running

- All commands run from the workspace root (`/workspace`).
- `npm run dev:product` — self-contained, no env vars needed.
- `npm run dev:research-workspace` — requires `OPENAI_API_KEY` for research turns; works without it for UI and session CRUD. Neo4j env vars are optional.
- Copy `research/tools/openai-research-workspace/.env.example` → `.env.local` in that directory to configure secrets.

### Build / Lint / Validate

- `npm run build:product` / `npm run build:research-workspace` — production builds.
- `npm run cleanup:check` — runs `npm prune` then `npx knip`. Exits non-zero on unused exports (expected; some Neo4j types are intentionally exported for future consumers).
- `npm run validate:repo`, `validate:docs`, `validate:visual-system`, `validate:framework` — file-presence checks.

### Caveats

- Node.js ≥22 is required (the environment ships v22.22.1).
- `package-lock.json` is the lockfile; always use `npm install`, not pnpm/yarn.
- The research workspace stores sessions as JSON files under `research/tools/openai-research-workspace/.data/sessions/` (auto-created at runtime).
- No Docker, database, or external service is required to run either app in dev mode.
