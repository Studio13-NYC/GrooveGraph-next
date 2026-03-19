# OpenAI Research Workspace Validation 001

## Scope

Validate the first GrooveGraph research tool implemented under `research/tools/openai-research-workspace/`.

This slice targets a text-first, OpenAI-centered research workspace built around:

- `Responses API`
- `Conversations API`
- built-in `web_search`
- application function tools
- local session artifact persistence

## Implementation summary

The workspace now includes:

- a standalone Next.js app under `research/tools/openai-research-workspace/`
- OpenAI client wiring for `responses` and `conversations`
- a four-pane research UI:
  - chat
  - sources
  - claims
  - graph candidates
- local JSON-backed persistence under `.data/`
- API routes for:
  - session creation
  - session retrieval
  - research turns
  - review decisions

## Validation evidence

### 1. Build validation

Command:

```powershell
npm run build:research-workspace
```

Observed result:

- pass
- Next.js production build completed successfully
- dynamic routes were generated for:
  - `/api/sessions`
  - `/api/sessions/[sessionId]`
  - `/api/sessions/[sessionId]/turn`
  - `/api/sessions/[sessionId]/decisions`

### 2. Local runtime surface

Command:

```powershell
npm run dev:research-workspace
```

Observed result:

- pass
- local dev server started successfully on `http://localhost:3011`
- homepage responded with HTTP `200`

### 3. Artist-seed session attempt

Validation method:

- POST to `/api/sessions` with seed query `Prince`

Observed result:

- partial pass
- request reached the workspace API correctly
- the expected blocker was surfaced: `Missing required environment variable: OPENAI_API_KEY`
- this is a configuration blocker, not a compile or routing blocker

### 4. Persistence surface

Observed result:

- pass at implementation level
- local JSON persistence is wired under `.data/`
- session-store logic exists for session creation, loading, saving, message append, and review decisions
- full runtime persistence through OpenAI-backed session creation remains blocked until `OPENAI_API_KEY` is configured

## Judgment

This is a successful bootstrap validation for the research tool:

- the workspace compiles
- the UI runs locally
- the session lifecycle routes are reachable
- the OpenAI integration fails in the correct place when credentials are absent

The remaining step to complete a true end-to-end artist-seed session is operational, not architectural:

1. set `OPENAI_API_KEY` in `research/tools/openai-research-workspace/.env.local`
2. restart the workspace
3. create a session such as `Prince`
4. send a research turn and verify sources, claims, and graph candidates persist
