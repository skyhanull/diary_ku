"use client";
// 에디터 메타 훅: 일기 제목·태그·감정(mood) 상태를 관리한다
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

// 선택 가능한 감정 이모지 목록 (인덱스로 activeMoodIndex와 대응)
export const moodOptions = ["😄", "🙂", "😐", "🙁", "😢"] as const;
// moodOptions 배열 원소 타입
export type MoodEmoji = (typeof moodOptions)[number];

// 새 일기 생성 시 기본으로 붙는 태그 목록
const defaultTags: string[] = ["일상", "기록"];

// 마지막으로 저장된 에디터 메타 상태를 기록해 dirty 여부 비교에 쓰는 타입
interface SavedEditorSnapshot {
  title: string;
  mood: MoodEmoji;
  tags: string[];
  bodyHtml: string;
}

// 주어진 bodyHtml을 기준으로 기본값 스냅샷 객체를 생성한다
function makeDefaultSnapshot(bodyHtml: string): SavedEditorSnapshot {
  return {
    title: "",
    mood: moodOptions[0],
    tags: [...defaultTags],
    bodyHtml,
  };
}

// 제목·태그·감정·본문 상태와 dirty 감지·스냅샷 관리를 제공하는 훅
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
