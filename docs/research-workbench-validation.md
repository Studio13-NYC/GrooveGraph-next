# Research workbench validation (consolidated)

Evidence for the GrooveGraph **research workbench** (Next.js app under **`product/`**). Formerly `research/openai-research-workspace-validation.md` and paths under `research/tools/openai-research-workspace/`; consolidated here to avoid parallel files.

---

## Part A — Bootstrap (compile, routes, credential gate)

### Scope

Validate the first GrooveGraph research tool slice: text-first, OpenAI-centered workspace around `Responses API`, `Conversations API`, built-in `web_search`, application function tools, and local session artifact persistence.

### Implementation summary

- Next.js app under `product/`
- OpenAI client wiring for `responses` and `conversations`
- four-pane research UI: chat, sources, claims, graph candidates
- local JSON-backed persistence under `product/.data/`
- API routes for session creation, retrieval, research turns, review decisions

### Validation evidence

#### 1. Build validation

Command:

```powershell
npm run build -w @groovegraph-next/product
```

Observed result:

- pass — Next.js production build completed
- dynamic routes generated for `/api/sessions`, `/api/sessions/[sessionId]`, `/api/sessions/[sessionId]/turn`, `/api/sessions/[sessionId]/decisions`

#### 2. Local runtime

Command:

```powershell
npm run dev
```

Observed result:

- pass — dev server on `http://localhost:3000`, homepage HTTP 200

#### 3. Artist-seed session attempt

- POST `/api/sessions` with seed query `Prince`

Observed result:

- partial pass — request reached the API; blocker: `Missing required environment variable: OPENAI_API_KEY` (configuration, not compile/routing)

#### 4. Persistence surface

- pass at implementation level — session store wired; full OpenAI-backed flow blocked until `OPENAI_API_KEY` is set

### Judgment (Part A)

Successful bootstrap validation: workspace compiles, UI runs, session routes reachable, OpenAI integration fails in the correct place when credentials are absent. Completing a true end-to-end artist-seed session is operational: set `OPENAI_API_KEY` in `product/.env.local`, restart, create session, send a turn, verify persistence.

---

## Part B — First end-to-end artist-seed session

### Scope

Prove operational behavior after local OpenAI credentials were configured: session creation, OpenAI-backed turns, source/evidence capture, provisional graph-candidate persistence, review UI.

### Validation method

#### 1. Rebuild after runtime fixes

```powershell
npm run build -w @groovegraph-next/product
```

- pass — production build after schema/tool boundary fixes from live testing

#### 2. Local runtime with environment

```powershell
npm run dev
```

- pass — server on `http://localhost:3000`, `.env.local` active

#### 3. Session creation

- POST `/api/sessions` with seed query `Prince`
- pass — real session, durable OpenAI conversation id persisted

#### 4. Artist-seed turn

- POST `/api/sessions/[sessionId]/turn` with bounded discovery prompt (collaborators, releases, labels)
- pass — response persisted; sources, evidence, claims, entity/relationship candidates, session notes recorded

#### 5. Persistence inspection

- pass — session file under `.data/sessions/` with discography sources, claims, entities (e.g. Prince, The Revolution, NPG), relationships (`collaborated_with`, `released`, etc.)

#### 6. Local UI

- pass — session visible at `http://localhost:3000`, sources and notes panes, accept/defer/reject for graph candidates

### Runtime issues uncovered and fixed

In `src/lib/server/research-runtime.ts`:

1. Structured outputs: `optional()` in places that needed required-or-nullable values.
2. Function schema: `propertyNames` from `z.record()` rejected by OpenAI.

Corrections: nullable fields at the API boundary; flexible attributes as `{ key, value }[]` for tools, converted back to a local record for persistence.

### Judgment (Part B)

First full operational validation: builds, runs with credentials, OpenAI session and turns work, artifacts persist locally, review UI exposes graph candidates. The workspace is a real experimentation surface for discovery-first product definition, not only a scaffold.
