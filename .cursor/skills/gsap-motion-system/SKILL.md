---
name: gsap-motion-system
description: Deep GSAP motion direction for GrooveGraph Next. Use when the user mentions GSAP, motion design, animation systems, ScrollTrigger, SplitText, draggable interactions, or when the `graphic-artist` lane needs web-native motion guidance for React or Next.js surfaces.
---
# GSAP Motion System

Use this skill when a visual direction needs to become an actual motion system for the web.

## Outcomes

Return:

- motion concept
- interaction model
- GSAP plugin plan
- React or Next.js implementation pattern
- performance and accessibility guardrails

## Default stack

Install:

```bash
npm install gsap @gsap/react
```

Default imports:

```ts
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
```

Register plugins explicitly so build tools do not tree-shake them away.

## GrooveGraph motion stance

For GrooveGraph Next, motion should feel:

- directional rather than decorative
- information-bearing rather than ambient
- deliberate, paced, and legible
- sharp enough to clarify hierarchy without turning the UI into a demo reel

New-regime motion language:

- route drawing
- map-like reveals
- station-stop pacing
- snapping transitions
- measured scroll-linked progression
- strong before/after state changes with clean easing

Old-regime satire mode:

- overstimulation
- jitter
- awkward state shifts
- cluttered annotation reveals

Do not mix both motion regimes unless the contrast is the point.

## React and Next.js defaults

When implementing GSAP in React or Next.js:

1. Put motion code in client components.
2. Scope selectors with a `ref`.
3. Use `useGSAP()` instead of ad hoc effect wiring.
4. Prefer timelines for multi-step sequences.
5. Revert or clean up on unmount through the GSAP React integration.

Default pattern:

```tsx
"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP);

export function MotionExample() {
  const scope = useRef<HTMLDivElement | null>(null);

  useGSAP(
    () => {
      const timeline = gsap.timeline({ defaults: { ease: "power2.out", duration: 0.6 } });
      timeline.from("[data-animate='title']", { y: 24, opacity: 0 });
      timeline.from("[data-animate='panel']", { y: 16, opacity: 0, stagger: 0.08 }, "-=0.2");
    },
    { scope },
  );

  return <div ref={scope}>{/* ... */}</div>;
}
```

## Plugin selection rule

Do not import the entire GSAP catalog by default just because it exists.

Choose the smallest plugin set that matches the job:

- `ScrollTrigger` for scroll-linked reveals and section choreography
- `SplitText` for title or line-level typography reveals
- `Flip` for layout transitions and state morphs
- `DrawSVGPlugin` for route drawing and diagram strokes
- `MorphSVGPlugin` for icon or shape metamorphosis
- `Draggable` plus `InertiaPlugin` for tactile manipulation
- `Observer` for gesture, wheel, and pointer orchestration
- `ScrollToPlugin` for guided navigation
- `ScrambleTextPlugin` or `TextPlugin` only when text transformation adds meaning

Use the full shared registry only for sandbox or design-system work where broad plugin coverage is intentional.

## Shared registry pattern

If a project needs repeated GSAP use, centralize imports and registration in one file.

Example:

```ts
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { CustomEase } from "gsap/CustomEase";
import { CustomBounce } from "gsap/CustomBounce";
import { CustomWiggle } from "gsap/CustomWiggle";
import { RoughEase, ExpoScaleEase, SlowMo } from "gsap/EasePack";
import { Draggable } from "gsap/Draggable";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { EaselPlugin } from "gsap/EaselPlugin";
import { Flip } from "gsap/Flip";
import { GSDevTools } from "gsap/GSDevTools";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { MotionPathHelper } from "gsap/MotionPathHelper";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { Observer } from "gsap/Observer";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { PhysicsPropsPlugin } from "gsap/PhysicsPropsPlugin";
import { PixiPlugin } from "gsap/PixiPlugin";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { SplitText } from "gsap/SplitText";
import { TextPlugin } from "gsap/TextPlugin";

gsap.registerPlugin(
  useGSAP,
  Draggable,
  DrawSVGPlugin,
  EaselPlugin,
  Flip,
  GSDevTools,
  InertiaPlugin,
  MotionPathHelper,
  MotionPathPlugin,
  MorphSVGPlugin,
  Observer,
  Physics2DPlugin,
  PhysicsPropsPlugin,
  PixiPlugin,
  ScrambleTextPlugin,
  ScrollTrigger,
  ScrollSmoother,
  ScrollToPlugin,
  SplitText,
  TextPlugin,
  RoughEase,
  ExpoScaleEase,
  SlowMo,
  CustomEase,
  CustomBounce,
  CustomWiggle,
);

export { gsap };
```

## Motion review checklist

- Is the motion helping the user understand structure, sequence, or state?
- Are transforms and opacity doing most of the work?
- Is the easing family consistent across the piece?
- Is reduced-motion fallback considered?
- Would the animation still feel strong if cut to half the flourish?

## Additional reference

For plugin-specific guidance, React usage, performance rules, and design patterns, read [reference.md](reference.md).
