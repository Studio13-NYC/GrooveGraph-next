# Context Packet Builder

Use this skill whenever a task is about to be delegated to a subagent.

**Canonical schema and semantics:** `docs/CONTEXT_PACKETS.md`. This YAML is the **compact template** — if the doc gains or renames fields, update this block to match.

## Output template

```yaml
goal: >
  ...
why_now: >
  ...
scope:
  writable:
    - ...
  readable:
    - ...
inputs:
  files:
    - ...
constraints:
  - ...
reference_boundary:
  read_only:
    - ...
  writable:
    - ...
expected_output:
  format: ...
stop_conditions:
  - ...
follow_on_hints:
  - ...
```

## Rules

- Keep the packet short enough to act on immediately.
- Always separate writable from read-only surfaces.
- Define the exact output shape before delegating.
