# Development Conventions

## General Coding Rules
- Read related files before changing code.
- Keep modifications within the requested scope.
- Reuse existing types and patterns before adding new ones.
- Prefer explicit code over clever abstractions.
- Avoid broad cleanup mixed into functional work.

## Naming
- Follow existing project naming style.
- Use descriptive file and component names.
- Name files after the primary exported unit when possible.
- Avoid vague utility buckets like `misc`, `commonStuff`, or `helpers2`.

## TypeScript
- Avoid `any`.
- Prefer existing domain types over inline shape duplication.
- If a type is shared across multiple editor components, centralize it.
- Do not weaken types just to satisfy a quick implementation.

## Imports
- Prefer `@/*` alias for files under `src/*`.
- Keep imports grouped cleanly.
- Avoid deep relative traversals when alias usage is appropriate.

## Components
- Route components should remain thin.
- Feature components should own feature-specific rendering and interactions.
- Shared UI components in `src/components/ui` should remain generic.
- Do not push feature-specific assumptions into shared UI primitives.

## Hooks And State
- Prefer feature-local hooks for feature state.
- Use domain-shaped actions rather than anonymous patching everywhere.
- Keep state ownership obvious.
- Do not scatter one editor session across too many unrelated state holders.

## Styling
- Tailwind is the default styling approach.
- Preserve the current warm, diary-like visual tone.
- Favor clarity and interaction quality over decoration.
- Do not perform major restyling during logic-only tasks.

## Comments
- Add comments only where intent is not obvious.
- Prefer short explanation of why rather than narration of what.
- Remove stale comments when behavior changes.

## Dependency Rules
- Do not add libraries casually.
- Prefer built-in platform or existing dependency solutions first.
- New dependencies should have a clear, recurring value.

## Refactoring Rules
- Small structural improvement is encouraged.
- Large opportunistic rewrites are discouraged.
- If the current implementation is transitional, improve it incrementally.
- Do not rewrite stable code paths without clear product or maintenance benefit.

## Documentation Rules
- If architecture-sensitive behavior changes, update docs.
- If code and docs diverge, align docs as part of the work when practical.
- Put product/design intent in `docs/`.
- Keep area-specific instructions near the area when repeated often.

## Anti-Patterns
- Duplicating editor types
- Business logic living in route files
- UI components taking over persistence concerns
- Silent UX rule changes without note
- Introducing alternate conventions in one file
