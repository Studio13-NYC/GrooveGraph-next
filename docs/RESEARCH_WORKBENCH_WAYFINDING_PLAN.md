# Research Workbench Wayfinding Plan

> **Architectural note (2026):** The **interchange / route-strip** metaphor below is **superseded** for product direction by the **manual-first** model in [`docs/design-language/FOUNDATION.md`](design-language/FOUNDATION.md) (§ Context split), [`docs/design-language/WORKBENCH_VOCAB.md`](design-language/WORKBENCH_VOCAB.md), and [`docs/design-language/GRAPHIC_ARTIST_WORKBENCH_NEXT_INSTRUCTIONS.md`](design-language/GRAPHIC_ARTIST_WORKBENCH_NEXT_INSTRUCTIONS.md). Keep this document as **historical context** for the live-site critique and early lane-based implementation; new work should **not** reintroduce transit nouns in UI copy.

## Purpose

This document turns the live-site critique of `https://groovegraph.s13.nyc` into two operational artifacts:

1. an execution brief for `graphic-artist`
2. an implementation-ready change plan for the current research workbench UI

The goal is not to add more S13/MTA styling on top of the product. The goal is to make Studio13 / NYCTA-style wayfinding fundamental to the product's information architecture, hierarchy, and interaction model.

## Current read

The live workbench already has strong raw material:

- neutral white canvas
- black rule and border system
- Helvetica / Arial typography
- restrained editorial tone
- a promising left/right split between investigation and review
- triplet propositions that already feel native to GrooveGraph

What is missing is route logic. The page still reads as a stack of bounded dashboard panels rather than a signed path from question to evidence to review.

## Core direction

Redesign the GrooveGraph research workbench as a research interchange rather than a boxed dashboard.

The page should answer three questions immediately:

1. where am I
2. what is this
3. what do I do next

That requires a stricter ordering:

1. identification
2. direction
3. information

## Execution Brief For `graphic-artist`

### Design intent

Treat the workbench as a civic knowledge instrument. The page should feel like a signed transit surface for moving from an active investigation into reviewed graph structure. GrooveGraph is the network name. The current session is the place the user is in. The left lane is the research route. The right lane is the graph review route. Supporting notes and sources exist to aid decisions, not to compete with the main lanes.

### Design principles

- Lead with identification before directional controls or supporting copy.
- Make the selected session more important than the product shell.
- Use black, white, and orange as the primary system language.
- Reserve green and red for review state only.
- Reserve blue for citations, links, and edit affordances only.
- Use rails, sign plates, grouping, and typography before color.
- Treat route lines, bends, and interchanges as structural design language, not decorative garnish.
- Use a small repeated family of line weights and bend radii so the system feels engineered.
- Let shared workflows read like bundled corridors and handoffs read like interchanges.
- Reduce repeated helper text and repeated metadata before adding new styling.
- Keep motion directional, short, and informational.

### Section-by-section guidance

#### Header

Rebuild the header as the primary identification band.

- Demote `GrooveGraph Research Workbench` from the dominant object when a session is active.
- Promote the active session title to the main `h1`.
- Keep GrooveGraph or the workbench name as the system label above or beside the active session.
- Convert `New Session` and `Past Sessions` into directional modules inside one shared top plate instead of two admin cards.
- Add a concise status line that can carry current route, last updated state, or active review counts.

#### Route strip

Introduce a visible stage strip below the header.

- Show the current route through the work.
- Start with a simple sequence such as `Session`, `Investigation`, `Evidence`, `Graph Review`.
- Highlight the active stage using orange, not multiple competing colors.
- Allow compact counts for messages, sources, triplets, and claims.

Route-strip geometry rules:

- use the strip like a trunk line, not like breadcrumb text
- keep segment weights and spacing consistent
- use a small repeated radius family if the strip bends or branches in future iterations
- if investigation and review are shown as simultaneous lanes, make the split read like a deliberate route fork

#### Left lane

Treat the left column as the investigation route.

- Rename `Chat` to something role-based such as `Investigation` or `Ask`.
- Keep the composer and conversation as the primary surface.
- Fold `Session Notes` and `Sources` into a subordinate evidence-support zone.
- Make the lane feel like one route with supporting stops, not three equal cards.

#### Right lane

Treat the right column as the graph review route.

- Rename `Graph Candidates` to something more procedural, such as `Proposed Relationships` or `Graph Review`.
- Keep `Claims` subordinate unless the user is directly reviewing claims.
- Make decisions read as governed review actions, not generic card buttons.
- Use stronger route logic for accepted, deferred, and rejected states.

#### Candidate review surfaces

Redesign triplet cards as review tickets.

- The proposition itself is the identification layer: subject, verb, object.
- Status and confidence are secondary informational signals.
- Actions are directional controls attached to the governed proposition.
- Aliases, provenance, and supporting details should disclose progressively and not compete with the main proposition.

Map-grammar translation:

- triplet relationships should eventually read like engineered route segments, not loose text connectors
- bundled or related relationships should be able to share corridor logic and spacing
- hub entities should feel like interchanges where multiple route families meet
- edge color should represent durable relationship families only when the meaning persists

#### Evidence support

Treat notes and sources as supporting evidence, not as peer destinations.

- Sources should surface quantity and relevance even when collapsed.
- Source title, provenance, URL, and citation should be separated clearly by role.
- Notes should read as field notes tied to the current investigation, not as generic side output.

### Preserve / remove / change

#### Preserve

- neutral canvas base
- black border and rule structure
- Helvetica / Arial typographic discipline
- overall editorial seriousness
- left/right workspace split
- triplet proposition structure

#### Remove

- equal-weight card stacking across all sections
- decorative panel identity based on section color
- repeated helper copy that slows orientation
- dashboard-like sameness between primary and supporting areas
- colored dots that do not carry stable semantics

#### Change

- make the active session the primary identification object
- add visible route staging to the page
- turn columns into named lanes with clear jobs
- move notes and sources under evidence support
- make orange the dominant directional accent
- tighten state color semantics across the whole page

### Motion guidance

- Use motion only to clarify sequence, focus, or route changes.
- Header elements should reveal in order: system label, active session, route strip, controls.
- Lane sections should snap or align into place rather than float independently.
- Review-state changes should use short emphasis transitions, not glow or bounce.
- Respect reduced motion and preserve full comprehension without animation.

### Acceptance criteria

- A first-time viewer can identify the active investigation within a few seconds.
- The page reads as a route through research and review rather than a dashboard.
- Orange is the dominant directional accent and is used consistently.
- Green and red only describe review outcomes.
- Notes and sources clearly support the investigation lane.
- Candidate cards prioritize proposition clarity over metadata density.
- The workbench feels like a GrooveGraph-native product language, not a themed prototype.

## Implementation-Ready Plan

### Scope

This plan is intentionally bounded to the current UI shell:

- `research/tools/openai-research-workspace/app/page.tsx`
- `research/tools/openai-research-workspace/app/globals.css`

Do not change the session data model, research runtime, or turn orchestration in this pass.

### High-impact surfaces

#### 1. Header shell

Current issue:

- the header identifies the product before the current investigation
- `New Session` and `Past Sessions` still behave like separate utility cards

Change:

- create a true identification band
- promote `selectedSession.title` to the main heading when present
- demote product naming to a system label
- visually connect session creation and session selection to the active route

#### 2. Stage / route strip

Current issue:

- the page lacks a visible directional grammar between research and review

Change:

- add a dedicated route strip below the header
- include stage labels and compact counts
- treat this strip as the main orientation device after the session title

#### 3. Lane wrappers

Current issue:

- `Panel` makes every section feel interchangeable

Change:

- replace or evolve `Panel` into a more semantic lane wrapper
- use props such as `tone`, `railColor`, or `role` instead of decorative `accent`
- support dominant and subordinate plate treatments

#### 4. Investigation lane

Current issue:

- `Chat`, `Session Notes`, and `Sources` read like three sibling panels

Change:

- create one dominant investigation surface
- keep chat primary
- group notes and sources under a single evidence-support block
- preserve current behavior while changing hierarchy and naming

#### 5. Graph review lane

Current issue:

- `Graph Candidates` and `Claims` do not read as one review system

Change:

- make the right side a review lane
- preserve triplet editing and review logic
- unify headers, action clusters, and status treatment
- keep claims subordinate unless actively focused

#### 6. Action and state primitives

Current issue:

- color and action semantics are overloaded and distributed ad hoc

Change:

- standardize action styles by role: primary direction, secondary support, review acceptance, review rejection, link
- constrain green and red to review state
- constrain blue to citation and link behavior

### Recommended component pass

Keep this pass mostly inside `page.tsx`, but introduce small local helper components first.

Recommended helper components:

- `WorkspaceHeader`
- `StageRouteStrip`
- `LaneSection`
- `EvidenceSupportSection`
- `ReviewItemHeader`

This is enough structure to land the hierarchy change before any large extraction into separate files.

### CSS and token changes

Move the styling system from route-color-first to semantic-first tokens.

#### Foundation

Introduce or clarify tokens for:

- background
- surface
- strong surface
- text
- muted text
- divider
- strong divider

#### Semantic accents

Keep these meanings stable:

- orange: direction, active stage, emphasis
- green: accepted
- red: rejected
- blue: links, citations, edit affordances
- neutral: most structural surfaces

#### Structural classes

Add reusable classes for:

- interchange header
- route strip
- lane shell
- lane header
- evidence support stack
- review rail
- active session button
- route trunk
- branch lane
- interchange marker
- radius tokens for repeated turns

### Suggested implementation order

1. Update tokens and global shell in `app/globals.css`.
2. Rebuild the header around active-session identification.
3. Add the route strip.
4. Replace `Panel` chrome with lane-based wrappers.
5. Recast the left side into investigation plus evidence support.
6. Recast the right side into graph review plus subordinate claims.
7. Tighten responsive behavior once the new hierarchy is stable.

### Risks

- The page uses extensive inline styles, so visual drift will spread unless the first pass introduces reusable classes.
- A blunt `Panel` rewrite could make everything feel uniform again unless dominant vs support roles are explicit.
- Notes and sources should only be merged visually, not at the data-model level.
- Blue is currently overloaded and must be constrained deliberately.

### Not in scope yet

- session schema changes
- API changes
- research runtime changes
- triplet-edit persistence changes
- graph visualization redesign beyond current candidate and claim surfaces

## Recommended next artifact

After this brief, the best next step is a bounded UI implementation slice that lands:

1. active-session-first header
2. route strip
3. lane-based section wrappers
4. evidence-support regrouping
5. stricter color semantics

That single slice should be enough to make the S13 / MTA system feel structural instead of decorative.
