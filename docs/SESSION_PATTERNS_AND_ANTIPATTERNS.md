# Session patterns and antipatterns (reflection)

Concise notes from debugging TypeDB env, graph status, and related work. No secrets; rotate credentials if they ever appeared in logs or chat.

## Patterns (what worked)

- **Separate symptoms from causes**: HTTP `200` on `/api/sessions/.../graph/viz` or `/graph-backend-status` does not imply the UI is healthy; client errors (e.g. Sigma) and server JSON must be read independently.
- **Status semantics**: For graph backend, `configured: false` + `reachable: false` means **`getTypeDbConfig()` is null** (no usable env), not “TypeDB is down.” “Unreachable” requires `configured: true` and a failed health check.
- **Connection string parsing**: Prefer splitting credentials from the host at `@https://` / `@http://` so passwords can contain `@` or `:`; keep a legacy regex only as fallback.
- **Next.js + env**: Call `loadEnvConfig` from `@next/env` with the directory that contains `next.config` so `.env.local` is loaded relative to the app package, not only `process.cwd()`.
- **Bracket access for secrets**: Use `process.env["KEY"]` for server-side TypeDB vars so bundlers do not inline them incorrectly.
- **When `process.env` is empty or unwritable**: Parse `product/.env.local` into an in-memory map (same line rules as `scripts/`) and merge with `process.env` for reads; do not rely on `process.env[key] = value` alone if the runtime behaves like a frozen proxy.
- **User-facing diagnostics**: Prefer a single boolean (e.g. `connectionStringEmpty`) and a clear `message` over shipping large diagnostic payloads to the client.
- **`.env.example` contract**: Document `TYPEDB_CONNECTION_STRING` **or** `TYPEDB_USERNAME` / `TYPEDB_PASSWORD` / `TYPEDB_ADDRESS` / `TYPEDB_DATABASE`; one-line URL must be non-empty after `=`.
- **Local vs cloud secrets**: Developers use **`product/.env.local`** (not committed). **Cursor Cloud Agents** should use **dashboard “My Secrets”** with the **same variable names** so they appear on `process.env` when the cloud runtime injects them; scripts under `scripts/` merge disk env then `process.env` per `scripts/lib/typedb-env.mjs`.

## Antipatterns (what burned time)

- **Assuming “database connectivity”** when the stack trace points at a **client library** (e.g. Sigma `node type "circle"`) or when the API already returns success.
- **Strict single regex** for `typedb://` URLs that breaks on real passwords (special characters, encoding).
- **Wrong `.env` keys**: `connectionString`, `username =`, `addresses = [...]` — app only reads documented names; spaces around `=` are not valid for dotenv-style `KEY=value`.
- **Empty value**: `TYPEDB_CONNECTION_STRING=` with nothing after `=` parses as “key present, empty value” and looks like “not configured” everywhere.
- **Commenting out** the only valid `TYPEDB_CONNECTION_STRING` while leaving a duplicate under a non-standard key.
- **Leaving debug instrumentation** (ingest URLs, verbose NDJSON) in route handlers after the fix is verified.
- **Over-instrumenting before a minimal read**: curl `/api/graph-backend-status` and reading `message` + shape often narrows the problem faster than many hypotheses.
- **Assuming Cloud Agent secrets reached the shell**: If `TYPEDB_*` are unset in `process.env` and `product/.env.local` is absent, tools will report “not configured” even when secrets exist in the Cursor UI—verify the cloud job type and injection behavior before debugging TypeDB itself.

## Quick checks

- `GET /api/graph-backend-status` — expect `configured` / `reachable` / `database` when TypeDB is set and healthy.
- If `connectionStringEmpty: true` — fix `.env.local` so the line has a full one-line URL or use the four separate vars.
- After changing `.env.local`, restart dev or rely on Recheck; confirm Next picked up the file.
