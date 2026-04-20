"use client";

import { useCallback, useState } from "react";

import { createSharedLetter, saveEditorSession } from "@/features/editor/lib/editor-persistence";
import type { EditorItem, SharedLetterTheme } from "@/features/editor/types/editor.types";

interface UseEditorPersistenceActionsInput {
  pageId: string;
  title: string;
  bodyHtml: string;
  bodyText: string;
  mood: string;
  tags: string[];
  items: EditorItem[];
  onResetDirty: () => void;
  onBodySaved: (bodyText: string) => void;
}

interface CreateShareInput {
  recipientName: string;
  theme: SharedLetterTheme;
}

export function useEditorPersistenceActions({
  pageId,
  title,
  bodyHtml,
  bodyText,
  mood,
  tags,
  items,
  onResetDirty,
  onBodySaved,
}: UseEditorPersistenceActionsInput) {
  const [isSaving, setIsSaving] = useState(false);
  const [isBodySaving, setIsBodySaving] = useState(false);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [sharedLetterUrl, setSharedLetterUrl] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const saveCurrentSession = useCallback(async () => {
    return saveEditorSession({
      pageId,
      title: title.trim() || null,
      bodyHtml,
      mood,
      tags,
      viewMode: "single",
      status: "saved",
      items,
    });
  }, [bodyHtml, items, mood, pageId, tags, title]);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      await saveCurrentSession();
      onResetDirty();
      onBodySaved(bodyText);
      setSaveMessage(items.length > 0 ? `${pageId} 일기와 요소 ${items.length}개를 저장했어요.` : `${pageId} 일기를 저장했어요.`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "저장 중 문제가 발생했어요.");
    } finally {
      setIsSaving(false);
    }
  }, [bodyText, items.length, onBodySaved, onResetDirty, pageId, saveCurrentSession]);

  const handleSaveBody = useCallback(async () => {
    setIsBodySaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      await saveCurrentSession();
      onBodySaved(bodyText);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "본문 저장 중 문제가 발생했어요.");
    } finally {
      setIsBodySaving(false);
    }
  }, [bodyText, onBodySaved, saveCurrentSession]);

  const handleCreateShare = useCallback(
    async ({ recipientName, theme }: CreateShareInput) => {
      setIsCreatingShare(true);
      setSaveError(null);
      setShareMessage(null);

      try {
        const sharedLetter = await createSharedLetter({
          pageId,
          title: title.trim() || null,
          bodyHtml,
          mood,
          tags,
          viewMode: "single",
          status: "saved",
          items,
          background: "#fffdf9",
          recipientName: recipientName.trim() || null,
          coverMessage: null,
          theme,
        });

        onResetDirty();
        onBodySaved(bodyText);
        const nextUrl = `${window.location.origin}/letter/${sharedLetter.shareToken}`;
        setSharedLetterUrl(nextUrl);
        setShareMessage("편지 링크를 만들었어요. 복사하거나 바로 열어볼 수 있어요.");
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "공유 링크 생성 중 문제가 발생했어요.");
      } finally {
        setIsCreatingShare(false);
      }
    },
    [bodyHtml, bodyText, items, mood, onBodySaved, onResetDirty, pageId, tags, title]
  );

  const handleCopyShareLink = useCallback(async () => {
    if (!sharedLetterUrl) return;

    try {
      await navigator.clipboard.writeText(sharedLetterUrl);
      setShareMessage("공유 링크를 복사했어요.");
    } catch {
      setShareMessage("링크 복사에 실패했어요. 다시 시도해주세요.");
    }
  }, [sharedLetterUrl]);

  return {
    isSaving,
    isBodySaving,
    isCreatingShare,
    sharedLetterUrl,
    shareMessage,
    saveMessage,
    saveError,
    setSaveMessage,
    setSaveError,
    setShareMessage,
    handleSave,
    handleSaveBody,
    handleCreateShare,
    handleCopyShareLink,
  };
}
