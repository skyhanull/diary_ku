# Architecture And Boundaries

## Architectural Intent
DearMe should be organized so contributors can quickly answer:
- where new code belongs
- what each layer owns
- what is shared vs feature-specific
- how to evolve the editor without destabilizing it

## Main Layers

### App Layer
Location:
- `src/app/*`

Responsibilities:
- route entry
- params loading
- server/client boundary decisions
- screen composition

Should not own:
- dense feature interaction logic
- duplicated feature contracts
- editor-specific domain rules

### Feature Layer
Location:
- `src/features/*`

Responsibilities:
- domain UI
- interaction logic
- feature state
- feature-level contracts

Current priority feature:
- `src/features/editor`

### Shared UI Layer
Location:
- `src/components/ui/*`

Responsibilities:
- generic reusable UI primitives
- low-level styling consistency

Should not own:
- editor-only assumptions
- domain-specific workflow behavior

### Shared Lib Layer
Location:
- `src/lib/*`

Responsibilities:
- shared utilities
- service/client setup
- cross-feature helpers when truly shared

Should not become:
- a dumping ground for feature logic

## Current Editor Shape
- `EditorScreen` combines orchestration and substantial UI
- `useEditorState` is the main editor state hook
- `EditorCanvasSingle.tsx` holds important interaction logic
- editor contracts are centralized in `src/features/editor/types/editor.types.ts`

This is a transitional but acceptable MVP structure.

## Target Direction
- routes remain thin
- feature screens orchestrate
- hooks own state transitions
- canvas/panel components own rendering and direct interaction boundaries
- persistence gets isolated from presentational components

## Boundary Rules
- Product routing logic stays in `src/app`
- Feature logic stays in `src/features/<feature>`
- Shared design primitives stay in `src/components/ui`
- Cross-feature utilities stay in `src/lib`

## Placement Rules

### Adding A Route
- put entry in `src/app/<route>/page.tsx`
- move meaningful feature logic out of the route file

### Adding Feature UI
- place it in the relevant feature folder
- only move to shared UI if multiple areas genuinely need it

### Adding Editor State Or Contracts
- start with `src/features/editor/hooks`
- review `src/features/editor/types/editor.types.ts`
- do not redefine editor contracts locally

### Adding Persistence Logic
- keep it outside leaf UI components
- isolate data mapping from rendering concerns

## Transitional Policy
- do not force a full rewrite during a normal task
- do improve local structure when touching a messy area
- do preserve future-friendly boundaries

## Architectural Risks To Watch
- route files becoming feature containers
- editor types duplicating across files
- persistence leaking into presentation components
- local fixes making `EditorScreen` even harder to split later

## Related Long-Form Docs
- [docs/ARCHITECTURE.md](../ARCHITECTURE.md)
- [docs/EDITOR_COMPONENT_ARCHITECTURE.md](../EDITOR_COMPONENT_ARCHITECTURE.md)
- [docs/EDITOR_MVP_PLAN.md](../EDITOR_MVP_PLAN.md)
