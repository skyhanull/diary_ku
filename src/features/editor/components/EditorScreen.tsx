"use client";

import dynamic from "next/dynamic";
import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { Check, Send } from "lucide-react";

import { AppHeader } from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoticeBox } from "@/components/ui/notice-box";
import { SurfaceCard } from "@/components/ui/surface-card";
import { EditorCanvasSingle } from "@/features/editor/components/EditorCanvasSingle";
import { EditorSidePanel } from "@/features/editor/components/EditorSidePanel";
import { EditorToolRail } from "@/features/editor/components/EditorToolRail";
import { tutorialSteps, type TutorialBubbleLayout } from "@/features/editor/components/editor-tutorial-config";
import { createEditorBodyFromHtml, createEditorBodyFromText, DEFAULT_EDITOR_BODY_TEXT, extractEditorBodyText } from "@/features/editor/lib/editor-body";
import { normalizeEditorImageFile } from "@/features/editor/lib/editor-image";
import { loadEditorSession } from "@/features/editor/lib/editor-persistence";
import { useEditorPersistenceActions } from "@/features/editor/hooks/useEditorPersistenceActions";
import { useEditorState } from "@/features/editor/hooks/useEditorState";
import type { CreateEditorItemInput, EditorSidePanel as EditorSidePanelName, EditorTool, SharedLetterTheme } from "@/features/editor/types/editor.types";

interface EditorScreenProps {
  pageId: string;
}

interface SearchPreviewItem {
  id: string;
  imageUrl: string;
  title?: string;
}

const moodOptions = ["😄", "🙂", "😐", "🙁", "😢"] as const;
const defaultTags = ["일상", "서촌나들이", "기록"] as const;
const workerUrl = process.env.NEXT_PUBLIC_CF_WORKER_URL;
const giphyApiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
const defaultTextItemFontSize = 16;
const EditorShareModal = dynamic(() => import("@/features/editor/components/EditorShareModal").then((module) => module.EditorShareModal), {
  loading: () => null,
});
const EditorTutorialOverlay = dynamic(
  () => import("@/features/editor/components/EditorTutorialOverlay").then((module) => module.EditorTutorialOverlay),
  {
    loading: () => null,
  }
);

interface SavedEditorSnapshot {
  title: string;
  mood: string;
  tags: string[];
  bodyHtml: string;
}

function formatDiaryDate(pageId: string) {
  const date = new Date(pageId);
  if (Number.isNaN(date.getTime())) return pageId;

  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function makeStickerDataUrl(emoji: string, bg: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect x="10" y="10" width="200" height="200" rx="36" fill="${bg}"/><text x="110" y="138" font-size="98" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildAiPrompt(input: string) {
  return input.trim();
}

function areTagsEqual(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function formatSaveTime(timestamp: number | null) {
  if (!timestamp) return null;

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);
}

export function EditorScreen({ pageId }: EditorScreenProps) {
  const { state, selectedItem, addItem, updateItem, removeItem, hydrateItems, selectItem, resetDirty } = useEditorState({ pageId, viewMode: "single" });

  const [activeTool, setActiveTool] = useState<EditorTool>("select");
  const [activePanel, setActivePanel] = useState<EditorSidePanelName>("base");
  const [activeMood, setActiveMood] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [textDraft, setTextDraft] = useState("새 텍스트");
  const [aiStickerPrompt, setAiStickerPrompt] = useState("");
  const [gifQuery, setGifQuery] = useState("");
  const [entryTitle, setEntryTitle] = useState("");
  const [bodyDocument, setBodyDocument] = useState(() => createEditorBodyFromText(DEFAULT_EDITOR_BODY_TEXT));
  const [entryTags, setEntryTags] = useState<string[]>([...defaultTags]);
  const [savedSnapshot, setSavedSnapshot] = useState<SavedEditorSnapshot>(() => ({
    title: "",
    mood: moodOptions[0],
    tags: [...defaultTags],
    bodyHtml: createEditorBodyFromText(DEFAULT_EDITOR_BODY_TEXT).html,
  }));
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSticker, setIsGeneratingSticker] = useState(false);
  const [isSearchingGif, setIsSearchingGif] = useState(false);
  const [stickerPreview, setStickerPreview] = useState<SearchPreviewItem | null>(null);
  const [gifResults, setGifResults] = useState<SearchPreviewItem[]>([]);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStepIndex, setTutorialStepIndex] = useState(0);
  const [tutorialBubbleLayout, setTutorialBubbleLayout] = useState<TutorialBubbleLayout | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareRecipientName, setShareRecipientName] = useState("");
  const [shareTheme, setShareTheme] = useState<SharedLetterTheme>("paper");
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLElement | null>(null);
  const lastAutosaveSignatureRef = useRef<string | null>(null);
  const diaryDate = useMemo(() => formatDiaryDate(pageId), [pageId]);
  const bodyHtml = bodyDocument.html;
  const bodyText = bodyDocument.text;
  const isBodyDirty = bodyHtml !== savedSnapshot.bodyHtml;
  const hasMetaChanges = entryTitle !== savedSnapshot.title || moodOptions[activeMood] !== savedSnapshot.mood || !areTagsEqual(entryTags, savedSnapshot.tags) || bodyHtml !== savedSnapshot.bodyHtml;
  const hasUnsavedChanges = state.isDirty || hasMetaChanges;
  const currentAutosaveSignature = useMemo(
    () =>
      JSON.stringify({
        title: entryTitle,
        mood: moodOptions[activeMood],
        tags: entryTags,
        bodyHtml,
        items: state.items,
      }),
    [activeMood, bodyHtml, entryTags, entryTitle, state.items]
  );
  const selectedTextItem = selectedItem?.type === "text" ? selectedItem : null;
  const tutorialStep = tutorialSteps[tutorialStepIndex];
  const {
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
    handleSave,
    handleSaveBody,
    handleAutosave,
    handleFlushPendingSave,
    handleCreateShare,
    handleCopyShareLink,
  } = useEditorPersistenceActions({
    pageId,
    title: entryTitle,
    bodyHtml,
    mood: moodOptions[activeMood],
    tags: entryTags,
    items: state.items,
    onResetDirty: resetDirty,
    onPersistSuccess: () => {
      setSavedSnapshot({
        title: entryTitle,
        mood: moodOptions[activeMood],
        tags: [...entryTags],
        bodyHtml,
      });
      lastAutosaveSignatureRef.current = currentAutosaveSignature;
    },
  });

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
  const isPersistBusy = isSaving || isBodySaving || isAutosaving;

  const addEditorItem = (input: CreateEditorItemInput) => {
    addItem({
      ...input,
      pageSide: "single",
    });
  };

  const handleAddText = () => {
    addEditorItem({
      type: "text",
      width: 180,
      height: 64,
      payload: {
        text: {
          content: textDraft.trim() || "새 텍스트",
          fontSize: defaultTextItemFontSize,
          color: "#4F3328",
          fontFamily: "inherit",
        },
      },
    });
  };

  const handlePlaceTextAt = (x: number, y: number) => {
    addEditorItem({
      type: "text",
      x,
      y,
      width: 180,
      height: 64,
      payload: {
        text: {
          content: textDraft.trim() || "새 텍스트",
          fontSize: defaultTextItemFontSize,
          color: "#4F3328",
          fontFamily: "inherit",
        },
      },
    });
  };

  const handleAddSticker = (emoji: string, bg: string) => {
    addEditorItem({
      type: "sticker",
      width: 110,
      height: 110,
      payload: {
        imageUrl: makeStickerDataUrl(emoji, bg),
        source: "library",
      },
    });
  };

  const handleAddImage = () => {
    imageInputRef.current?.click();
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveError("이미지 파일만 업로드할 수 있어요.");
      event.target.value = "";
      return;
    }

    try {
      const normalizedImage = await normalizeEditorImageFile(file);
      const aspectRatio = normalizedImage.width / Math.max(1, normalizedImage.height);
      const width = 220;
      const height = Math.max(120, Math.round(width / Math.max(0.5, Math.min(aspectRatio, 2.5))));

      addEditorItem({
        type: "image",
        width,
        height,
        payload: {
          imageUrl: normalizedImage.dataUrl,
          source: "upload",
          mediaType: "image",
          originalFilename: file.name,
        },
      });
      setSaveError(null);
      setSaveMessage(`${file.name} 이미지를 추가했어요.`);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "이미지 업로드 중 문제가 발생했어요.");
    } finally {
      event.target.value = "";
    }
  };

  const handleAddGif = async () => {
    const query = gifQuery.trim();
    if (!query) {
      setSaveError("움짤 검색어를 입력해주세요.");
      return;
    }
    if (!giphyApiKey) {
      setSaveError("GIPHY API 키가 연결되지 않았어요.");
      return;
    }

    setIsSearchingGif(true);
    setSaveError(null);
    setSaveMessage(null);
    setGifResults([]);

    try {
      const params = new URLSearchParams({
        api_key: giphyApiKey,
        q: query,
        limit: "8",
        rating: "g",
        lang: /[ㄱ-ㅎㅏ-ㅣ가-힣]/.test(query) ? "ko" : "en",
      });

      const response = await fetch(`https://api.giphy.com/v1/gifs/search?${params.toString()}`);
      const data = (await response.json()) as {
        data?: Array<{
          id?: string;
          title?: string;
          images?: { fixed_width?: { url?: string }; original?: { url?: string } };
        }>;
      };

      const results =
        data.data
          ?.map((item) => ({
            id: item.id ?? crypto.randomUUID(),
            title: item.title,
            imageUrl: item.images?.fixed_width?.url ?? item.images?.original?.url ?? "",
          }))
          .filter((item) => item.imageUrl) ?? [];

      if (!response.ok || results.length === 0) {
        throw new Error("검색 결과를 찾지 못했어요.");
      }

      setGifResults(results);
      setSaveMessage("움짤 검색 결과를 불러왔어요. 원하는 결과를 선택해보세요.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "움짤 검색 중 문제가 발생했어요.");
    } finally {
      setIsSearchingGif(false);
    }
  };

  const handleGenerateAiSticker = async () => {
    const prompt = buildAiPrompt(aiStickerPrompt);
    if (!prompt) {
      setSaveError("스티커 검색어를 입력해주세요.");
      return;
    }
    if (!workerUrl) {
      setSaveError("AI 스티커 설정이 연결되지 않았어요.");
      return;
    }

    setIsGeneratingSticker(true);
    setSaveError(null);
    setSaveMessage(null);
    setStickerPreview(null);

    try {
      const response = await fetch(workerUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = (await response.json()) as { imageBase64?: string; prompt?: string; error?: string; message?: string };
      if (!response.ok || !data.imageBase64) {
        throw new Error(data.message || data.error || "AI 스티커 생성에 실패했어요.");
      }

      setStickerPreview({
        id: crypto.randomUUID(),
        imageUrl: `data:image/jpeg;base64,${data.imageBase64}`,
        title: data.prompt ?? aiStickerPrompt.trim(),
      });
      setSaveMessage("AI 스티커 결과를 만들었어요. 확인 후 추가해보세요.");
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "AI 스티커 생성 중 문제가 발생했어요.");
    } finally {
      setIsGeneratingSticker(false);
    }
  };

  const handleAddPreviewSticker = () => {
    if (!stickerPreview) return;

    addEditorItem({
      type: "sticker",
      width: 140,
      height: 140,
      payload: {
        imageUrl: stickerPreview.imageUrl,
        source: "ai",
        prompt: stickerPreview.title,
      },
    });
    setSaveMessage("스티커를 추가했어요.");
    setStickerPreview(null);
  };

  const handleAddGifResult = (result: SearchPreviewItem) => {
    addEditorItem({
      type: "gif",
      width: 180,
      height: 180,
      payload: {
        imageUrl: result.imageUrl,
        source: "library",
        mediaType: "gif",
        prompt: gifQuery.trim() || result.title,
      },
    });
    setSaveMessage("움짤을 추가했어요.");
    setGifResults([]);
  };

  useEffect(() => {
    let isMounted = true;

    const syncEntry = async () => {
      setIsLoading(true);
      setSaveMessage(null);
      setSaveError(null);

      try {
        const session = await loadEditorSession(pageId);
        if (!isMounted) return;

        if (session.entry) {
          const entry = session.entry;
          const nextBodyDocument = createEditorBodyFromHtml(entry.bodyHtml);
          const moodIndex = moodOptions.findIndex((mood) => mood === entry.mood);
          setActiveMood(moodIndex >= 0 ? moodIndex : 0);
          setEntryTitle(entry.title ?? "");
          setEntryTags(entry.tags.length > 0 ? entry.tags : [...defaultTags]);
          setBodyDocument(nextBodyDocument);
          setSavedSnapshot({
            title: entry.title ?? "",
            mood: moodIndex >= 0 ? moodOptions[moodIndex] : moodOptions[0],
            tags: entry.tags.length > 0 ? [...entry.tags] : [...defaultTags],
            bodyHtml: nextBodyDocument.html,
          });
          hydrateItems(session.items);
          lastAutosaveSignatureRef.current = null;
          setSaveMessage(session.items.length > 0 ? `${pageId} 일기와 요소 ${session.items.length}개를 불러왔어요.` : `${pageId} 일기를 불러왔어요.`);
        } else {
          setActiveMood(0);
          setEntryTitle("");
          setEntryTags([...defaultTags]);
          const emptyBodyDocument = createEditorBodyFromText(DEFAULT_EDITOR_BODY_TEXT);
          setBodyDocument(emptyBodyDocument);
          setSavedSnapshot({
            title: "",
            mood: moodOptions[0],
            tags: [...defaultTags],
            bodyHtml: emptyBodyDocument.html,
          });
          hydrateItems([]);
          lastAutosaveSignatureRef.current = null;
        }
      } catch (error) {
        if (!isMounted) return;
        setSaveError(error instanceof Error ? error.message : "저장된 일기를 불러오는 중 문제가 발생했어요.");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void syncEntry();

    return () => {
      isMounted = false;
    };
  }, [hydrateItems, pageId, setSaveError, setSaveMessage]);

  useEffect(() => {
    if (isLoading || !hasUnsavedChanges || isSaving || isBodySaving || isAutosaving || isCreatingShare) return;
    if (lastAutosaveSignatureRef.current === currentAutosaveSignature) return;

    const timeout = window.setTimeout(() => {
      lastAutosaveSignatureRef.current = currentAutosaveSignature;
      void handleAutosave();
    }, 1800);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [currentAutosaveSignature, handleAutosave, hasUnsavedChanges, isAutosaving, isBodySaving, isCreatingShare, isLoading, isSaving]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges && !isSaving && !isAutosaving) return;

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges, isAutosaving, isSaving]);

  useEffect(() => {
    const flushPendingChanges = () => {
      if (!hasUnsavedChanges || isCreatingShare) return;
      void handleFlushPendingSave();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPendingChanges();
      }
    };

    window.addEventListener("pagehide", flushPendingChanges);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", flushPendingChanges);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [handleFlushPendingSave, hasUnsavedChanges, isCreatingShare]);

  const updateTextItem = (itemId: string, patch: Partial<NonNullable<typeof selectedTextItem>["payload"]["text"]>) => {
    const item = state.items.find((candidate) => candidate.id === itemId);
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

  useEffect(() => {
    const tutorialSeen = window.localStorage.getItem("memolie-editor-tutorial-seen");
    if (!tutorialSeen) {
      setIsTutorialOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!isTutorialOpen) return;

    const updateTutorialBubbleLayout = () => {
      const bubbleWidth = Math.min(window.innerWidth * 0.92, 440);
      const bubbleHeight = 220;
      const gutter = 24;
      const viewportPadding = 16;

      const target = tutorialStep?.id === "sidebar" ? sidebarRef.current : tutorialStep?.id === "canvas" ? canvasRef.current : panelRef.current;

      if (!target) return;

      const rect = target.getBoundingClientRect();

      if (tutorialStep?.id === "sidebar") {
        setTutorialBubbleLayout({
          left: Math.min(rect.right + gutter, window.innerWidth - bubbleWidth - viewportPadding),
          top: Math.min(Math.max(rect.top + 56, viewportPadding), window.innerHeight - bubbleHeight - viewportPadding),
          arrowSide: "left",
        });
        return;
      }

      if (tutorialStep?.id === "panel") {
        setTutorialBubbleLayout({
          left: Math.max(rect.left - bubbleWidth - gutter, viewportPadding),
          top: Math.min(Math.max(rect.top + 80, viewportPadding), window.innerHeight - bubbleHeight - viewportPadding),
          arrowSide: "right",
        });
        return;
      }

      setTutorialBubbleLayout({
        left: Math.min(Math.max(rect.left + rect.width - bubbleWidth - 32, viewportPadding), window.innerWidth - bubbleWidth - viewportPadding),
        top: Math.min(Math.max(rect.top + 120, viewportPadding), window.innerHeight - bubbleHeight - viewportPadding),
        arrowSide: "right",
      });
    };

    updateTutorialBubbleLayout();
    window.addEventListener("resize", updateTutorialBubbleLayout);
    window.addEventListener("scroll", updateTutorialBubbleLayout, true);

    return () => {
      window.removeEventListener("resize", updateTutorialBubbleLayout);
      window.removeEventListener("scroll", updateTutorialBubbleLayout, true);
    };
  }, [isTutorialOpen, tutorialStep]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedItem) return;

      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
        return;
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        removeItem(selectedItem.id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [removeItem, selectedItem]);

  const closeTutorial = (markSeen = true) => {
    setIsTutorialOpen(false);
    if (markSeen) {
      window.localStorage.setItem("memolie-editor-tutorial-seen", "true");
    }
  };

  const goToNextTutorialStep = () => {
    if (tutorialStepIndex >= tutorialSteps.length - 1) {
      closeTutorial(true);
      return;
    }

    setTutorialStepIndex((prev) => prev + 1);
  };

  const goToPreviousTutorialStep = () => {
    setTutorialStepIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="min-h-screen bg-vellum text-ink">
      <AppHeader
        activeItem="기록"
        showSearch={false}
        actions={
          <>
	            <Button size="sm" variant="outline" onClick={() => setIsShareModalOpen(true)} disabled={isPersistBusy || isCreatingShare}>
	              <Send className="mr-ds-1 h-4 w-4" />
	              편지 공유
	            </Button>
	            <Button size="sm" onClick={handleSave} disabled={isPersistBusy}>
	              <Check className="mr-ds-1 h-4 w-4" />
	              {isPersistBusy ? "저장 중..." : "저장"}
	            </Button>
          </>
        }
      />

      <input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageFileChange} />

      <main className="flex h-[calc(100vh-64px)] pt-0">
        <EditorToolRail ref={sidebarRef} activePanel={activePanel} onChangePanel={setActivePanel} onChangeTool={setActiveTool} />

        <section className="ml-20 mr-80 flex-1 overflow-y-auto bg-vellum px-ds-8 py-0">
	          <div className="mx-auto mb-ds-4 flex max-w-6xl items-center justify-between gap-ds-4">
	            <div>
	              <h1 className="font-display text-ds-brand font-bold text-ink">{diaryDate}</h1>
                <p className={`mt-ds-1 text-ds-caption ${saveState === "error" ? "text-rose-danger" : hasUnsavedChanges ? "text-cedar" : "text-cedar/80"}`}>{saveStatusLabel}</p>
	            </div>

            <div className="flex gap-ds-2 rounded-full bg-oatmeal p-ds-2">
              {moodOptions.map((icon, index) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setActiveMood(index)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${activeMood === index ? "bg-white shadow-sm" : ""}`}
                >
                  <span className="text-ds-title">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          {isLoading ? <NoticeBox className="mx-auto mb-ds-4 max-w-6xl">저장된 일기를 불러오는 중이에요...</NoticeBox> : null}
          {saveMessage && !saveMessage.includes("불러왔어요") ? (
            <NoticeBox tone="success" className="mx-auto mb-ds-4 max-w-6xl">
              {saveMessage}
            </NoticeBox>
          ) : null}
          {saveError ? (
            <NoticeBox tone="error" className="mx-auto mb-ds-4 flex max-w-6xl items-center justify-between gap-ds-3">
              <span>{saveError}</span>
	              <Button size="sm" variant="outline" onClick={() => void handleSave()} disabled={isPersistBusy}>
	                다시 저장
	              </Button>
            </NoticeBox>
          ) : null}
          {isSaveSlow ? (
            <NoticeBox className="mx-auto mb-ds-4 max-w-6xl">
              네트워크가 느려 저장이 평소보다 오래 걸리고 있어요. 잠시만 기다리거나 직접 다시 저장해보세요.
            </NoticeBox>
          ) : null}

          <SurfaceCard tone="soft" className="mx-auto mb-ds-4 max-w-6xl p-ds-4">
            <label className="mb-ds-2 block text-ds-body font-semibold text-ink">일기 제목</label>
            <Input value={entryTitle} onChange={(event) => setEntryTitle(event.target.value)} placeholder="예: 비 오는 토요일의 산책" className="h-12 rounded-2xl border-line bg-paper" />
          </SurfaceCard>

          <div ref={canvasRef} className="mx-auto max-w-6xl">
            <EditorCanvasSingle
              background="#fffdf9"
              items={state.items.filter((item) => item.pageSide === "single" || item.pageSide === "left")}
              selectedItemId={state.selectedItemId}
              zoom={zoom}
              activeTool={activeTool}
              diaryText={bodyHtml}
              onDiaryTextChange={(html) => {
                setBodyDocument((prev) => (prev.html === html ? prev : { ...prev, html }));
                startTransition(() => {
                  setBodyDocument((prev) => {
                    if (prev.html !== html) return prev;
                    const nextText = extractEditorBodyText(html);
                    return prev.text === nextText ? prev : { html, text: nextText };
                  });
                });
              }}
              diaryDate={diaryDate}
              onDiaryDateChange={() => undefined}
              dailyExpense=""
              onDailyExpenseChange={() => undefined}
              onSelectItem={selectItem}
              onMoveItem={(itemId, x, y) => updateItem(itemId, { x, y })}
              onResizeItem={(itemId, width, height) => updateItem(itemId, { width, height })}
              textToolbar={selectedTextItem ? selectedTextItem : null}
              onUpdateTextFontSize={(itemId, fontSize) => updateTextItem(itemId, { fontSize })}
              onUpdateTextColor={(itemId, color) => updateTextItem(itemId, { color })}
              onDeleteItem={removeItem}
              onDropAddItem={(input) => addEditorItem({ ...input, pageSide: "single" })}
              onPlaceTextAt={(x, y) => handlePlaceTextAt(x, y)}
            />
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
          aiStickerPrompt={aiStickerPrompt}
          isGeneratingSticker={isGeneratingSticker}
          stickerPreview={stickerPreview}
          gifQuery={gifQuery}
          gifResults={gifResults}
          isSearchingGif={isSearchingGif}
          selectedItem={selectedItem}
          selectedTextItem={selectedTextItem}
          zoom={zoom}
          isSaving={isSaving}
          onBodyTextChange={(value) => setBodyDocument(createEditorBodyFromText(value))}
          onSaveBody={handleSaveBody}
          onTextDraftChange={setTextDraft}
          onAddText={handleAddText}
          onAiStickerPromptChange={(value) => {
            setAiStickerPrompt(value);
            setStickerPreview(null);
          }}
          onGenerateAiSticker={handleGenerateAiSticker}
          onAddPreviewSticker={handleAddPreviewSticker}
          onClearStickerPreview={() => setStickerPreview(null)}
          onAddSticker={handleAddSticker}
          onGifQueryChange={(value) => {
            setGifQuery(value);
            setGifResults([]);
          }}
          onAddImage={handleAddImage}
          onAddGif={() => void handleAddGif()}
          onAddGifResult={handleAddGifResult}
          onClearGifResults={() => setGifResults([])}
          onUpdateItem={updateItem}
          onUpdateTextItem={updateTextItem}
          onRemoveItem={removeItem}
          onChangeZoom={setZoom}
          onSave={handleSave}
        />
      </main>

      {isTutorialOpen ? <EditorTutorialOverlay step={tutorialStep} stepIndex={tutorialStepIndex} layout={tutorialBubbleLayout} onPrevious={goToPreviousTutorialStep} onNext={goToNextTutorialStep} /> : null}

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
    </div>
  );
}
