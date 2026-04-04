'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Minus,
  MousePointer2,
  Plus,
  RotateCcw,
  RotateCw,
  Sticker,
  Type
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EditorCanvasSingle } from '@/features/editor/components/EditorCanvasSingle';
import { EditorCanvasSpread } from '@/features/editor/components/EditorCanvasSpread';
import type { EditorTool } from '@/features/editor/components/EditorTopBar';
import { loadEditorSession, saveEditorSession } from '@/features/editor/lib/editor-persistence';
import { useEditorState } from '@/features/editor/hooks/useEditorState';
import type { CreateEditorItemInput, PageSide } from '@/features/editor/types/editor.types';

interface EditorScreenProps {
  pageId: string;
}

const moodOptions = ['😄', '🙂', '😐', '🙁', '😢'] as const;
const defaultTags = ['일상', '서촌나들이', '기록'] as const;
const stickerPresets = [
  { emoji: '🌼', bg: '#FDE7D3' },
  { emoji: '☕', bg: '#F8DEC1' },
  { emoji: '💌', bg: '#FCD1C1' },
  { emoji: '⭐', bg: '#FCE8A9' }
] as const;
const imagePresets = [
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=900&q=80'
] as const;
const gifPreset = 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExYzc2aTRjMjJ6Mnh6NGczZ3o0ZzA0aTBpYTdqMGZ4bXA1bmtnNWw1eSZlcD12MV9naWZzX3NlYXJjaCZjdD1n/ICOgUNjpvO0PC/giphy.gif';

function formatDiaryDate(pageId: string) {
  const date = new Date(pageId);
  if (Number.isNaN(date.getTime())) return pageId;

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function makeStickerDataUrl(emoji: string, bg: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220"><rect x="10" y="10" width="200" height="200" rx="36" fill="${bg}"/><text x="110" y="138" font-size="98" text-anchor="middle">${emoji}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildBodyHtml(text: string) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return '<p></p>';
  return lines.map((line) => `<p>${line}</p>`).join('');
}

function extractBodyText(bodyHtml: string | null) {
  if (!bodyHtml) return '오늘의 기록을 시작해보세요.';
  const lines = [...bodyHtml.matchAll(/<p>(.*?)<\/p>/g)].map((match) => match[1].trim()).filter(Boolean);
  return lines.join('\n') || '오늘의 기록을 시작해보세요.';
}

export function EditorScreen({ pageId }: EditorScreenProps) {
  const {
    state,
    selectedItem,
    addItem,
    updateItem,
    removeItem,
    replaceItems,
    selectItem,
    setViewMode,
    resetDirty
  } = useEditorState({ pageId, viewMode: 'spread' });

  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [activeMood, setActiveMood] = useState(0);
  const [insertSide, setInsertSide] = useState<PageSide>('left');
  const [zoom, setZoom] = useState(1);
  const [textDraft, setTextDraft] = useState('새 텍스트');
  const [entryTitle, setEntryTitle] = useState('');
  const [bodyText, setBodyText] = useState('오늘의 기록을 시작해보세요.');
  const [entryTags, setEntryTags] = useState<string[]>([...defaultTags]);
  const [imagePresetIndex, setImagePresetIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const diaryDate = useMemo(() => formatDiaryDate(pageId), [pageId]);

  const addEditorItem = (input: CreateEditorItemInput) => {
    addItem({
      ...input,
      pageSide: state.viewMode === 'spread' ? (input.pageSide ?? insertSide) : 'single'
    });
  };

  const handleAddText = (side?: PageSide) => {
    addEditorItem({
      type: 'text',
      pageSide: side,
      width: 180,
      height: 64,
      payload: {
        text: {
          content: textDraft.trim() || '새 텍스트',
          fontSize: 18,
          color: '#4F3328'
        }
      }
    });
  };

  const handlePlaceTextAt = (x: number, y: number, side?: PageSide) => {
    addEditorItem({
      type: 'text',
      pageSide: side,
      x,
      y,
      width: 180,
      height: 64,
      payload: {
        text: {
          content: textDraft.trim() || '새 텍스트',
          fontSize: 18,
          color: '#4F3328'
        }
      }
    });
  };

  const handleAddSticker = (emoji: string, bg: string, side?: PageSide) => {
    addEditorItem({
      type: 'sticker',
      pageSide: side,
      width: 110,
      height: 110,
      payload: {
        imageUrl: makeStickerDataUrl(emoji, bg),
        source: 'library'
      }
    });
  };

  const handleAddImage = (side?: PageSide) => {
    addEditorItem({
      type: 'image',
      pageSide: side,
      width: 220,
      height: 160,
      payload: {
        imageUrl: imagePresets[imagePresetIndex],
        source: 'library',
        mediaType: 'image'
      }
    });

    setImagePresetIndex((prev) => (prev + 1) % imagePresets.length);
  };

  const handleAddGif = (side?: PageSide) => {
    addEditorItem({
      type: 'gif',
      pageSide: side,
      width: 180,
      height: 180,
      payload: {
        imageUrl: gifPreset,
        source: 'library',
        mediaType: 'gif'
      }
    });
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
          const moodIndex = moodOptions.findIndex((mood) => mood === entry.mood);
          setActiveMood(moodIndex >= 0 ? moodIndex : 0);
          setEntryTitle(entry.title ?? '');
          setEntryTags(entry.tags.length > 0 ? entry.tags : [...defaultTags]);
          setBodyText(extractBodyText(entry.bodyHtml));
          setViewMode(entry.viewMode);
          replaceItems(session.items);
          setSaveMessage(
            session.items.length > 0
              ? `${pageId} 일기와 요소 ${session.items.length}개를 불러왔어요.`
              : `${pageId} 일기를 불러왔어요.`
          );
        } else {
          setActiveMood(0);
          setEntryTitle('');
          setEntryTags([...defaultTags]);
          setBodyText('오늘의 기록을 시작해보세요.');
          setViewMode('spread');
          replaceItems([]);
        }
      } catch (error) {
        if (!isMounted) return;
        setSaveError(error instanceof Error ? error.message : '저장된 일기를 불러오는 중 문제가 발생했어요.');
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
  }, [pageId, replaceItems, setViewMode]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    setSaveError(null);

    try {
      await saveEditorSession({
        pageId,
        title: entryTitle.trim() || null,
        bodyHtml: buildBodyHtml(bodyText),
        mood: moodOptions[activeMood],
        tags: entryTags,
        viewMode: state.viewMode,
        status: 'saved',
        items: state.items
      });

      resetDirty();
      setSaveMessage(
        state.items.length > 0
          ? `${pageId} 일기와 요소 ${state.items.length}개를 저장했어요.`
          : `${pageId} 일기를 저장했어요.`
      );
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : '저장 중 문제가 발생했어요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#fdf8f5] text-[#34322f]">
      <header className="fixed top-0 z-50 flex h-16 w-full items-center justify-between border-b border-[#ece7e3] bg-[#fdf8f5]/95 px-8 backdrop-blur">
        <div className="flex items-center gap-12">
          <span className="font-['Epilogue'] text-[2rem] font-bold tracking-tight text-[#34322f]">Memolie</span>
          <nav className="hidden items-center gap-8 md:flex">
            <a className="rounded-lg px-3 py-1 font-semibold text-[#8C6A5D]" href="#">
              기록
            </a>
            <a className="rounded-lg px-3 py-1 text-[#34322f]/70" href="#">
              보관소
            </a>
            <a className="rounded-lg px-3 py-1 text-[#34322f]/70" href="#">
              통계
            </a>
            <a className="rounded-lg px-3 py-1 text-[#34322f]/70" href="#">
              서재
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <Button variant={state.viewMode === 'single' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('single')}>
            1P
          </Button>
          <Button variant={state.viewMode === 'spread' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('spread')}>
            2P
          </Button>
          <Button size="sm" onClick={handleSave} disabled={isSaving}>
            <Check className="mr-1 h-4 w-4" />
            {isSaving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </header>

      <main className="flex h-screen pt-16">
        <aside className="fixed left-0 top-16 z-40 flex h-[calc(100vh-64px)] w-20 flex-col items-center gap-6 rounded-r-[28px] border-r border-[#ece7e3] bg-[#f8f3ef] py-6">
          <button
            type="button"
            onClick={() => setActiveTool('select')}
            className={`rounded-2xl p-3 ${activeTool === 'select' ? 'bg-[#e7e2dd] text-[#8C6A5D]' : 'text-[#6f5c45]'}`}
          >
            <MousePointer2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTool('text');
              handleAddText();
            }}
            className={`rounded-2xl p-3 ${activeTool === 'text' ? 'bg-[#e7e2dd] text-[#8C6A5D]' : 'text-[#6f5c45]'}`}
          >
            <Type className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTool('sticker');
              handleAddSticker('🌼', '#FDE7D3');
            }}
            className={`rounded-2xl p-3 ${activeTool === 'sticker' ? 'bg-[#e7e2dd] text-[#8C6A5D]' : 'text-[#6f5c45]'}`}
          >
            <Sticker className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTool('image');
              handleAddImage();
            }}
            className={`rounded-2xl p-3 ${activeTool === 'image' ? 'bg-[#e7e2dd] text-[#8C6A5D]' : 'text-[#6f5c45]'}`}
          >
            <ImagePlus className="h-5 w-5" />
          </button>

          <button className="mt-auto rounded-2xl p-3 text-[#6f5c45]">
            <ChevronLeft className="h-5 w-5" />
          </button>
        </aside>

        <section className="ml-20 mr-80 flex-1 overflow-y-auto bg-[#fdf8f5] px-8 py-8">
          <div className="mx-auto mb-6 flex max-w-6xl items-center justify-between gap-4">
            <div>
              <h1 className="font-['Epilogue'] text-3xl font-bold tracking-tight text-[#34322f]">{diaryDate}</h1>
              <p className="mt-2 text-sm text-[#6f5c45]">날짜별 일기와 캔버스 요소를 실제 state와 Supabase에 연결한 편집 화면</p>
            </div>

            <div className="flex gap-2 rounded-full bg-[#f8f3ef] p-2">
              {moodOptions.map((icon, index) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setActiveMood(index)}
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${activeMood === index ? 'bg-white shadow-sm' : ''}`}
                >
                  <span className="text-lg">{icon}</span>
                </button>
              ))}
            </div>
          </div>

          {isLoading ? <div className="mx-auto mb-4 max-w-6xl rounded-2xl bg-[#f8f3ef] px-4 py-3 text-sm text-[#8C6A5D]">저장된 일기를 불러오는 중이에요...</div> : null}
          {saveMessage ? <div className="mx-auto mb-4 max-w-6xl rounded-2xl bg-[#f3f0ea] px-4 py-3 text-sm text-[#8C6A5D]">{saveMessage}</div> : null}
          {saveError ? <div className="mx-auto mb-4 max-w-6xl rounded-2xl bg-[#fff1ef] px-4 py-3 text-sm text-[#a83836]">{saveError}</div> : null}

          <div className="mx-auto mb-4 max-w-6xl rounded-2xl border border-[#ece7e3] bg-white/80 p-4">
            <label className="mb-2 block text-sm font-semibold text-[#34322f]">일기 제목</label>
            <Input
              value={entryTitle}
              onChange={(event) => setEntryTitle(event.target.value)}
              placeholder="예: 비 오는 토요일의 산책"
              className="h-12 rounded-2xl border-[#ece7e3] bg-[#fcfaf8]"
            />
          </div>

          <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between rounded-2xl border border-[#ece7e3] bg-white/80 px-4 py-3 text-sm text-[#6f5c45]">
            <span>현재 요소 수: {state.items.length}개</span>
            <span>추가 위치: {state.viewMode === 'spread' ? insertSide : 'single'}</span>
          </div>

          <div className="mx-auto max-w-6xl">
            {state.viewMode === 'spread' ? (
              <EditorCanvasSpread
                background="#fffdf9"
                items={state.items}
                selectedItemId={state.selectedItemId}
                zoom={zoom}
                activeTool={activeTool}
                onSelectItem={selectItem}
                onMoveItem={(itemId, x, y) => updateItem(itemId, { x, y })}
                onDropAddItem={addEditorItem}
                onPlaceTextAt={(x, y, side) => handlePlaceTextAt(x, y, side)}
              />
            ) : (
              <EditorCanvasSingle
                background="#fffdf9"
                items={state.items.filter((item) => item.pageSide === 'single' || item.pageSide === 'left')}
                selectedItemId={state.selectedItemId}
                zoom={zoom}
                activeTool={activeTool}
                diaryText={buildBodyHtml(bodyText)}
                onDiaryTextChange={(html) => setBodyText(extractBodyText(html))}
                diaryDate={diaryDate}
                onDiaryDateChange={() => undefined}
                dailyExpense=""
                onDailyExpenseChange={() => undefined}
                onSelectItem={selectItem}
                onMoveItem={(itemId, x, y) => updateItem(itemId, { x, y })}
                onResizeItem={(itemId, width, height) => updateItem(itemId, { width, height })}
                onDropAddItem={(input) => addEditorItem({ ...input, pageSide: 'single' })}
                onPlaceTextAt={(x, y) => handlePlaceTextAt(x, y, 'single')}
              />
            )}
          </div>
        </section>

        <aside className="fixed right-0 top-16 z-40 flex h-[calc(100vh-64px)] w-80 flex-col overflow-y-auto rounded-l-[28px] border-l border-[#ece7e3] bg-[#fdf8f5]/90 p-6 backdrop-blur">
          <div className="mb-6">
            <h2 className="font-['Epilogue'] text-xl font-bold text-[#34322f]">편집 패널</h2>
            <p className="text-sm text-[#8C6A5D]">여기서 추가한 요소는 `editor_items` 로 저장됩니다.</p>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-[#ece7e3] bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#34322f]">본문</p>
              <textarea
                value={bodyText}
                onChange={(event) => setBodyText(event.target.value)}
                className="min-h-32 w-full rounded-2xl border border-[#ece7e3] bg-[#fcfaf8] p-3 text-sm outline-none"
              />
            </section>

            <section className="rounded-2xl border border-[#ece7e3] bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#34322f]">텍스트 요소 추가</p>
              <Input value={textDraft} onChange={(event) => setTextDraft(event.target.value)} placeholder="캔버스에 올릴 텍스트" />
              <Button className="mt-3 w-full" size="sm" onClick={() => handleAddText()}>
                텍스트 추가
              </Button>
            </section>

            <section className="rounded-2xl border border-[#ece7e3] bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#34322f]">추가 위치</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={insertSide === 'left' ? 'default' : 'outline'} size="sm" onClick={() => setInsertSide('left')}>
                  왼쪽
                </Button>
                <Button variant={insertSide === 'right' ? 'default' : 'outline'} size="sm" onClick={() => setInsertSide('right')}>
                  오른쪽
                </Button>
              </div>
            </section>

            <section className="rounded-2xl border border-[#ece7e3] bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#34322f]">빠른 요소 추가</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => handleAddImage()}>
                  사진 추가
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAddGif()}>
                  GIF 추가
                </Button>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-2">
                {stickerPresets.map((preset) => (
                  <button
                    key={preset.emoji}
                    type="button"
                    onClick={() => handleAddSticker(preset.emoji, preset.bg)}
                    className="grid h-12 place-items-center rounded-2xl text-xl"
                    style={{ backgroundColor: preset.bg }}
                  >
                    {preset.emoji}
                  </button>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[#ece7e3] bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-[#34322f]">선택 요소</p>
                {selectedItem ? <span className="text-xs text-[#8C6A5D]">{selectedItem.type}</span> : null}
              </div>

              {!selectedItem ? (
                <p className="text-sm text-[#6f5c45]">캔버스에서 요소를 선택하면 위치와 크기를 여기서 조절할 수 있어요.</p>
              ) : (
                <div className="space-y-3">
                  {selectedItem.type === 'text' ? (
                    <Input
                      value={selectedItem.payload.text?.content ?? ''}
                      onChange={(event) =>
                        updateItem(selectedItem.id, {
                          payload: {
                            ...selectedItem.payload,
                            text: {
                              content: event.target.value,
                              fontSize: selectedItem.payload.text?.fontSize ?? 18,
                              color: selectedItem.payload.text?.color ?? '#4F3328'
                            }
                          }
                        })
                      }
                    />
                  ) : null}

                  <div className="grid grid-cols-2 gap-2">
                    <Input value={String(Math.round(selectedItem.x))} onChange={(event) => updateItem(selectedItem.id, { x: Number(event.target.value) || 0 })} />
                    <Input value={String(Math.round(selectedItem.y))} onChange={(event) => updateItem(selectedItem.id, { y: Number(event.target.value) || 0 })} />
                    <Input value={String(Math.round(selectedItem.width))} onChange={(event) => updateItem(selectedItem.id, { width: Number(event.target.value) || 40 })} />
                    <Input value={String(Math.round(selectedItem.height))} onChange={(event) => updateItem(selectedItem.id, { height: Number(event.target.value) || 40 })} />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between text-sm text-[#615f5b]">
                      <span>회전</span>
                      <span>{selectedItem.rotation}°</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => updateItem(selectedItem.id, { rotation: selectedItem.rotation - 5 })} className="rounded-full bg-[#f8f3ef] p-2 text-[#6f5c45]">
                        <RotateCcw className="h-4 w-4" />
                      </button>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        value={selectedItem.rotation}
                        onChange={(event) => updateItem(selectedItem.id, { rotation: Number(event.target.value) })}
                        className="flex-1 accent-[#8C6A5D]"
                      />
                      <button type="button" onClick={() => updateItem(selectedItem.id, { rotation: selectedItem.rotation + 5 })} className="rounded-full bg-[#f8f3ef] p-2 text-[#6f5c45]">
                        <RotateCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <Button variant="outline" size="sm" className="w-full" onClick={() => removeItem(selectedItem.id)}>
                    선택 요소 삭제
                  </Button>
                </div>
              )}
            </section>

            <section className="rounded-2xl border border-[#ece7e3] bg-white p-4">
              <p className="mb-3 text-sm font-semibold text-[#34322f]">줌</p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setZoom((prev) => Math.max(0.7, prev - 0.1))} className="rounded-full bg-[#f8f3ef] p-2 text-[#6f5c45]">
                  <Minus className="h-4 w-4" />
                </button>
                <div className="flex-1 text-center text-sm text-[#6f5c45]">{Math.round(zoom * 100)}%</div>
                <button type="button" onClick={() => setZoom((prev) => Math.min(1.3, prev + 0.1))} className="rounded-full bg-[#f8f3ef] p-2 text-[#6f5c45]">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </section>
          </div>

          <Button className="mt-6 h-12 w-full" onClick={handleSave} disabled={isSaving}>
            <Check className="mr-1 h-4 w-4" />
            {isSaving ? '저장 중...' : '저장하기'}
          </Button>

          <button className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[#615f5b]/40">
            <ChevronRight className="h-5 w-5" />
          </button>
        </aside>
      </main>
    </div>
  );
}
