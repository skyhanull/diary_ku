# Workflow And Quality Gates

## Default Workflow
1. Read the relevant files first.
2. Understand current behavior before proposing cleanup.
3. Make the smallest safe change that solves the task.
4. Validate the affected behavior.
5. Update docs when rules or architecture meaningfully change.

## Working Style
- Respect the current implementation as the source of truth for immediate behavior.
- Use docs to understand intent, not to ignore the code.
- Move the codebase toward the target architecture gradually.
- Avoid mixing many unrelated changes in one pass.

## Quality Gates
Run when relevant:

```bash
npm run lint
npm run typecheck
npm run build
```

## Manual Validation Expectations
Depending on the task, verify:
- the route still renders
- the edited screen still works as expected
- editor interactions still behave correctly
- no obvious regressions were introduced in surrounding UI

## Scope Control
- Stay within the requested problem.
- If you notice adjacent issues, mention them separately rather than folding them into the same change without need.
- Do not convert a small bugfix into a large architecture migration.

## When To Update Docs
- New repeated coding pattern
- New architecture boundary
- New editor contract expectation
- New validation command or local workflow
- New recurring pitfall that reviewers keep catching

## Review Checklist
- Is the change understandable to the next contributor?
- Did the modification introduce a new pattern?
- Did any type contracts change?
- Did any user-facing behavior change unintentionally?
- Is the documentation now stale?

## Change Strategy
- Prefer iterative improvements.
- If cleanup is needed but risky, leave the code safer rather than "perfect".
- Stabilize first, abstract second.

## Things To Avoid
- Hidden breaking changes
- Drive-by file reorganization
- Mixing experimental design work with core bugfixes
- Solving temporary uncertainty by loosening types

## Good Outcome Standard
A good change in this repo usually:
- solves the user-visible issue
- keeps editor behavior consistent
- preserves type safety
- fits the existing structure
- leaves a clear path for follow-up work
