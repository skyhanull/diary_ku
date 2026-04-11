"use client";

import { forwardRef } from "react";
import { Check, Minus, Plus, RotateCcw, RotateCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoundIconButton } from "@/components/ui/round-icon-button";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { EditorItem, EditorSidePanel as EditorSidePanelName, TextPayload } from "@/features/editor/types/editor.types";

interface SearchPreviewItem {
  id: string;
  imageUrl: string;
  title?: string;
}

const defaultTextItemFontSize = 16;
const textColorPresets = ["#4F3328", "#8C6A5D", "#D96C6C", "#556B2F", "#365A8C", "#6B4E9B"] as const;
const textFontOptions = [
  { value: "inherit", label: "기본" },
  { value: '"Georgia", serif', label: "Serif" },
  { value: '"Times New Roman", serif', label: "Times" },
  { value: '"Trebuchet MS", sans-serif', label: "Trebuchet" },
  { value: '"Courier New", monospace', label: "Courier" },
  { value: '"Comic Sans MS", cursive', label: "Comic" },
] as const;
const stickerPresets = [
  { emoji: "🌼", bg: "#FDE7D3" },
  { emoji: "☕", bg: "#F8DEC1" },
  { emoji: "💌", bg: "#FCD1C1" },
  { emoji: "⭐", bg: "#FCE8A9" },
] as const;

interface EditorSidePanelProps {
  activePanel: EditorSidePanelName;
  bodyText: string;
  isBodyDirty: boolean;
  isBodySaving: boolean;
  textDraft: string;
  aiStickerPrompt: string;
  isGeneratingSticker: boolean;
  stickerPreview: SearchPreviewItem | null;
  gifQuery: string;
  gifResults: SearchPreviewItem[];
  isSearchingGif: boolean;
  selectedItem: EditorItem | null;
  selectedTextItem: EditorItem | null;
  zoom: number;
  isSaving: boolean;
  onBodyTextChange: (value: string) => void;
  onSaveBody: () => void;
  onTextDraftChange: (value: string) => void;
  onAddText: () => void;
  onAiStickerPromptChange: (value: string) => void;
  onGenerateAiSticker: () => void;
  onAddPreviewSticker: () => void;
  onClearStickerPreview: () => void;
  onAddSticker: (emoji: string, bg: string) => void;
  onGifQueryChange: (value: string) => void;
  onAddImage: () => void;
  onAddGif: () => void;
  onAddGifResult: (result: SearchPreviewItem) => void;
  onClearGifResults: () => void;
  onUpdateItem: (itemId: string, patch: Partial<EditorItem>) => void;
  onUpdateTextItem: (itemId: string, patch: Partial<TextPayload>) => void;
  onRemoveItem: (itemId: string) => void;
  onChangeZoom: (zoom: number) => void;
  onSave: () => void;
}

function panelTitle(panel: EditorSidePanelName) {
  if (panel === "base") return "선택/편집";
  if (panel === "text") return "텍스트 추가";
  if (panel === "sticker") return "스티커";
  return "사진/움짤";
}

function panelDescription(panel: EditorSidePanelName) {
  if (panel === "base") return "선택한 요소를 수정하거나 본문을 정리할 수 있어요.";
  if (panel === "text") return "텍스트를 만들고 배치하기 전에 내용을 먼저 준비해보세요.";
  if (panel === "sticker") return "AI 스티커를 만들거나 기본 스티커를 바로 추가할 수 있어요.";
  return "사진을 올리거나 원하는 움짤을 검색해서 추가할 수 있어요.";
}

export const EditorSidePanel = forwardRef<HTMLElement, EditorSidePanelProps>(
  (
    {
      activePanel,
      bodyText,
      isBodyDirty,
      isBodySaving,
      textDraft,
      aiStickerPrompt,
      isGeneratingSticker,
      stickerPreview,
      gifQuery,
      gifResults,
      isSearchingGif,
      selectedItem,
      selectedTextItem,
      zoom,
      isSaving,
      onBodyTextChange,
      onSaveBody,
      onTextDraftChange,
      onAddText,
      onAiStickerPromptChange,
      onGenerateAiSticker,
      onAddPreviewSticker,
      onClearStickerPreview,
      onAddSticker,
      onGifQueryChange,
      onAddImage,
      onAddGif,
      onAddGifResult,
      onClearGifResults,
      onUpdateItem,
      onUpdateTextItem,
      onRemoveItem,
      onChangeZoom,
      onSave,
    },
    ref,
  ) => {
    return (
      <aside ref={ref} className="fixed right-0 top-16 z-40 flex h-[calc(100vh-64px)] w-80 flex-col overflow-y-auto rounded-l-[28px] border-l border-line bg-vellum/90 p-6 backdrop-blur">
        <div className="mb-ds-6">
          <h2 className="font-display text-ds-title font-bold text-ink">{panelTitle(activePanel)}</h2>
          <p className="text-ds-body text-cedar">{panelDescription(activePanel)}</p>
        </div>

        <div className="space-y-ds-6">
          {activePanel === "base" ? (
            <SurfaceCard className="p-ds-4">
              <div className="mb-ds-3 flex items-center justify-between gap-ds-3">
                <div>
                  <p className="text-ds-body font-semibold text-ink">본문</p>
                </div>
                <Button size="sm" onClick={onSaveBody} disabled={isBodySaving || !isBodyDirty}>
                  {isBodySaving ? "본문 저장 중..." : isBodyDirty ? "본문 저장" : "본문 저장됨"}
                </Button>
              </div>
              <textarea value={bodyText} onChange={(event) => onBodyTextChange(event.target.value)} className="min-h-32 w-full rounded-2xl border border-line bg-paper p-ds-3 text-ds-body outline-none" placeholder="오늘 있었던 일을 편하게 적어보세요." />
              <div className="mt-ds-2 flex items-center justify-between text-ds-caption text-cedar">
                <span>{bodyText.trim().length}자</span>
                <span>{isBodyDirty ? "아직 본문 저장 전" : "본문 저장 완료"}</span>
              </div>
            </SurfaceCard>
          ) : null}

          {activePanel === "text" ? (
            <SurfaceCard className="p-ds-4">
              <p className="mb-ds-1 text-ds-body font-semibold text-ink">텍스트 요소 추가</p>
              <p className="mb-ds-3 text-ds-caption text-cedar">문구를 입력한 뒤 추가하거나, 캔버스를 눌러 원하는 위치에 놓을 수 있어요.</p>
              <Input value={textDraft} onChange={(event) => onTextDraftChange(event.target.value)} placeholder="캔버스에 올릴 텍스트" />
              <Button className="mt-ds-3 w-full" size="sm" onClick={onAddText}>
                텍스트 추가
              </Button>
            </SurfaceCard>
          ) : null}

          {activePanel === "sticker" ? (
            <>
              <SurfaceCard className="p-ds-4">
                <p className="mb-ds-1 text-ds-body font-semibold text-ink">AI 스티커 검색</p>
                <p className="mb-ds-3 text-ds-caption text-cedar">검색어를 넣으면 AI가 스티커 결과를 만들고, 확인 후 추가할 수 있어요.</p>
                <Input value={aiStickerPrompt} onChange={(event) => onAiStickerPromptChange(event.target.value)} placeholder="예: 하트를 든 고양이 스티커" />
                <Button className="mt-ds-3 w-full" size="sm" onClick={onGenerateAiSticker} disabled={isGeneratingSticker}>
                  {isGeneratingSticker ? "스티커 생성 중..." : "AI 스티커 생성"}
                </Button>

                {stickerPreview ? (
                  <div className="mt-ds-4 rounded-2xl border border-line bg-paper p-ds-3">
                    <div className="mb-ds-2 flex items-center justify-between">
                      <p className="text-ds-caption font-semibold text-cedar">생성 결과</p>
                      <button type="button" onClick={onClearStickerPreview} className="text-ds-caption text-cedar">
                        닫기
                      </button>
                    </div>
                    <img src={stickerPreview.imageUrl} alt={stickerPreview.title ?? "AI sticker preview"} className="mx-auto h-32 w-32 rounded-2xl object-cover" />
                    <Button className="mt-ds-3 w-full" size="sm" onClick={onAddPreviewSticker}>
                      이 스티커 추가
                    </Button>
                  </div>
                ) : null}
              </SurfaceCard>

              <SurfaceCard className="p-ds-4">
                <p className="mb-ds-3 text-ds-body font-semibold text-ink">기본 스티커</p>
                <div className="grid grid-cols-4 gap-ds-2">
                  {stickerPresets.map((preset) => (
                    <button key={preset.emoji} type="button" onClick={() => onAddSticker(preset.emoji, preset.bg)} className="grid h-12 place-items-center rounded-2xl text-ds-title" style={{ backgroundColor: preset.bg }}>
                      {preset.emoji}
                    </button>
                  ))}
                </div>
              </SurfaceCard>
            </>
          ) : null}

          {activePanel === "media" ? (
            <SurfaceCard className="p-ds-4">
              <p className="mb-ds-3 text-ds-body font-semibold text-ink">미디어 추가</p>
              <Input value={gifQuery} onChange={(event) => onGifQueryChange(event.target.value)} placeholder="움짤 검색어 예: 고양이, 축하, 커피" />
              <div className="mt-ds-3 grid grid-cols-2 gap-ds-2">
                <Button variant="outline" size="sm" onClick={onAddImage}>
                  사진 추가
                </Button>
                <Button variant="outline" size="sm" onClick={onAddGif} disabled={isSearchingGif}>
                  {isSearchingGif ? "검색 중..." : "움짤 추가"}
                </Button>
              </div>

              {gifResults.length > 0 ? (
                <div className="mt-ds-4">
                  <div className="mb-ds-2 flex items-center justify-between">
                    <p className="text-ds-caption font-semibold text-cedar">검색 결과</p>
                    <button type="button" onClick={onClearGifResults} className="text-ds-caption text-cedar">
                      닫기
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-ds-2">
                    {gifResults.map((result) => (
                      <button key={result.id} type="button" onClick={() => onAddGifResult(result)} className="overflow-hidden rounded-2xl border border-line bg-paper">
                        <img src={result.imageUrl} alt={result.title ?? "GIF result"} className="h-28 w-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}
            </SurfaceCard>
          ) : null}

          {activePanel === "base" ? (
            <SurfaceCard className="p-ds-4">
              <div className="mb-ds-3 flex items-center justify-between">
                <p className="text-ds-body font-semibold text-ink">선택 요소</p>
                {selectedItem ? <span className="text-ds-caption text-cedar">{selectedItem.type}</span> : null}
              </div>

              {!selectedItem ? (
                <div className="rounded-2xl border border-dashed border-line bg-paper p-ds-4 text-ds-body text-ink-warm">
                  <p className="font-medium text-ink-soft">아직 선택된 요소가 없어요.</p>
                  <p className="mt-ds-2">캔버스에서 요소를 눌러 편집하거나, 왼쪽 도구에서 텍스트·스티커·사진/움짤을 추가해보세요.</p>
                </div>
              ) : (
                <div className="space-y-ds-3">
                  {selectedTextItem ? (
                    <section className="rounded-2xl border border-line-pale bg-paper p-ds-3">
                      <div className="mb-ds-3 flex items-center justify-between">
                        <div>
                          <p className="text-ds-body font-semibold text-ink">텍스트 편집</p>
                          <p className="mt-ds-1 text-ds-caption text-cedar">입력하는 즉시 캔버스에 반영돼요.</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => onRemoveItem(selectedTextItem.id)}>
                          <Trash2 className="mr-ds-1 h-4 w-4" />
                          삭제
                        </Button>
                      </div>

                      <textarea value={selectedTextItem.payload.text?.content ?? ""} onChange={(event) => onUpdateTextItem(selectedTextItem.id, { content: event.target.value })} className="min-h-28 w-full rounded-2xl border border-line bg-white p-ds-3 text-ds-body outline-none" placeholder="텍스트 내용을 입력하세요." />

                      <div className="mt-ds-3 grid grid-cols-[1fr_auto] items-center gap-ds-3">
                        <label className="text-ds-caption font-semibold text-ink-warm">글자 크기</label>
                        <Input
                          type="number"
                          min={12}
                          max={72}
                          value={String(selectedTextItem.payload.text?.fontSize ?? defaultTextItemFontSize)}
                          onChange={(event) => {
                            const nextValue = Number(event.target.value);
                            if (!Number.isFinite(nextValue)) return;
                            onUpdateTextItem(selectedTextItem.id, { fontSize: Math.max(12, Math.min(72, nextValue)) });
                          }}
                          className="h-9 w-20 text-center"
                        />
                      </div>

                      <input type="range" min={12} max={72} value={selectedTextItem.payload.text?.fontSize ?? defaultTextItemFontSize} onChange={(event) => onUpdateTextItem(selectedTextItem.id, { fontSize: Number(event.target.value) })} className="mt-ds-2 w-full accent-cedar" />

                      <div className="mt-ds-4">
                        <div className="mb-ds-3 flex items-center justify-between">
                          <label className="text-ds-caption font-semibold text-ink-warm">폰트</label>
                          <select value={selectedTextItem.payload.text?.fontFamily ?? "inherit"} onChange={(event) => onUpdateTextItem(selectedTextItem.id, { fontFamily: event.target.value })} className="h-9 rounded-xl border border-line bg-white px-ds-3 text-ds-body text-ink outline-none">
                            {textFontOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mb-ds-2 flex items-center justify-between">
                          <label className="text-ds-caption font-semibold text-ink-warm">글자 색상</label>
                          <div className="flex items-center gap-ds-2">
                            <input type="color" value={selectedTextItem.payload.text?.color ?? "#4F3328"} onChange={(event) => onUpdateTextItem(selectedTextItem.id, { color: event.target.value })} className="h-9 w-12 cursor-pointer rounded border border-line bg-white p-1" />
                            <span className="text-ds-caption text-cedar">{selectedTextItem.payload.text?.color ?? "#4F3328"}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-6 gap-ds-2">
                          {textColorPresets.map((color) => (
                            <button key={color} type="button" onClick={() => onUpdateTextItem(selectedTextItem.id, { color })} className={`h-8 rounded-full border ${selectedTextItem.payload.text?.color === color ? "border-ink" : "border-transparent"}`} style={{ backgroundColor: color }} aria-label={`텍스트 색상 ${color}`} />
                          ))}
                        </div>
                      </div>
                    </section>
                  ) : null}

                  <div className="grid grid-cols-2 gap-ds-2">
                    <Input value={String(Math.round(selectedItem.x))} onChange={(event) => onUpdateItem(selectedItem.id, { x: Number(event.target.value) || 0 })} />
                    <Input value={String(Math.round(selectedItem.y))} onChange={(event) => onUpdateItem(selectedItem.id, { y: Number(event.target.value) || 0 })} />
                    <Input value={String(Math.round(selectedItem.width))} onChange={(event) => onUpdateItem(selectedItem.id, { width: Number(event.target.value) || 40 })} />
                    <Input value={String(Math.round(selectedItem.height))} onChange={(event) => onUpdateItem(selectedItem.id, { height: Number(event.target.value) || 40 })} />
                  </div>

                  <div>
                    <div className="mb-ds-2 flex items-center justify-between text-ds-body text-ink-muted">
                      <span>회전</span>
                      <span>{selectedItem.rotation}°</span>
                    </div>
                    <div className="flex items-center gap-ds-3">
                      <RoundIconButton type="button" onClick={() => onUpdateItem(selectedItem.id, { rotation: selectedItem.rotation - 5 })}>
                        <RotateCcw className="h-4 w-4" />
                      </RoundIconButton>
                      <input type="range" min={-180} max={180} value={selectedItem.rotation} onChange={(event) => onUpdateItem(selectedItem.id, { rotation: Number(event.target.value) })} className="flex-1 accent-cedar" />
                      <RoundIconButton type="button" onClick={() => onUpdateItem(selectedItem.id, { rotation: selectedItem.rotation + 5 })}>
                        <RotateCw className="h-4 w-4" />
                      </RoundIconButton>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full" onClick={() => onRemoveItem(selectedItem.id)}>
                    선택 요소 삭제
                  </Button>
                </div>
              )}
            </SurfaceCard>
          ) : null}

          <SurfaceCard className="p-ds-4">
            <p className="mb-ds-3 text-ds-body font-semibold text-ink">줌</p>
            <div className="flex items-center gap-ds-3">
              <RoundIconButton type="button" onClick={() => onChangeZoom(Math.max(0.7, zoom - 0.1))}>
                <Minus className="h-4 w-4" />
              </RoundIconButton>
              <div className="flex-1 text-center text-ds-body text-ink-warm">{Math.round(zoom * 100)}%</div>
              <RoundIconButton type="button" onClick={() => onChangeZoom(Math.min(1.3, zoom + 0.1))}>
                <Plus className="h-4 w-4" />
              </RoundIconButton>
            </div>
          </SurfaceCard>
        </div>

        <Button className="mt-ds-6 h-12 w-full" onClick={onSave} disabled={isSaving}>
          <Check className="mr-ds-1 h-4 w-4" />
          {isSaving ? "저장 중..." : "저장하기"}
        </Button>
      </aside>
    );
  },
);

EditorSidePanel.displayName = "EditorSidePanel";
