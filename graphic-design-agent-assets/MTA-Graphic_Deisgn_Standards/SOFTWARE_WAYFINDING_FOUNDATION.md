# Software Wayfinding Foundation

This document translates the extracted MTA / NYCTA graphic standards into software UI guidance for Studio13.

It does not replace the Studio13 brand palette. The core colorway remains black, white, and orange. The MTA material is used to shape hierarchy, legibility, spacing, navigation, and motion behavior.

## Core Principle

The interface should provide information at the point of decision:

- never before
- never after

Every screen should reduce ambiguity, remove decorative clutter, and present the next useful choice with as little friction as possible.

## UI Translation

Transit signage concepts map cleanly to product UI:

- Identification: page titles, object names, section headers, route or product labels
- Directional: navigation, breadcrumbs, grouped actions, next-step links, filters, sort controls
- Information: metadata, supporting descriptions, status, timestamps, context, guidance copy

This means every interface should make it obvious:

- where the user is
- what they can do next
- what supporting information matters now

## Typography

Typeface rules:

- Use Helvetica first, then Arial, then compatible sans-serif fallbacks
- Avoid display fonts for primary UI hierarchy
- Use weight, scale, spacing, and alignment instead of novelty faces
- Favor uppercase for short labels, section markers, and directional cues
- Favor mixed case for titles, content, and long-form reading

Hierarchy rules:

- Identification elements should feel the strongest and most stable
- Directional labels should be compact, terse, and scannable
- Information copy should be quieter, secondary, and bounded in length

Spacing rules:

- Use measured spacing that feels modular rather than decorative
- Align blocks to visible rails and columns
- Keep letter spacing controlled and intentional
- Keep line lengths readable and grouped by task

Content density rules:

- Directional groupings should stay short
- Supporting information should be chunked, not piled
- Repetition should be removed unless it supports orientation

## Color

Studio13 palette:

- Background: black
- Primary text: white
- Accent: orange

Usage rules:

- Black and white should do most of the work
- Orange should be used as the directional and emphasis accent
- Additional color should only appear when it communicates a coded meaning
- Decorative color drift should be avoided

This preserves the Studio13 identity while adopting the MTA discipline of color as signal.

## Layout

Layout should feel like a signage system:

- strong alignment
- clear grouping
- consistent margins and gutters
- obvious transitions between sections
- generous negative space around decision points

Preferred layout behavior:

- lead with identification
- follow with direction
- then provide supporting information

Page sections should behave like sign plates:

- each section has a clear role
- each section is visually bounded
- each section answers a specific navigation or comprehension question

## Navigation

Navigation should behave like wayfinding:

- labels should be brief and unambiguous
- options should be grouped by intent
- active state should be obvious
- links should feel like routes, not decoration
- breadcrumbs and back-links should clarify orientation

When a user changes context, the page should re-establish:

- current location
- available branches
- next meaningful action

## Map Grammar For Software

Use the Vignelli-era NYCTA map as a complete structural model for interface logic, not just a visual mood reference.

- Color should identify durable route or workflow families rather than decorate a panel.
- The line should behave as a first-class structural actor, making continuity, branching, and priority legible before supporting labels appear.
- Geometry should rely on a small repeatable bend-radius family rather than arbitrary curves.
- Shared corridors should hold fixed parallel spacing through turns.
- Interchanges should be deliberate transfer points rather than accidental crossings.

In software terms, this means:

- route rails for primary journeys
- bundled parallel lanes for concurrent workflows
- explicit interchange states where investigation, evidence, review, and action connect
- durable route identity only when a meaning persists across the system

## Motion

Motion is allowed, but it must behave like signage:

- short
- directional
- functional
- restrained

Motion should help with:

- entrance sequencing
- focus transitions
- orientation
- signaling hierarchy

Motion should not rely on:

- glow-heavy spectacle
- bounce
- ornamental looping
- animation that obscures meaning

Logo motion may remain expressive, but UI motion around it should stay calm and informative.

## Component Guidance

Homepage:

- Hero is identification
- Project links and group nav are directional
- Post cards are informational summaries with clear next-step links

Posts and comments:

- Title and date are identification
- metadata and signatures are informational
- back-links and related content are directional

Footers:

- should read like supporting system information, not a decorative banner

## Implementation Priorities

1. Set Helvetica-first typography tokens and remove decorative display assumptions.
2. Rebuild section hierarchy so identification, directional, and informational roles are visually distinct.
3. Tighten spacing, alignment, and grouping around decision points.
4. Reserve orange for emphasis, navigation, and active-state signaling.
5. Keep motion restrained and supportive of orientation.
