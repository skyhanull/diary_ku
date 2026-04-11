# Editor Component Architecture

## Goal
- Keep the editor route thin.
- Keep the main editor workflow in `EditorScreen`.
- Keep canvas interaction behavior in `EditorCanvasSingle`.
- Keep state transitions in `useEditorState`.

## Current Shape
```txt
src/
  app/
    editor/[pageId]/page.tsx

  features/
    editor/
      components/
        EditorScreen.tsx
        EditorCanvasSingle.tsx
      hooks/
        useEditorState.ts
      lib/
        editor-persistence.ts
      types/
        editor.types.ts
```

## Responsibilities

### `app/editor/[pageId]/page.tsx`
- Route entry point.
- Parses `pageId`.
- Renders `EditorScreen`.

### `EditorScreen`
- Owns the editor page layout and side panels.
- Handles save/load/share flows.
- Handles AI sticker, GIF search, media upload, and item creation flows.
- Composes `EditorCanvasSingle`.

### `EditorCanvasSingle`
- Renders the diary body and canvas items.
- Handles item selection, dragging, resizing, deleting, text placement, and file drop.
- Keeps canvas pointer behavior local to the canvas surface.

### `useEditorState`
- Owns editor state transitions.
- Provides item add/update/remove/select helpers.
- Tracks dirty state for save behavior.

### `editor-persistence.ts`
- Maps editor UI state to Supabase records.
- Loads and saves diary entries and editor items.
- Creates shared letter snapshots.

### `editor.types.ts`
- Centralizes editor domain types.
- Includes item, payload, view mode, tool, entry, and shared-letter types.

## Notes
- The previous split toolbar/sidebar/property-panel components were removed because the active UI is now consolidated inside `EditorScreen`.
- The spread canvas draft was removed from the active code path. Keep `EditorViewMode` and `PageSide` contracts until persistence/data migration decisions are finalized.
