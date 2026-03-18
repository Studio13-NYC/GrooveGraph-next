# GitHub Strategy

## Position

`GrooveGraph Next` should be established as a successor project, not as an in-place continuation of the legacy repository.

## Recommended approach

1. Create a new GitHub repository for `GrooveGraph Next`.
2. Describe the legacy `GrooveGraph` repo as reference material and predecessor work.
3. Keep a clean paper trail for what is newly authored here versus what was learned elsewhere.

## Why

- the new framework has different boundaries and authority
- the old repo is valuable as evidence, but not as the implementation substrate
- a new repo makes the clean-room discipline obvious to humans and tools

## Suggested remote setup

- default repo name: `GrooveGraph-next`
- default branch: `main`
- local path: sibling to the old repo
- old repo remains unchanged except for retrospective documentation

## README language

When the remote is created, include language like:

> GrooveGraph Next is a clean-start successor framework. The legacy GrooveGraph repository remains available as historical and architectural reference.

## Before pushing

- confirm the new repo name
- confirm whether you want a public or private remote
- decide whether to link the predecessor repo directly in the README
