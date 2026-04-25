"use client";

import { useCallback, useMemo, useState } from "react";

import type { CreateEditorItemInput, CreateEditorStateInput, EditorItem, EditorState, EditorViewMode } from "@/features/editor/types/editor.types";

const DEFAULT_BACKGROUND = "#FFF8ED";
const MAX_HISTORY = 50;

function createItemId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function getNextZIndex(items: EditorItem[]) {
  if (items.length === 0) return 1;
  return Math.max(...items.map((item) => item.zIndex)) + 1;
}

interface InternalState extends EditorState {
  history: EditorItem[][];
  historyIndex: number;
}

function createInitialState(input: CreateEditorStateInput): InternalState {
  const items = input.items ?? [];
  return {
    pageId: input.pageId,
    viewMode: input.viewMode ?? "single",
    background: input.background ?? DEFAULT_BACKGROUND,
    selectedItemId: input.selectedItemId ?? null,
    items,
    isDirty: false,
    history: [items],
    historyIndex: 0,
  };
}

function pushHistory(prev: InternalState, nextItems: EditorItem[]): Pick<InternalState, "history" | "historyIndex"> {
  const trimmed = prev.history.slice(0, prev.historyIndex + 1);
  const next = [...trimmed, nextItems].slice(-MAX_HISTORY);
  return { history: next, historyIndex: next.length - 1 };
}

export function useEditorState(input: CreateEditorStateInput) {
  const [state, setState] = useState<InternalState>(() => createInitialState(input));

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

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
      const id = createItemId();
      const item: EditorItem = {
        id,
        type: inputItem.type,
        pageSide: inputItem.pageSide ?? (prev.viewMode === "spread" ? "left" : "single"),
        x: inputItem.x ?? 40,
        y: inputItem.y ?? 40,
        width: inputItem.width ?? 120,
        height: inputItem.height ?? 120,
        rotation: inputItem.rotation ?? 0,
        zIndex: getNextZIndex(prev.items),
        opacity: inputItem.opacity ?? 1,
        payload: inputItem.payload ?? {},
      };
      const nextItems = [...prev.items, item];
      return { ...prev, items: nextItems, selectedItemId: id, isDirty: true, ...pushHistory(prev, nextItems) };
    });
  }, []);

  const updateItem = useCallback((itemId: string, patch: Partial<EditorItem>) => {
    setState((prev) => {
      const nextItems = prev.items.map((item) => (item.id === itemId ? { ...item, ...patch } : item));
      return { ...prev, items: nextItems, isDirty: true, ...pushHistory(prev, nextItems) };
    });
  }, []);

  const removeItem = useCallback((itemId: string) => {
    setState((prev) => {
      const nextItems = prev.items.filter((item) => item.id !== itemId);
      return {
        ...prev,
        items: nextItems,
        selectedItemId: prev.selectedItemId === itemId ? null : prev.selectedItemId,
        isDirty: true,
        ...pushHistory(prev, nextItems),
      };
    });
  }, []);

  const replaceItems = useCallback((items: EditorItem[]) => {
    setState((prev) => ({ ...prev, items, isDirty: true, ...pushHistory(prev, items) }));
  }, []);

  const hydrateItems = useCallback((items: EditorItem[]) => {
    setState((prev) => ({
      ...prev,
      items,
      selectedItemId: null,
      isDirty: false,
      history: [items],
      historyIndex: 0,
    }));
  }, []);

  const undo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex <= 0) return prev;
      const nextIndex = prev.historyIndex - 1;
      return { ...prev, items: prev.history[nextIndex], historyIndex: nextIndex, selectedItemId: null, isDirty: true };
    });
  }, []);

  const redo = useCallback(() => {
    setState((prev) => {
      if (prev.historyIndex >= prev.history.length - 1) return prev;
      const nextIndex = prev.historyIndex + 1;
      return { ...prev, items: prev.history[nextIndex], historyIndex: nextIndex, selectedItemId: null, isDirty: true };
    });
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
    canUndo,
    canRedo,
    setViewMode,
    setBackground,
    selectItem,
    addItem,
    updateItem,
    removeItem,
    replaceItems,
    hydrateItems,
    undo,
    redo,
    resetDirty,
  };
}
