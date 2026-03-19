# OpenAI Research Workspace Validation 002

## Scope

Validate the first true end-to-end artist-seed session for `research/tools/openai-research-workspace/` after local OpenAI credentials were configured.

This pass is specifically concerned with proving that the workspace is no longer only bootstrapped, but operational across:

- session creation
- OpenAI-backed research turns
- source and evidence capture
- provisional graph-candidate persistence
- visible review surfaces in the local UI

## Validation method

### 1. Rebuild after runtime fixes

Command:

```powershell
npm run build:research-workspace
```

Observed result:

- pass
- Next.js production build completed successfully
- the research workspace compiled after fixing the OpenAI schema/tool boundary issues uncovered by live runtime testing

### 2. Local runtime with environment loaded

Command:

```powershell
npm run dev:research-workspace
```

Observed result:

- pass
- local dev server started successfully on `http://localhost:3011`
- Next.js reported `.env.local` as an active environment

### 3. Session creation

Validation method:

- `POST /api/sessions` with seed query `Prince`

Observed result:

- pass
- the workspace created a real research session
- a durable OpenAI conversation id was persisted with the session

### 4. Artist-seed turn execution

Validation method:

- `POST /api/sessions/[sessionId]/turn` with a bounded discovery prompt asking for Prince collaborators, major releases, and labels

Observed result:

- pass
- the turn completed successfully against the OpenAI-backed runtime
- the assistant response was persisted into the session
- the runtime recorded source documents, evidence snippets, claims, entity candidates, relationship candidates, and session notes

### 5. Persistence inspection

Observed result:

- pass
- a local session file was written under `.data/sessions/`
- the saved session contained:
  - official Prince discography sources
  - evidence snippets tied to those sources
  - proposed claims
  - provisional entities such as `Prince`, `The Revolution`, `The New Power Generation`, and relevant labels
  - provisional relationships such as `collaborated_with`, `released`, and `released_through`

### 6. Local UI inspection

Validation method:

- open `http://localhost:3011`
- inspect the live session in the browser

Observed result:

- pass
- the `Prince` session was visible in the workspace
- source links rendered in the sources pane
- session notes rendered in the notes pane
- accept/defer/reject controls were visible for provisional graph candidates

## Runtime issues uncovered and fixed

Live validation surfaced two real API-schema mismatches in `src/lib/server/research-runtime.ts`:

1. OpenAI structured outputs rejected `optional()` fields in places that needed required-or-nullable values.
2. OpenAI function schema validation rejected the `propertyNames` output generated from `z.record()` for flexible entity attributes.

The implementation was corrected by:

- replacing those tool/output fields with nullable values at the API boundary
- changing flexible attributes to an array of `{ key, value }` pairs for tool transport
- converting those pairs back into a local record for session persistence

## Judgment

This is the first full operational validation of the research workspace:

- the workspace builds
- the workspace runs locally with configured credentials
- OpenAI-backed session creation works
- OpenAI-backed research turns complete
- discovery artifacts persist locally
- the review UI exposes the resulting graph candidates inside the dev environment

The research workspace is now a real experimentation surface for GrooveGraph's discovery-first product definition, not just a scaffold.
