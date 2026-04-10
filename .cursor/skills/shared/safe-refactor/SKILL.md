# Safe Refactor

## Purpose
Improve code structure without changing intended behavior.

## Inputs
- current code
- target improvement
- behavior constraints
- available tests

## Process
1. preserve external behavior
2. reduce one kind of complexity at a time
3. avoid mixing refactor with feature work
4. keep changes reviewable
5. identify missing verification coverage

## Outputs
- refactor plan
- scoped patch
- risk notes
