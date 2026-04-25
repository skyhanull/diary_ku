"use client";

import { useCallback, useRef, useState } from "react";

import { createEditorSaveFlowController } from "@/features/editor/lib/editor-save-flow";
import { createSharedLetter, saveEditorSession } from "@/features/editor/lib/editor-persistence";
import { supabase } from "@/lib/supabase";
import type { EditorItem, SharedLetterTheme } from "@/features/editor/types/editor.types";

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

interface UseEditorPersistenceActionsInput {
  pageId: string;
  title: string;
  bodyHtml: string;
  mood: string;
  tags: string[];
  items: EditorItem[];
  onResetDirty: () => void;
  onPersistSuccess: () => void;
}

interface CreateShareInput {
  recipientName: string;
  theme: SharedLetterTheme;
}

export function useEditorPersistenceActions({
  pageId,
  title,
  bodyHtml,
  mood,
  tags,
  items,
  onResetDirty,
  onPersistSuccess,
}: UseEditorPersistenceActionsInput) {
  const saveFlowControllerRef = useRef(createEditorSaveFlowController());
  const [isSaving, setIsSaving] = useState(false);
  const [isBodySaving, setIsBodySaving] = useState(false);
  const [isAutosaving, setIsAutosaving] = useState(false);
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [isSaveSlow, setIsSaveSlow] = useState(false);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "autosaving" | "saved" | "error">("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [sharedLetterUrl, setSharedLetterUrl] = useState<string | null>(null);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const triggerEmbed = useCallback(async () => {
    try {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) return;

      const text = [title.trim(), tags.join(' '), stripHtml(bodyHtml)]
        .filter(Boolean)
        .join('\n');
      if (!text.trim()) return;

      const payload = { pageId, text };
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

      const res = await fetch('/api/diary/embed', { method: 'POST', headers, body: JSON.stringify(payload) });
      if (!res.ok && res.status >= 500) {
        await fetch('/api/diary/embed', { method: 'POST', headers, body: JSON.stringify(payload) });
      }
    } catch {
      // silently ignore embed errors — embedding is best-effort
    }
  }, [bodyHtml, pageId, tags, title]);

  const syncPendingFlags = useCallback(() => {
    const counts = saveFlowControllerRef.current.getCounts();
    setIsSaving(counts.manual > 0);
    setIsBodySaving(counts.body > 0);
    setIsAutosaving(counts.autosave > 0);
  }, []);

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

  const persistSession = useCallback(
    async ({
      mode,
      successMessage,
      errorMessage,
      clearSuccessMessage = true,
    }: {
      mode: "manual" | "body" | "autosave";
      successMessage?: string | null;
      errorMessage: string;
      clearSuccessMessage?: boolean;
    }) => {
      const requestId = saveFlowControllerRef.current.start(mode);
      syncPendingFlags();
      setSaveState(mode === "autosave" ? "autosaving" : "saving");
      if (saveFlowControllerRef.current.isLatest(requestId)) {
        setIsSaveSlow(false);
      }
      if (clearSuccessMessage) {
        setSaveMessage(null);
      }
      setSaveError(null);

      const slowTimer = window.setTimeout(() => {
        if (saveFlowControllerRef.current.isLatest(requestId)) {
          setIsSaveSlow(true);
        }
      }, 1200);

      let succeeded = false;
      try {
        await saveCurrentSession();
        if (saveFlowControllerRef.current.isLatest(requestId)) {
          onResetDirty();
          onPersistSuccess();
          setLastSavedAt(Date.now());
          setSaveState("saved");
          if (successMessage) {
            setSaveMessage(successMessage);
          }
        }
        succeeded = true;
      } catch (error) {
        if (saveFlowControllerRef.current.isLatest(requestId)) {
          setSaveState("error");
          setSaveError(error instanceof Error ? error.message : errorMessage);
        }
      } finally {
        saveFlowControllerRef.current.finish(mode);
        window.clearTimeout(slowTimer);
        if (saveFlowControllerRef.current.isLatest(requestId)) {
          setIsSaveSlow(false);
        }
        syncPendingFlags();
      }
      return succeeded;
    },
    [onPersistSuccess, onResetDirty, saveCurrentSession, syncPendingFlags]
  );

  const handleSave = useCallback(async () => {
    const ok = await persistSession({
      mode: "manual",
      successMessage: items.length > 0 ? `${pageId} 일기와 요소 ${items.length}개를 저장했어요.` : `${pageId} 일기를 저장했어요.`,
      errorMessage: "저장 중 문제가 발생했어요.",
    });
    if (ok) void triggerEmbed();
  }, [items.length, pageId, persistSession, triggerEmbed]);

  const handleSaveBody = useCallback(async () => {
    await persistSession({
      mode: "body",
      successMessage: "본문을 포함한 현재 변경사항을 저장했어요.",
      errorMessage: "본문 저장 중 문제가 발생했어요.",
    });
  }, [persistSession]);

  const handleAutosave = useCallback(async () => {
    const ok = await persistSession({
      mode: "autosave",
      successMessage: null,
      errorMessage: "자동 저장에 실패했어요. 다시 시도해주세요.",
      clearSuccessMessage: false,
    });
    if (ok) void triggerEmbed();
    return ok;
  }, [persistSession, triggerEmbed]);

  const handleFlushPendingSave = useCallback(async () => {
    if (saveFlowControllerRef.current.hasActivePersist()) {
      return false;
    }

    return handleAutosave();
  }, [handleAutosave]);

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
        onPersistSuccess();
        setLastSavedAt(Date.now());
        setSaveState("saved");
        const nextUrl = `${window.location.origin}/letter/${sharedLetter.shareToken}`;
        setSharedLetterUrl(nextUrl);
        setShareMessage("편지 링크를 만들었어요. 복사하거나 바로 열어볼 수 있어요.");
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : "공유 링크 생성 중 문제가 발생했어요.");
      } finally {
        setIsCreatingShare(false);
      }
    },
    [bodyHtml, items, mood, onPersistSuccess, onResetDirty, pageId, tags, title]
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
    isAutosaving,
    isCreatingShare,
    isSaveSlow,
    saveState,
    lastSavedAt,
    sharedLetterUrl,
    shareMessage,
    saveMessage,
    saveError,
    setSaveMessage,
    setSaveError,
    setShareMessage,
    handleSave,
    handleSaveBody,
    handleAutosave,
    handleFlushPendingSave,
    handleCreateShare,
    handleCopyShareLink,
  };
}
