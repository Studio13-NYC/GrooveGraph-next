# Artifacts

Ephemeral outputs from debugging, QA, and manual or automated UI testing. **Do not** put secrets here; scrub before sharing.

| Path | Purpose |
|------|---------|
| `logs/` | NDJSON or text logs worth attaching to issues or PRs (most `*.log` files stay gitignored; see `.gitignore` exceptions). |
| `screenshots/` | Playwright captures, manual test screenshots, before/after images (binary files are gitignored by default). |

Other subfolders (for example `exports/`, `traces/`) can be added as needed. Prefer **`.jsonl`** or **`.ndjson`** for new structured logs so they are not caught by the root `*.log` rule if you want them tracked without a `.gitignore` exception.

Cursor may still write `debug-*.log` under **`.cursor/`** during a session; copy anything you need into `artifacts/logs/` and commit only after review.
