"use client";
// 에디터 메인 화면: 캔버스·툴바·사이드패널·AI 채팅을 조합하는 최상위 컴포넌트
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { Check, MessageCircle, Redo2, Send, Undo2 } from "lucide-react";

import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoticeBox } from "@/components/ui/notice-box";
import { SurfaceCard } from "@/components/ui/surface-card";
import { EditorCanvasSingle } from "@/features/editor/components/EditorCanvasSingle";
import { EditorSidePanel } from "@/features/editor/components/EditorSidePanel";
import { EditorToolRail } from "@/features/editor/components/EditorToolRail";
import { TagInput } from "@/features/editor/components/TagInput";
import { useEditorMediaSearch } from "@/features/editor/hooks/useEditorMediaSearch";
import { useEditorMeta, moodOptions } from "@/features/editor/hooks/useEditorMeta";
import { useEditorPersistenceActions } from "@/features/editor/hooks/useEditorPersistenceActions";
import { useEditorState } from "@/features/editor/hooks/useEditorState";
import { useEditorTutorial } from "@/features/editor/hooks/useEditorTutorial";
import { loadEditorSession } from "@/features/editor/lib/editor-persistence";
import type { CreateEditorItemInput, EditorSidePanel as EditorSidePanelName, EditorTool, SharedLetterTheme } from "@/features/editor/types/editor.types";
import { DiaryChat } from "@/features/chat/components/DiaryChat";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { formatDiaryDate, formatSaveTime } from "@/lib/date";

interface EditorScreenProps {
  pageId: string;
}

const defaultTextItemFontSize = 16;

const EditorShareModal = dynamic(
  () => import("@/features/editor/components/EditorShareModal").then((m) => m.EditorShareModal),
  { loading: () => null }
);
const EditorTutorialOverlay = dynamic(
  () => import("@/features/editor/components/EditorTutorialOverlay").then((m) => m.EditorTutorialOverlay),
  { loading: () => null }
);

function makeStickerDataUrl(emoji: string, bg: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect x="10" y="10" width="200" height="200" rx="36" fill="${bg}"/><text x="110" y="138" font-size="98" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function EditorScreen({ pageId }: EditorScreenProps) {
  const { state, selectedItem, canUndo, canRedo, addItem, updateItem, removeItem, hydrateItems, selectItem, undo, redo, resetDirty } = useEditorState({ pageId, viewMode: "single" });

  const [activeTool, setActiveTool] = useState<EditorTool>("select");
  const [activePanel, setActivePanel] = useState<EditorSidePanelName>("base");
  const [textDraft, setTextDraft] = useState("새 텍스트");
  const [zoom, setZoom] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [shareRecipientName, setShareRecipientName] = useState("");
  const [shareTheme, setShareTheme] = useState<SharedLetterTheme>("paper");

  const sidebarRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const lastAutosaveSignatureRef = useRef<string | null>(null);

  const meta = useEditorMeta();
  const { activeMoodIndex, moodEmoji, entryTitle, entryTags, bodyHtml, bodyText, isBodyDirty, hasMetaChanges, setActiveMoodIndex, setEntryTitle, handleBodyHtmlChange, handleBodyTextChange, syncFromEntry, commitSnapshot, addTag, removeTag } = meta;

  const hasUnsavedChanges = state.isDirty || hasMetaChanges;

  const currentAutosaveSignature = useMemo(
    () => JSON.stringify({ title: entryTitle, mood: moodEmoji, tags: entryTags, bodyHtml, items: state.items }),
    [entryTitle, moodEmoji, entryTags, bodyHtml, state.items]
  );

  const {
    isSaving, isBodySaving, isAutosaving, isCreatingShare, isSaveSlow,
    saveState, lastSavedAt, sharedLetterUrl, shareMessage, saveMessage, saveError,
    setSaveMessage, setSaveError, handleSave, handleSaveBody, handleAutosave,
    handleFlushPendingSave, handleCreateShare, handleCopyShareLink,
  } = useEditorPersistenceActions({
    pageId,
    title: entryTitle,
    bodyHtml,
    mood: moodEmoji,
    tags: entryTags,
    items: state.items,
    onResetDirty: resetDirty,
    onPersistSuccess: () => {
      commitSnapshot();
      lastAutosaveSignatureRef.current = currentAutosaveSignature;
    },
  });

  const addEditorItem = (input: CreateEditorItemInput) => addItem({ ...input, pageSide: "single" });

  const media = useEditorMediaSearch({
    onAddItem: addEditorItem,
    onError: setSaveError,
    onMessage: setSaveMessage,
  });

  const tutorial = useEditorTutorial({ sidebarRef, canvasRef, panelRef });

  const diaryDate = useMemo(() => formatDiaryDate(pageId), [pageId]);
  const isPersistBusy = isSaving || isBodySaving || isAutosaving;
  const selectedTextItem = selectedItem?.type === "text" ? selectedItem : null;

  const saveStatusLabel = useMemo(() => {
    if (isLoading) return "불러오는 중...";
    if (isSaving || isBodySaving) return "저장 중...";
    if (isAutosaving) return "자동 저장 중...";
    if (isSaveSlow) return "네트워크가 느려 저장이 지연되고 있어요.";
    if (saveState === "error") return "저장에 실패했어요.";
    if (hasUnsavedChanges) return "저장 안 된 변경사항이 있어요.";
    const formattedTime = formatSaveTime(lastSavedAt);
    return formattedTime ? `${formattedTime} 저장됨` : "모든 변경사항이 저장됐어요.";
  }, [hasUnsavedChanges, isAutosaving, isBodySaving, isLoading, isSaveSlow, isSaving, lastSavedAt, saveState]);

  const updateTextItem = (itemId: string, patch: Partial<NonNullable<typeof selectedTextItem>["payload"]["text"]>) => {
    const item = state.items.find((c) => c.id === itemId);
    if (!item || item.type !== "text") return;
    updateItem(itemId, {
      payload: {
        ...item.payload,
        text: {
          content: item.payload.text?.content ?? "새 텍스트",
          fontSize: item.payload.text?.fontSize ?? defaultTextItemFontSize,
          color: item.payload.text?.color ?? "#4F3328",
          fontFamily: item.payload.text?.fontFamily ?? "inherit",
          ...patch,
        },
      },
    });
  };

  const handleAddText = () => {
    addEditorItem({
      type: "text", width: 180, height: 64,
      payload: { text: { content: textDraft.trim() || "새 텍스트", fontSize: defaultTextItemFontSize, color: "#4F3328", fontFamily: "inherit" } },
    });
  };

  const handlePlaceTextAt = (x: number, y: number) => {
    addEditorItem({
      type: "text", x, y, width: 180, height: 64,
      payload: { text: { content: textDraft.trim() || "새 텍스트", fontSize: defaultTextItemFontSize, color: "#4F3328", fontFamily: "inherit" } },
    });
  };

  const handleAddSticker = (emoji: string, bg: string) => {
    addEditorItem({ type: "sticker", width: 110, height: 110, payload: { imageUrl: makeStickerDataUrl(emoji, bg), source: "library" } });
  };

  // Load session
  useEffect(() => {
    let isMounted = true;

    const syncEntry = async () => {
      setIsLoading(true);
      setSaveMessage(null);
      setSaveError(null);

      try {
        const session = await loadEditorSession(pageId);
        if (!isMounted) return;

        syncFromEntry(session.entry, session.entry?.tags ?? []);
        hydrateItems(session.items);
        lastAutosaveSignatureRef.current = null;

        if (session.entry) {
          setSaveMessage(session.items.length > 0 ? `${pageId} 일기와 요소 ${session.items.length}개를 불러왔어요.` : `${pageId} 일기를 불러왔어요.`);
        }
      } catch (error) {
        if (!isMounted) return;
        setSaveError(error instanceof Error ? error.message : "저장된 일기를 불러오는 중 문제가 발생했어요.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void syncEntry();
    return () => { isMounted = false; };
  }, [hydrateItems, pageId, setSaveError, setSaveMessage, syncFromEntry]);

  // Autosave
  useEffect(() => {
    if (isLoading || !hasUnsavedChanges || isSaving || isBodySaving || isAutosaving || isCreatingShare) return;
    if (lastAutosaveSignatureRef.current === currentAutosaveSignature) return;

    const timeout = window.setTimeout(() => {
      lastAutosaveSignatureRef.current = currentAutosaveSignature;
      void handleAutosave();
    }, 1800);

    return () => window.clearTimeout(timeout);
  }, [currentAutosaveSignature, handleAutosave, hasUnsavedChanges, isAutosaving, isBodySaving, isCreatingShare, isLoading, isSaving]);

  // Unload guard
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges && !isSaving && !isAutosaving) return;
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges, isAutosaving, isSaving]);

  // Visibility flush
  useEffect(() => {
    const flush = () => { if (!hasUnsavedChanges || isCreatingShare) return; void handleFlushPendingSave(); };
    const onVisibility = () => { if (document.visibilityState === "hidden") flush(); };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => { window.removeEventListener("pagehide", flush); document.removeEventListener("visibilitychange", onVisibility); };
  }, [handleFlushPendingSave, hasUnsavedChanges, isCreatingShare]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditing = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if (!isEditing && selectedItem && (event.key === "Delete" || event.key === "Backspace")) {
        event.preventDefault();
        removeItem(selectedItem.id);
        return;
      }

      const isMod = event.metaKey || event.ctrlKey;
      if (isMod && event.key === "z" && !event.shiftKey) { event.preventDefault(); undo(); }
      if (isMod && (event.key === "y" || (event.key === "z" && event.shiftKey))) { event.preventDefault(); redo(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [removeItem, selectedItem, undo, redo]);

  return (
    <div className="min-h-screen bg-vellum text-ink">
      <AppHeader
        activeItem="기록"
        showSearch={false}
        actions={
          <>
            <Button size="sm" variant="ghost" aria-label={isChatOpen ? "AI 친구 닫기" : "AI 친구에게 묻기"} aria-pressed={isChatOpen} onClick={() => setIsChatOpen((v) => !v)}>
              <MessageCircle className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" aria-label="실행 취소 (⌘Z)" onClick={undo} disabled={!canUndo}>
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" aria-label="다시 실행 (⌘⇧Z)" onClick={redo} disabled={!canRedo}>
              <Redo2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsShareModalOpen(true)} disabled={isPersistBusy || isCreatingShare}>
              <Send className="mr-ds-1 h-4 w-4" />
              편지 공유
            </Button>
            <Button size="sm" aria-label="일기 저장" aria-busy={isPersistBusy} onClick={handleSave} disabled={isPersistBusy}>
              <Check className="mr-ds-1 h-4 w-4" />
              {isPersistBusy ? "저장 중..." : "저장"}
            </Button>
          </>
        }
      />

      <input ref={media.imageInputRef} type="file" accept="image/*" className="hidden" onChange={media.handleImageFileChange} />

      <main className="flex h-[calc(100vh-64px)] pt-0">
        <EditorToolRail ref={sidebarRef} activePanel={activePanel} onChangePanel={setActivePanel} onChangeTool={setActiveTool} />

        <section className="ml-20 mr-80 flex-1 overflow-y-auto bg-vellum px-ds-8 py-0">
          <div className="mx-auto mb-ds-4 flex max-w-6xl items-center justify-between gap-ds-4">
            <div>
              <h1 className="font-display text-ds-brand font-bold text-ink">{diaryDate}</h1>
              <p className={`mt-ds-1 text-ds-caption ${saveState === "error" ? "text-rose-danger" : hasUnsavedChanges ? "text-cedar" : "text-cedar/80"}`}>
                {saveStatusLabel}
              </p>
            </div>

            <div className="flex gap-ds-2 rounded-full bg-oatmeal p-ds-2">
              {moodOptions.map((icon, index) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setActiveMoodIndex(index)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${activeMoodIndex === index ? "bg-white shadow-sm" : ""}`}
                >
                  <span className="text-ds-title">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          {isLoading ? <NoticeBox className="mx-auto mb-ds-4 max-w-6xl">저장된 일기를 불러오는 중이에요...</NoticeBox> : null}
          {saveMessage && !saveMessage.includes("불러왔어요") ? (
            <NoticeBox tone="success" className="mx-auto mb-ds-4 max-w-6xl">{saveMessage}</NoticeBox>
          ) : null}
          {saveError ? (
            <NoticeBox tone="error" className="mx-auto mb-ds-4 flex max-w-6xl items-center justify-between gap-ds-3">
              <span>{saveError}</span>
              <Button size="sm" variant="outline" onClick={() => void handleSave()} disabled={isPersistBusy}>다시 저장</Button>
            </NoticeBox>
          ) : null}
          {isSaveSlow ? (
            <NoticeBox className="mx-auto mb-ds-4 max-w-6xl">
              네트워크가 느려 저장이 평소보다 오래 걸리고 있어요. 잠시만 기다리거나 직접 다시 저장해보세요.
            </NoticeBox>
          ) : null}

          <SurfaceCard tone="soft" className="mx-auto mb-ds-4 max-w-6xl p-ds-4">
            <label className="mb-ds-2 block text-ds-body font-semibold text-ink">일기 제목</label>
            <Input
              value={entryTitle}
              onChange={(e) => setEntryTitle(e.target.value)}
              placeholder="예: 비 오는 토요일의 산책"
              className="h-12 rounded-2xl border-line bg-paper"
            />
            <div className="mt-ds-3">
              <label className="mb-ds-2 block text-ds-body font-semibold text-ink">태그</label>
              <TagInput tags={entryTags} onAdd={addTag} onRemove={removeTag} />
            </div>
          </SurfaceCard>

          <div ref={canvasRef} className="mx-auto max-w-6xl">
            <ErrorBoundary>
            <EditorCanvasSingle
              background="#fffdf9"
              items={state.items.filter((item) => item.pageSide === "single" || item.pageSide === "left")}
              selectedItemId={state.selectedItemId}
              zoom={zoom}
              activeTool={activeTool}
              diaryText={bodyHtml}
              onDiaryTextChange={handleBodyHtmlChange}
              diaryDate={diaryDate}
              onDiaryDateChange={() => undefined}
              dailyExpense=""
              onDailyExpenseChange={() => undefined}
              onSelectItem={selectItem}
              onMoveItem={(itemId, x, y) => updateItem(itemId, { x, y })}
              onResizeItem={(itemId, width, height) => updateItem(itemId, { width, height })}
              textToolbar={selectedTextItem ?? null}
              onUpdateTextFontSize={(itemId, fontSize) => updateTextItem(itemId, { fontSize })}
              onUpdateTextColor={(itemId, color) => updateTextItem(itemId, { color })}
              onDeleteItem={removeItem}
              onDropAddItem={(input) => addEditorItem({ ...input, pageSide: "single" })}
              onPlaceTextAt={handlePlaceTextAt}
            />
            </ErrorBoundary>
          </div>
        </section>

        <EditorSidePanel
          ref={panelRef}
          activePanel={activePanel}
          bodyText={bodyText}
          isBodyDirty={isBodyDirty}
          isBodySaving={isBodySaving}
          isAutosaving={isAutosaving}
          textDraft={textDraft}
          aiStickerPrompt={media.aiStickerPrompt}
          isGeneratingSticker={media.isGeneratingSticker}
          stickerPreview={media.stickerPreview}
          gifQuery={media.gifQuery}
          gifResults={media.gifResults}
          isSearchingGif={media.isSearchingGif}
          selectedItem={selectedItem}
          selectedTextItem={selectedTextItem}
          zoom={zoom}
          isSaving={isSaving}
          onBodyTextChange={handleBodyTextChange}
          onSaveBody={handleSaveBody}
          onTextDraftChange={setTextDraft}
          onAddText={handleAddText}
          onAiStickerPromptChange={(value) => { media.setAiStickerPrompt(value); media.clearStickerPreview(); }}
          onGenerateAiSticker={() => void media.handleGenerateAiSticker()}
          onAddPreviewSticker={media.handleAddPreviewSticker}
          onClearStickerPreview={media.clearStickerPreview}
          onAddSticker={handleAddSticker}
          onGifQueryChange={(value) => { media.setGifQuery(value); media.clearGifResults(); }}
          onAddImage={media.handleAddImage}
          onAddGif={() => void media.handleSearchGif()}
          onAddGifResult={media.handleAddGifResult}
          onClearGifResults={media.clearGifResults}
          onUpdateItem={updateItem}
          onUpdateTextItem={updateTextItem}
          onRemoveItem={removeItem}
          onChangeZoom={setZoom}
          onSave={handleSave}
        />
      </main>

      {tutorial.isTutorialOpen ? (
        <EditorTutorialOverlay
          step={tutorial.tutorialStep}
          stepIndex={tutorial.tutorialStepIndex}
          layout={tutorial.tutorialBubbleLayout}
          onPrevious={tutorial.goToPreviousTutorialStep}
          onNext={tutorial.goToNextTutorialStep}
        />
      ) : null}

      {isShareModalOpen ? (
        <EditorShareModal
          recipientName={shareRecipientName}
          theme={shareTheme}
          sharedLetterUrl={sharedLetterUrl}
          isCreatingShare={isCreatingShare}
          isSaveLocked={isPersistBusy}
          shareMessage={shareMessage}
          saveError={saveError}
          onChangeRecipientName={setShareRecipientName}
          onChangeTheme={setShareTheme}
          onCreateShare={() => void handleCreateShare({ recipientName: shareRecipientName, theme: shareTheme })}
          onCopyShareLink={() => void handleCopyShareLink()}
          onClose={() => setIsShareModalOpen(false)}
        />
      ) : null}

      <ErrorBoundary fallback={null}>
        <DiaryChat entryDate={pageId} isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      </ErrorBoundary>
    </div>
  );
}
