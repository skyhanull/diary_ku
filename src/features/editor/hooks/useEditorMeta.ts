"use client";

import { useCallback, useState } from "react";
import { startTransition } from "react";
import {
  createEditorBodyFromHtml,
  createEditorBodyFromText,
  DEFAULT_EDITOR_BODY_TEXT,
  extractEditorBodyText,
  type EditorBodyDocument,
} from "@/features/editor/lib/editor-body";
import type { DiaryEntryRecord } from "@/features/editor/types/editor.types";

export const moodOptions = ["😄", "🙂", "😐", "🙁", "😢"] as const;
export type MoodEmoji = (typeof moodOptions)[number];

const defaultTags: string[] = ["일상", "기록"];

interface SavedEditorSnapshot {
  title: string;
  mood: MoodEmoji;
  tags: string[];
  bodyHtml: string;
}

function makeDefaultSnapshot(bodyHtml: string): SavedEditorSnapshot {
  return {
    title: "",
    mood: moodOptions[0],
    tags: [...defaultTags],
    bodyHtml,
  };
}

export function useEditorMeta() {
  const defaultBody = createEditorBodyFromText(DEFAULT_EDITOR_BODY_TEXT);

  const [activeMoodIndex, setActiveMoodIndex] = useState(0);
  const [entryTitle, setEntryTitle] = useState("");
  const [entryTags, setEntryTags] = useState<string[]>([...defaultTags]);
  const [bodyDocument, setBodyDocument] = useState<EditorBodyDocument>(() => defaultBody);
  const [savedSnapshot, setSavedSnapshot] = useState<SavedEditorSnapshot>(() =>
    makeDefaultSnapshot(defaultBody.html)
  );

  const bodyHtml = bodyDocument.html;
  const bodyText = bodyDocument.text;
  const moodEmoji = moodOptions[activeMoodIndex];
  const isBodyDirty = bodyHtml !== savedSnapshot.bodyHtml;
  const hasMetaChanges =
    entryTitle !== savedSnapshot.title ||
    moodEmoji !== savedSnapshot.mood ||
    entryTags.length !== savedSnapshot.tags.length ||
    entryTags.some((tag, i) => tag !== savedSnapshot.tags[i]) ||
    isBodyDirty;

  const handleBodyHtmlChange = useCallback((html: string) => {
    setBodyDocument((prev) => (prev.html === html ? prev : { ...prev, html }));
    startTransition(() => {
      setBodyDocument((prev) => {
        if (prev.html !== html) return prev;
        const nextText = extractEditorBodyText(html);
        return prev.text === nextText ? prev : { html, text: nextText };
      });
    });
  }, []);

  const handleBodyTextChange = useCallback((text: string) => {
    setBodyDocument(createEditorBodyFromText(text));
  }, []);

  const syncFromEntry = useCallback((entry: DiaryEntryRecord | null, tags: string[]) => {
    if (!entry) {
      const emptyBody = createEditorBodyFromText(DEFAULT_EDITOR_BODY_TEXT);
      setActiveMoodIndex(0);
      setEntryTitle("");
      setEntryTags([...defaultTags]);
      setBodyDocument(emptyBody);
      setSavedSnapshot(makeDefaultSnapshot(emptyBody.html));
      return;
    }

    const nextBody = createEditorBodyFromHtml(entry.bodyHtml);
    const moodIndex = moodOptions.findIndex((m) => m === entry.mood);
    const resolvedMoodIndex = moodIndex >= 0 ? moodIndex : 0;
    const resolvedTags = tags.length > 0 ? tags : [...defaultTags];

    setActiveMoodIndex(resolvedMoodIndex);
    setEntryTitle(entry.title ?? "");
    setEntryTags(resolvedTags);
    setBodyDocument(nextBody);
    setSavedSnapshot({
      title: entry.title ?? "",
      mood: moodOptions[resolvedMoodIndex],
      tags: [...resolvedTags],
      bodyHtml: nextBody.html,
    });
  }, []);

  const commitSnapshot = useCallback(
    (overrides?: Partial<SavedEditorSnapshot>) => {
      setSavedSnapshot({
        title: entryTitle,
        mood: moodEmoji,
        tags: [...entryTags],
        bodyHtml,
        ...overrides,
      });
    },
    [bodyHtml, entryTags, entryTitle, moodEmoji]
  );

  const addTag = useCallback((tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    setEntryTags((prev) => (prev.includes(trimmed) ? prev : [...prev, trimmed]));
  }, []);

  const removeTag = useCallback((tag: string) => {
    setEntryTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  return {
    activeMoodIndex,
    moodEmoji,
    entryTitle,
    entryTags,
    bodyDocument,
    bodyHtml,
    bodyText,
    isBodyDirty,
    hasMetaChanges,
    setActiveMoodIndex,
    setEntryTitle,
    handleBodyHtmlChange,
    handleBodyTextChange,
    syncFromEntry,
    commitSnapshot,
    addTag,
    removeTag,
  };
}
