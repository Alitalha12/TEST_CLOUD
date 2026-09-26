# ADR 0008: Trunk-based git, no `develop` branch (D14)

**Status:** Accepted

## Context
`plan.md` §21 suggests `main` + `develop` + feature branches. The team is
three people.

## Decision
`main` only, protected, always deployable to staging. Short-lived branches
merged within 1–3 days via squash-merged PRs (`docs/conventions.md`).

## Why
A `develop` branch adds a second integration point and merge conflicts
with no benefit for a 3-person team working on disjoint modules per
phase.

## Consequences
- Feature flags (`universities.settings.features`) are used to merge
  incomplete work "dark" instead of parking it on a long-lived branch (§24).
