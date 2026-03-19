# Decision Log

## 2026-03-18

### D001 - Clean-start repo

The framework is implemented in a new sibling repo rather than inside the legacy `GrooveGraph` repo.

### D002 - Seed monorepo shape

The repo starts as a seed monorepo with:

- `.cursor/`
- `docs/`
- `framework/`
- `product/`
- `prototypes/`
- `research/`

### D003 - Model hierarchy

The operating hierarchy is:

- `GPT-5.4` as orchestrator
- `Composer 1.5` as Cursor-native meta lane
- `GPT-5.4-mini` for review, exploration, tests, and visual direction
- `GPT-5.4-nano` for routing and compression
- `GPT-5.3-codex` for bounded implementation

### D004 - Graphic Artist subagent

Visual communication is a first-class part of the framework. A dedicated `Graphic Artist` subagent is included from the start.

### D005 - Default visual system

Authoritative "new regime" graphics use a vintage NYCTA-inspired signage and route-map language; legacy critique graphics use a whiteboard/cartoon satire language.

### D006 - Combined infrastructure-deployment lane

Azure environment understanding and deployment ownership stay in one combined `infrastructure-deployment` subagent rather than being split into separate infrastructure and deploy lanes.

### D007 - First-class usage accounting

Rough slice-level cost reference is a first-class framework concern. Agents should return a lightweight `cost_summary`, and the orchestrator should sum those values without pretending the result is formal accounting.

### D008 - Hygienist lane

Cleanup analysis is a first-class lane rather than an informal shell ritual. A dedicated `hygienist` subagent owns `npm prune`, `npx knip`, and proposal-first removal guidance, using `GPT-5.4-nano` because the work is bounded triage rather than architecture.

### D009 - Full traceability stance

Local JSONL cost summaries are necessary but not sufficient. The framework now explicitly distinguishes rough local slice-cost telemetry from full observability and treats structured identifiers, stage-level runtime logs, and Application Insights-backed correlation as the default direction for end-to-end traceability.

### D010 - ProductManager lane

Discovery-first product definition is now a first-class lane rather than an implicit orchestrator duty. A dedicated `product-manager` subagent owns legacy-product archaeology, hero-workflow framing, and recommendations for flexible graph persistence before ontology hardening, using `GPT-5.4-mini` because the work is bounded synthesis rather than top-level final judgment.
