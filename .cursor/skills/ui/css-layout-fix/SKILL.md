# CSS Layout Fix

## Purpose
Repair layout issues without destabilizing the broader stylesheet.

## Inputs
- broken layout description
- screenshots or viewport context
- related markup and styles

## Process
1. identify the layout system in use
2. inspect the minimum container chain that affects the issue
3. fix the constraint causing breakage
4. avoid global overrides unless necessary
5. verify across likely viewport sizes

## Outputs
- scoped CSS fix
- root-cause note
- viewport verification notes
