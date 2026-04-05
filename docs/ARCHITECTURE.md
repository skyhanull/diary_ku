# Architecture Guide

## Purpose
This document defines the working architecture for DearMe.
It is meant to help contributors decide:
- where new code should live
- what each layer is responsible for
- how editor state and UI should evolve
- which patterns to avoid

## System Overview
DearMe is a Next.js App Router application centered on a diary editor experience.

Main areas:
- App routes for entry and page composition
- Feature modules for domain-specific UI and logic
- Shared UI primitives
- Shared utility/service setup
- External services:
  - Supabase for auth/data/storage
  - Cloudflare Worker for AI sticker generation

## Architecture Principles
1. Keep route files thin.
2. Keep domain logic inside feature folders.
3. Keep shared UI primitives generic.
4. Keep editor data contracts centralized.
5. Separate rendering, state transitions, and persistence as the product matures.
6. Prefer incremental improvement over disruptive rewrites.

## Current Repository Shape
```txt
src/
  app/
    auth/
    ai-sticker-test/
    editor/[pageId]/
    page.tsx

  components/
    ui/

  features/
    editor/
      components/
      hooks/
      types/

  lib/
```

Supporting docs and infra:
```txt
docs/
cloudflare/sticker-worker/
.github/workflows/
```

## Layer Responsibilities

### 1. App Layer
Location:
- `src/app/*`

Responsibilities:
- route entry
- loading params
- composing feature screens
- server/client boundary decisions

Should do:
- pass route params into feature screens
- keep page files easy to scan

Should not do:
- own large interactive editor logic
- redefine domain types
- contain deeply nested UI logic when that logic belongs to a feature

Example:
- `src/app/editor/[pageId]/page.tsx` should stay an entry point that hands off to the editor feature.

### 2. Feature Layer
Location:
- `src/features/*`

Responsibilities:
- domain-specific UI
- interaction logic
- feature state
- feature types
- feature-specific helper logic

This is the primary place for real product behavior.

Current most important feature:
- `src/features/editor`

Within editor:
- `components/`: visible UI and interaction surfaces
- `hooks/`: editor state transitions and behavior composition
- `types/`: editor contracts

### 3. Shared UI Layer
Location:
- `src/components/ui/*`

Responsibilities:
- reusable UI primitives
- low-level styling consistency

Rules:
- keep these generic
- avoid feature-specific assumptions
- prefer composition over customization explosion

### 4. Shared Lib Layer
Location:
- `src/lib/*`

Responsibilities:
- shared utilities
- service setup
- light cross-feature helpers

Rules:
- do not move feature logic here just because it is reused twice
- if logic is editor-specific, keep it in the editor feature until reuse is truly cross-domain

## Editor Architecture

### Why The Editor Gets Special Rules
The editor is the product core and the highest-risk area for regressions.
Its behavior is a combination of:
- item data shape
- pointer interactions
- visual rendering
- selection state
- save/restore expectations

Small changes can have cross-cutting impact.

### Current State
- `EditorScreen` currently acts as both orchestrator and a significant UI container.
- `useEditorState` is the main state hook for editor item operations.
- Canvas interaction lives in `EditorCanvasSingle.tsx`.
- Some target architecture docs already exist, but the live code is still in a transitional stage.

### Target State
The editor should gradually move toward this split:

```txt
app/editor/[pageId]/page.tsx
  -> EditorScreen
    -> top-level orchestration
    -> feature hooks
    -> presentational/editor surface components

hooks/
  -> state transitions
  -> reusable editor actions

types/
  -> item contracts
  -> mode/page-side contracts

future persistence layer
  -> load/save state
  -> DB row <-> UI mapping
```

### Editor Contracts
The file below is treated as the core editor contract:
- `src/features/editor/types/editor.types.ts`

Changes here are high impact.
If you change editor item structure, review all affected areas:
- state creation
- item rendering
- canvas interactions
- toolbar/panel actions
- persistence mapping

### Editor Component Rules
- Screen components orchestrate.
- Canvas components handle rendering and direct interactions.
- Hooks own state transitions and reusable actions.
- Avoid hiding important editor behavior inside deeply nested anonymous callbacks when it can live in a named helper or hook.

### Editor State Rules
- The current default is local feature state, not app-wide global state.
- Use explicit domain actions such as add/update/remove/select where possible.
- Keep dirty-state semantics consistent.
- Avoid many disconnected state atoms when they describe one editor session.

### Editor Interaction Rules
When changing editor interactions, verify:
- selection
- deselection
- drag behavior
- resize behavior
- bounds/clamping
- page-side behavior
- dirty-state updates

If any of these rules change intentionally, document it.

## Data Flow

### Present Flow
Typical UI flow:
1. route loads page id
2. `EditorScreen` initializes editor state
3. child components receive state and callbacks
4. user interactions call state actions
5. dirty-state flips when mutable content changes

### Desired Flow
As persistence is formalized:
1. route or feature boundary loads initial editor data
2. mapper converts backend shape into editor UI state
3. feature hooks manage in-session updates
4. save action serializes state through a repository boundary

## Placement Decision Rules

### If You Add A Route
Put it in:
- `src/app/<route>/page.tsx`

Also consider:
- does the page deserve a feature folder
- is there domain logic that should not remain in the route file

### If You Add New Editor Behavior
Ask:
1. Is this a new item type, new interaction, or new panel/tool?
2. Does it require type changes?
3. Does it affect save/load shape?
4. Does it belong in a hook instead of a component?

### If You Add Cross-Feature Utilities
Only move to `src/lib` if the logic is truly shared and not editor-specific.

## Naming And Organization Rules
- Prefer explicit names over vague helpers.
- Name files after the unit they expose.
- Keep feature files near their related types and hooks.
- Avoid "misc", "temp", or "helpers" dumping grounds unless the folder is intentionally small and still coherent.

## Transitional Architecture Policy
This repository is allowed to have transitional structures while the MVP is evolving.
That does not mean structure is unimportant.

Follow this rule:
- do not force a full refactor during a small task
- do improve local structure when touching a messy area
- do document target direction when code is still transitional

## What Not To Do
- Put complex feature state directly into `src/app` pages
- Duplicate editor type definitions in multiple files
- Mix persistence access directly into presentational leaf components
- Make shared UI primitives depend on editor-only assumptions
- Introduce a new state management library before local feature organization is no longer enough

## Validation Expectations
For architecture-sensitive changes, run when possible:

```bash
npm run lint
npm run typecheck
npm run build
```

Also validate manually when relevant:
- route renders
- editor still selects items correctly
- add/move/resize flows still work
- save UX still behaves sensibly

## Related Documents
- `AGENT.md`
- `docs/PRD.md`
- `docs/EDITOR_MVP_PLAN.md`
- `docs/EDITOR_COMPONENT_ARCHITECTURE.md`
