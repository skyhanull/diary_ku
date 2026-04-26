"use client";
// 에디터 저장 훅: 수동/자동저장, 임베딩 갱신, 공유 링크 생성 등 저장 관련 액션을 담당한다
import { useCallback, useRef, useState } from "react";

import { createEditorSaveFlowController } from "@/features/editor/lib/editor-save-flow";
import { createSharedLetter, saveEditorSession } from "@/features/editor/lib/editor-persistence";
import { supabase } from "@/lib/supabase";
import type { EditorItem, SharedLetterTheme } from "@/features/editor/types/editor.types";

// HTML 태그를 제거하고 공백을 정규화해 순수 텍스트를 반환한다
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

// 훅에 주입할 에디터 현재 상태와 콜백을 정의하는 입력 타입
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

// 공유 편지 생성 시 필요한 수신인 이름과 테마를 담는 타입
interface CreateShareInput {
  recipientName: string;
  theme: SharedLetterTheme;
}

// 저장·자동저장·공유 링크 생성 액션과 관련 UI 상태를 제공하는 훅
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

  // 저장 성공 후 RAG 검색용 임베딩을 갱신한다.
  // 저장 자체는 막지 않아야 해서 실패해도 조용히 넘기고, 5xx만 1회 재시도한다.
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

  // 현재 에디터 상태를 Supabase 저장 형식으로 묶어 persistence 레이어로 넘긴다.
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
      // manual/body/autosave 요청이 겹칠 수 있어서 "마지막 요청만" UI 상태를 갱신하게 한다.
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
          // 저장이 실제로 끝난 뒤에만 dirty 스냅샷과 저장 시각을 갱신한다.
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

  // 탭 숨김/이탈 직전에 호출되는 플러시용 저장.
  // 이미 다른 저장이 돌고 있으면 중복 호출을 피한다.
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
        // 공유는 "현재 편집 중 상태"를 원본과 분리된 스냅샷으로 한 번 더 저장한다.
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
