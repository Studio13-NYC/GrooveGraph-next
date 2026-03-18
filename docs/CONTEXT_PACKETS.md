# Context Packets

## Purpose

Every delegation should carry a packet. Packets prevent vague handoffs, context bloat, and accidental scope drift.

## Required fields

| Field | Meaning |
|---|---|
| `goal` | Exact outcome required from the subagent |
| `why_now` | Why this delegation is happening now |
| `tracking` | Optional slice-tracking metadata if the runtime wants grouped cost rollups |
| `scope` | Allowed files, directories, or research boundary |
| `inputs` | Files, docs, examples, or prior findings to use |
| `constraints` | Rules, non-goals, and validation requirements |
| `reference_boundary` | What is read-only reference vs writable target |
| `expected_output` | Exact output format to return |
| `stop_conditions` | When the subagent should stop and hand back |
| `follow_on_hints` | Likely next consumer or next step |

## Packet template

```yaml
goal: >
  <Exact deliverable>
why_now: >
  <Why this task is being delegated now>
tracking:
  session_id: <session-id-optional>
  chunk_id: <chunk-id-optional>
  parent_chunk_id: <parent-chunk-id-optional>
  measurement_mode: <exact|estimated|unknown>
scope:
  writable:
    - <path or directory>
  readable:
    - <path or directory>
inputs:
  files:
    - <path>
  docs:
    - <path or URL>
  prior_findings:
    - <short note>
constraints:
  - <constraint>
reference_boundary:
  read_only:
    - <legacy or external references>
  writable:
    - <new framework surface>
expected_output:
  format: <bullets|table|patch|brief|review>
  must_include:
    - <item>
stop_conditions:
  - <condition>
follow_on_hints:
  - <next likely consumer>
```

## Example packet: `graphic-artist`

```yaml
goal: >
  Produce a first-pass campaign poster for the new regime visual system.
why_now: >
  We need a persuasive graphic that communicates governance clarity.
tracking:
  session_id: visual-system-rollout
  chunk_id: graphic-brief-001
  measurement_mode: estimated
scope:
  writable:
    - assets/
    - docs/
  readable:
    - docs/VISUAL_STYLE_GUIDE.md
    - research/
inputs:
  files:
    - docs/VISUAL_STYLE_GUIDE.md
  prior_findings:
    - "Use NYCTA-derived map language for authoritative graphics."
constraints:
  - Keep the tone calm and civic.
  - Avoid generic SaaS visual language.
reference_boundary:
  read_only:
    - legacy GrooveGraph repo
  writable:
    - GrooveGraph Next repo
expected_output:
  format: brief
  must_include:
    - composition
    - title treatment
    - palette
    - generation prompt
stop_conditions:
  - A production-ready image brief exists.
follow_on_hints:
  - "Next handoff may go to image generation."
```

## Packet quality checklist

- Is the scope narrow enough?
- Is the output format explicit?
- If tracking is present, is it consistent enough for later rollups?
- Is the writable surface clear?
- Does the packet say when to stop?
- Can the next agent use the output without re-asking basic questions?
