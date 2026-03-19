# GSAP Motion Reference

## Installation and registration

Baseline install:

```bash
npm install gsap @gsap/react
```

Per GSAP docs, GSAP and its plugins are available directly on npm, and plugins should be registered explicitly in module-based builds so they are not dropped during tree shaking. See [GSAP installation docs](https://gsap.com/docs/v3/Installation?tab=npm&module=esm&require=false&plugins=Draggable%2C+DrawSVGPlugin%2C+EaselPlugin%2C+Flip%2C+GSDevTools%2C+InertiaPlugin%2C+MotionPathHelper%2C+MotionPathPlugin%2C+MorphSVGPlugin%2C+Observer%2C+Physics2DPlugin%2C+PhysicsPropsPlugin%2C+PixiPlugin%2C+ScrambleTextPlugin%2C+ScrollTrigger%2C+ScrollSmoother%2C+ScrollToPlugin%2C+SplitText%2C+TextPlugin&ease=RoughEase%2C+ExpoScaleEase%2C+SlowMo%2C+CustomEase%2C+CustomBounce%2C+CustomWiggle).

Default registration rules:

- register `useGSAP` in React projects
- register only the plugins actually needed for production UI
- centralize registration if multiple surfaces reuse the same motion system
- do not repeatedly scatter plugin registration across unrelated components

## React and Next.js patterns

Use GSAP in client components only.

Preferred shape:

- component owns a `scope` ref
- `useGSAP()` creates the timeline
- selectors stay inside the scoped subtree
- cleanup is automatic through the hook integration

Prefer:

- `timeline()` for sequenced reveal systems
- `matchMedia()` for responsive motion variants
- `contextSafe()` when wiring callbacks that fire after the hook body

Avoid:

- global selectors
- layout reads inside hot loops
- scroll-linked motion without testing long pages and low-power devices

## Plugin map

### Core composition

- `Flip`: layout transitions, reordering, expand-collapse, card-to-detail state shifts
- `SplitText`: title choreography, staggered lines, controlled hero copy entrances
- `TextPlugin`: value interpolation where literal text change matters
- `ScrambleTextPlugin`: deliberate coded or signal-like transitions; use sparingly

### Diagram and route work

- `DrawSVGPlugin`: route drawing, diagram traces, topology reveals
- `MorphSVGPlugin`: shape changes between icons, states, or diagram forms
- `MotionPathPlugin`: moving tokens, stations, or indicators along curves
- `MotionPathHelper`: editor-style path tuning for prototypes and art direction

### Scroll orchestration

- `ScrollTrigger`: the default for scroll-linked sections, pinning, scrubbed reveals, and timeline activation
- `ScrollSmoother`: use only when smooth scrolling is materially part of the experience, not as a default garnish
- `ScrollToPlugin`: guided jumps between sections or story beats

### Gesture and physical interaction

- `Draggable`: tactile drag interactions
- `InertiaPlugin`: believable continuation after drag release
- `Observer`: wheel, touch, scroll, and gesture coordination
- `Physics2DPlugin` and `PhysicsPropsPlugin`: playful motion studies and bounded simulated dynamics

### Specialist and debug

- `GSDevTools`: debugging and tuning internal timelines
- `CustomEase`: primary custom easing authoring
- `CustomBounce`: bounce variants; depends on `CustomEase`
- `CustomWiggle`: wiggle variants; depends on `CustomEase`
- `RoughEase`, `ExpoScaleEase`, and `SlowMo`: special easing cases from `EasePack`
- `PixiPlugin` and `EaselPlugin`: only when the rendering stack actually requires them

## GrooveGraph design patterns

### New-regime motion

Use for authoritative, future-facing work:

- route lines drawing into place
- nodes or stations snapping into the grid
- section labels revealing in a measured stagger
- panels flipping or reflowing with `Flip`
- controlled scroll chapters via `ScrollTrigger`

Recommended plugin sets:

- architecture map: `DrawSVGPlugin`, `ScrollTrigger`, `SplitText`
- system storyboard: `Flip`, `ScrollTrigger`, `TextPlugin`
- guided exploration UI: `ScrollTrigger`, `ScrollToPlugin`, `Observer`

### Old-regime satire

Use for disorder, critique, or historical absurdity:

- jittered labels
- over-busy entrances
- awkward timing shifts
- contradictory arrow or note motion

Recommended plugin sets:

- critique panel: `SplitText`, `ScrambleTextPlugin`, `RoughEase`
- failure cartoon: `CustomWiggle`, `CustomBounce`, `Observer`

Keep satire readable. Chaos still needs structure.

## Performance rules

- animate `transform` and `opacity` before anything else
- use `will-change` sparingly and remove it if possible after motion settles
- batch scroll reveals instead of instantiating excessive independent triggers
- avoid large paint-heavy blur or filter animation as default style
- test pinned and scrubbed sections on long pages before declaring them finished
- use `quickSetter()` or shared timelines when many elements update rapidly

## Accessibility rules

- respect reduced motion preferences
- make state changes understandable without animation
- do not hide core information behind timing-dependent reveals
- avoid forced smoothness that makes orientation harder

Reduced motion pattern:

```ts
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if (reduceMotion) {
  gsap.set("[data-animate]", { clearProps: "all" });
} else {
  // run full motion system
}
```

## Art-direction heuristics

When asked for a motion concept, answer these:

1. What is the dominant motion metaphor?
2. What is the pacing curve?
3. Which moments deserve the strongest emphasis?
4. Which plugin set is the smallest correct set?
5. What must still work if motion is reduced or removed?

## Production stance

Default to a small, intentional GSAP footprint.

Use the full-capability registry only when:

- building a reusable motion foundation
- making a motion playground
- preparing a graphic-design or prototype environment where many plugin families will be explored

For most product slices, narrower imports are better than maximal imports.
