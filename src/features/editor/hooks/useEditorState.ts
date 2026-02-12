'use client';

import { useCallback, useMemo, useState } from 'react';

import type {
  CreateEditorItemInput,
  CreateEditorStateInput,
  EditorItem,
  EditorState,
  EditorViewMode
} from '@/features/editor/types/editor.types';

const DEFAULT_BACKGROUND = '#FFF8ED';

function createItemId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function createInitialState(input: CreateEditorStateInput): EditorState {
  return {
    pageId: input.pageId,
    viewMode: input.viewMode ?? 'single',
    background: input.background ?? DEFAULT_BACKGROUND,
    selectedItemId: input.selectedItemId ?? null,
    items: input.items ?? [],
    isDirty: false
  };
}

function getNextZIndex(items: EditorItem[]) {
  if (items.length === 0) return 1;

  return Math.max(...items.map((item) => item.zIndex)) + 1;
}

export function useEditorState(input: CreateEditorStateInput) {
  const [state, setState] = useState<EditorState>(() => createInitialState(input));

  const setViewMode = useCallback((viewMode: EditorViewMode) => {
    setState((prev) => ({ ...prev, viewMode, isDirty: true }));
  }, []);

  const setBackground = useCallback((background: string) => {
    setState((prev) => ({ ...prev, background, isDirty: true }));
  }, []);

  const selectItem = useCallback((itemId: string | null) => {
    setState((prev) => ({ ...prev, selectedItemId: itemId }));
  }, []);

  const addItem = useCallback((inputItem: CreateEditorItemInput) => {
    setState((prev) => {
      const item: EditorItem = {
        id: createItemId(),
        type: inputItem.type,
        pageSide: inputItem.pageSide ?? (prev.viewMode === 'spread' ? 'left' : 'single'),
        x: inputItem.x ?? 40,
        y: inputItem.y ?? 40,
        width: inputItem.width ?? 120,
        height: inputItem.height ?? 120,
        rotation: inputItem.rotation ?? 0,
        zIndex: getNextZIndex(prev.items),
        payload: inputItem.payload ?? {}
      };

      return {
        ...prev,
        items: [...prev.items, item],
        selectedItemId: item.id,
        isDirty: true
      };
    });
  }, []);

  const updateItem = useCallback((itemId: string, patch: Partial<EditorItem>) => {
    setState((prev) => {
      const items = prev.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item));

      return {
        ...prev,
        items,
        isDirty: true
      };
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== itemId),
      selectedItemId: prev.selectedItemId === itemId ? null : prev.selectedItemId,
      isDirty: true
    }));
  }, []);

  const replaceItems = useCallback((items: EditorItem[]) => {
    setState((prev) => ({
      ...prev,
      items,
      isDirty: true
    }));
  }, []);

  const resetDirty = useCallback(() => {
    setState((prev) => ({ ...prev, isDirty: false }));
  }, []);

  const selectedItem = useMemo(
    () => state.items.find((item) => item.id === state.selectedItemId) ?? null,
    [state.items, state.selectedItemId]
  );

  return {
    state,
    selectedItem,
    setViewMode,
    setBackground,
    selectItem,
    addItem,
    updateItem,
    removeItem,
    replaceItems,
    resetDirty
  };
}
