'use client';

import { useMemo, useState } from 'react';
import { Camera, Eye, Hand, Layers, MousePointer2, PenLine, Redo2, Search, Share2, Sticker, Triangle, Undo2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EditorCanvasSingle } from '@/features/editor/components/EditorCanvasSingle';
import { useEditorState } from '@/features/editor/hooks/useEditorState';
import type { EditorTool } from '@/features/editor/components/EditorTopBar';

interface EditorScreenProps {
  pageId: string;
}

const notebookThemes = [
  {
    id: 'paper',
    name: 'Paper Light',
    workspaceBg: '#f5f4f1',
    workspacePattern: 'radial-gradient(circle at 1px 1px, rgba(150,150,150,0.12) 1px, transparent 1.2px)',
    paperBg: '#ffffff',
    paperBorder: '#e2dfd7',
    lineColor: 'rgba(168,168,168,0.42)',
    marginColor: 'rgba(216,128,128,0.48)',
    textColor: '#2c2c2c'
  },
  {
    id: 'cream',
    name: 'Warm Cream',
    workspaceBg: '#efe9dc',
    workspacePattern: 'radial-gradient(circle at 1px 1px, rgba(180,160,120,0.14) 1px, transparent 1.2px)',
    paperBg: '#fffdf6',
    paperBorder: '#e0d3ac',
    lineColor: 'rgba(170,150,120,0.45)',
    marginColor: 'rgba(214,112,112,0.45)',
    textColor: '#4b2e1f'
  },
  {
    id: 'mint',
    name: 'Mint Dot',
    workspaceBg: '#eef4ef',
    workspacePattern: 'radial-gradient(circle at 1px 1px, rgba(112,148,125,0.14) 1px, transparent 1.2px)',
    paperBg: '#fbfffc',
    paperBorder: '#c8ddcd',
    lineColor: 'rgba(135,160,145,0.45)',
    marginColor: 'rgba(197,128,128,0.42)',
    textColor: '#264036'
  }
] as const;

const stickerSet = [
  { emoji: '💗', bg: '#ffe4e6' },
  { emoji: '⭐', bg: '#fef3c7' },
  { emoji: '⚙️', bg: '#ffedd5' },
  { emoji: '🌙', bg: '#ede9fe' },
  { emoji: '☁️', bg: '#dbeafe' },
  { emoji: '☕', bg: '#fde68a' },
  { emoji: '🎵', bg: '#f5d0fe' },
  { emoji: '📷', bg: '#ddd6fe' },
  { emoji: '😊', bg: '#fef9c3' },
  { emoji: '🎁', bg: '#fbcfe8' },
  { emoji: '🏰', bg: '#fecdd3' },
  { emoji: '🎧', bg: '#e9d5ff' }
];

export function EditorScreen({ pageId }: EditorScreenProps) {
  const { state, selectedItem, addItem, updateItem, selectItem, resetDirty } = useEditorState({ pageId });
  const [isSaving, setIsSaving] = useState(false);
  const [diaryText, setDiaryText] = useState('');
  const [diaryDate, setDiaryDate] = useState('2026. 02. 15');
  const [dailyExpense, setDailyExpense] = useState('');
  const [aiPrompt, setAiPrompt] = useState('cute cat sticker');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [themeId, setThemeId] = useState<(typeof notebookThemes)[number]['id']>('paper');
  const currentTheme = notebookThemes.find((theme) => theme.id === themeId) ?? notebookThemes[0];
  const spawnX = 40;
  const spawnY = 40;
  const singleModeItems = useMemo(
    () => state.items.filter((item) => item.pageSide === 'single' || item.pageSide === 'left'),
    [state.items]
  );


  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 450));
      resetDirty();
    } finally {
      setIsSaving(false);
    }
  };

  const handlePlaceTextAt = (_x: number, _y: number) => {};

  const buildAiPrompt = (rawPrompt: string) => {
    const prompt = rawPrompt.trim();
    const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(prompt);
    if (!hasKorean) return prompt;

    const dictionary: Array<[RegExp, string]> = [
      [/고양이|냥이/g, 'cat'],
      [/강아지|개/g, 'dog'],
      [/토끼/g, 'rabbit'],
      [/곰/g, 'bear'],
      [/펭귄/g, 'penguin'],
      [/하트/g, 'heart'],
      [/별/g, 'star'],
      [/달/g, 'moon'],
      [/구름/g, 'cloud'],
      [/커피|라떼/g, 'coffee'],
      [/책/g, 'book'],
      [/꽃/g, 'flower'],
      [/케이크/g, 'cake'],
      [/생일/g, 'birthday'],
      [/음악|노래/g, 'music note'],
      [/웃는|웃음|행복한/g, 'smiling'],
      [/귀여운|귀엽/g, 'cute'],
      [/핑크/g, 'pink'],
      [/파란|파랑|블루/g, 'blue'],
      [/노란|노랑|옐로/g, 'yellow'],
      [/초록|그린/g, 'green'],
      [/보라/g, 'purple']
    ];

    let translated = prompt.toLowerCase();
    for (const [pattern, replacement] of dictionary) {
      translated = translated.replace(pattern, replacement);
    }

    const cleaned = translated
      .replace(/[^a-z0-9\s,]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const fallback = 'cute diary sticker';
    return `${cleaned || fallback}, cute, kawaii, simple vector icon`;
  };

  const makeStickerDataUrl = (emoji: string, bg: string) => {
    const svg = `<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"220\" height=\"220\"><rect x=\"10\" y=\"10\" width=\"200\" height=\"200\" rx=\"36\" fill=\"${bg}\"/><text x=\"110\" y=\"138\" font-size=\"98\" text-anchor=\"middle\">${emoji}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const handleAddSticker = (emoji: string, bg: string) => {
    addItem({
      type: 'sticker',
      pageSide: 'single',
      width: 110,
      height: 110,
      payload: {
        text: { content: emoji, fontSize: 48, color: bg },
        imageUrl: makeStickerDataUrl(emoji, bg)
      }
    });
  };

  const handleAddPhoto = () => {
    addItem({
      type: 'image',
      pageSide: 'single',
      x: spawnX,
      y: spawnY,
      width: 220,
      height: 160,
      payload: {
        imageUrl: 'https://placehold.co/600x400/fde68a/92400e?text=Photo'
      }
    });
  };

  const handleAddShape = (shape: string, color: string) => {
    const size = shape === 'circle' ? 100 : 120;
    addItem({
      type: 'sticker',
      pageSide: 'single',
      width: size,
      height: size,
      payload: {
        imageUrl: `https://placehold.co/${size * 2}x${size * 2}/${color.replace('#', '')}/transparent?text=+`
      }
    });
  };

  const handleGenerateAiSticker = async () => {
    const workerUrl = process.env.NEXT_PUBLIC_CF_WORKER_URL;
    if (!workerUrl) {
      setAiError('NEXT_PUBLIC_CF_WORKER_URL 설정이 필요해요.');
      return;
    }

    if (!aiPrompt.trim()) {
      setAiError('프롬프트를 입력해주세요.');
      return;
    }

    const preparedPrompt = buildAiPrompt(aiPrompt);
    setAiLoading(true);
    setAiError(null);

    try {
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ prompt: preparedPrompt })
      });

      const data = (await response.json()) as { imageBase64?: string; error?: string; message?: string };
      if (!response.ok || !data.imageBase64) {
        throw new Error(data.message || data.error || 'AI sticker generation failed');
      }

      addItem({
        type: 'sticker',
        pageSide: 'single',
        width: 150,
        height: 150,
        payload: {
          imageUrl: `data:image/jpeg;base64,${data.imageBase64}`
        }
      });
    } catch (error) {
      setAiError(error instanceof Error ? error.message : '알 수 없는 에러가 발생했어요.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1380px] px-4 py-4">
      <div className="overflow-x-auto">
      <div className="min-w-[1120px] rounded-xl border border-[#dedad1] bg-[#f5f3ee] shadow-sm">
        <header className="flex items-center justify-between border-b border-[#e7e3da] px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="grid h-6 w-6 place-items-center rounded-full bg-[#c8b796] text-xs font-bold text-white">D</div>
            <div className="text-sm font-bold text-[#4c473f]">My Daily Log</div>
            <span className="rounded-full bg-[#e9f6ea] px-2 py-0.5 text-[11px] font-medium text-[#4c8c62]">Auto-saved</span>
            <span className="text-xs text-[#8a867f]">Last edited just now</span>
          </div>

          <div className="flex items-center gap-1">
            <button className="grid h-8 w-8 place-items-center rounded-md text-[#8a867f] hover:bg-white">
              <Undo2 className="h-4 w-4" />
            </button>
            <button className="grid h-8 w-8 place-items-center rounded-md text-[#8a867f] hover:bg-white">
              <Redo2 className="h-4 w-4" />
            </button>
            <button className="grid h-8 w-8 place-items-center rounded-md text-[#8a867f] hover:bg-white">
              <Eye className="h-4 w-4" />
            </button>
            <Button size="sm" variant="outline" onClick={handleSave} disabled={isSaving || !state.isDirty}>
              Save Entry
            </Button>
            <Button size="sm" className="bg-[#7b6a52] text-white hover:bg-[#66563f]">
              <Share2 className="mr-1 h-4 w-4" /> 공유
            </Button>
          </div>
        </header>

        <div className="relative isolate flex min-h-[760px] flex-row flex-nowrap">
          <aside
            className="shrink-0 border-r border-[#e7e3da] bg-[#f9f8f5] p-2"
            style={{ flex: '0 0 10%' }}
          >
            <div className="space-y-2">
              <button className="grid h-8 w-8 place-items-center rounded-md bg-white text-[#7a7770] shadow-sm">
                <MousePointer2 className="h-4 w-4" />
              </button>
              <button className="grid h-8 w-8 place-items-center rounded-md text-[#8f8b84] hover:bg-white">
                <Hand className="h-4 w-4" />
              </button>
              <button className="grid h-8 w-8 place-items-center rounded-md text-[#8f8b84] hover:bg-white">
                <PenLine className="h-4 w-4" />
              </button>
              <button className="grid h-8 w-8 place-items-center rounded-md text-[#8f8b84] hover:bg-white">
                <Layers className="h-4 w-4" />
              </button>
            </div>
          </aside>

          <section
            className="relative shrink-0 overflow-hidden border-r border-[#e7e3da] bg-[#f2f0eb] p-4"
            style={{ flex: '0 0 80%', contain: 'paint', zIndex: 1 }}
          >
            <EditorCanvasSingle
              background="#fffdf7"
              items={singleModeItems}
              selectedItemId={state.selectedItemId}
              zoom={1}
              activeTool={'select' as EditorTool}
              notebookTheme={currentTheme}
              diaryText={diaryText}
              onDiaryTextChange={setDiaryText}
              diaryDate={diaryDate}
              onDiaryDateChange={setDiaryDate}
              dailyExpense={dailyExpense}
              onDailyExpenseChange={setDailyExpense}
              onSelectItem={selectItem}
              onMoveItem={(itemId, x, y) => {
                if (state.selectedItemId !== itemId) return;
                updateItem(itemId, { x, y });
              }}
              onResizeItem={(itemId, width, height) => {
                if (state.selectedItemId !== itemId) return;
                updateItem(itemId, { width, height });
              }}
              onDropAddItem={(input) => addItem({ ...input, pageSide: 'single' })}
              onPlaceTextAt={handlePlaceTextAt}
              notebookVariant
            />

            <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2">
              <div className="flex items-center gap-3 rounded-full border border-[#e2ded5] bg-white/90 px-3 py-1.5 text-xs text-[#6f6a60] shadow">
                <span>-</span>
                <span>100%</span>
                <span>+</span>
              </div>
            </div>
          </section>

          <aside
            className="relative z-20 shrink-0 overflow-y-auto bg-[#faf9f6] p-4"
            style={{ flex: '0 0 10%' }}
          >
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[#4a4a4a]">Decorate</p>
                <button className="text-[#9b968d]">
                  <Search className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1 rounded-lg bg-[#f0ede7] p-1 text-[11px]">
                <button className="rounded-md bg-white px-2 py-1 font-semibold text-[#5d5850]">Stickers</button>
                <button className="rounded-md px-2 py-1 text-[#8f8a82]">Text</button>
                <button className="rounded-md px-2 py-1 text-[#8f8a82]">Photos</button>
              </div>

              <div className="space-y-2 rounded-lg border border-[#e5e0d6] bg-white p-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8e887d]">AI Sticker</p>
                <input
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  placeholder="예: cute rabbit with coffee"
                  className="w-full rounded-md border border-[#dfd9cc] px-2 py-1.5 text-xs outline-none focus:border-[#b7aa92]"
                />
                <button
                  type="button"
                  onClick={handleGenerateAiSticker}
                  disabled={aiLoading}
                  className="w-full rounded-md bg-[#7b6a52] px-2 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {aiLoading ? '생성 중...' : 'AI 스티커 만들기'}
                </button>
                {aiError ? <p className="text-[11px] text-red-600">{aiError}</p> : null}
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#9b968d]">Paper Themes</p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {notebookThemes.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setThemeId(theme.id)}
                      className={`min-w-[92px] rounded-md border px-2 py-2 text-xs ${
                        theme.id === themeId
                          ? 'border-[#7f6a4c] bg-[#f6f2ea] text-[#4e4434]'
                          : 'border-[#e3dfd7] bg-white text-[#6b6357]'
                      }`}
                    >
                      <span className="block truncate">{theme.name}</span>
                      <span className="mx-auto mt-1 block h-2 w-10 rounded" style={{ backgroundColor: theme.paperBg }} />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-[#d9466f]">
                  <Sticker className="h-3.5 w-3.5" /> 스티커
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {stickerSet.map((sticker) => (
                    <button
                      key={sticker.emoji}
                      type="button"
                      className="grid h-11 w-11 place-items-center rounded-lg text-lg"
                      style={{ backgroundColor: sticker.bg }}
                      onClick={() => handleAddSticker(sticker.emoji, sticker.bg)}
                    >
                      {sticker.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-[#d97706]">
                  <Camera className="h-3.5 w-3.5" /> 사진
                </p>
                <button
                  type="button"
                  onClick={handleAddPhoto}
                  className="grid h-20 w-full place-items-center rounded-lg border border-dashed border-[#d9d2c4] bg-white text-[#7a6c58]"
                >
                  <span className="text-2xl leading-none">+</span>
                  <span className="text-sm">Upload Photos</span>
                </button>
              </div>

              <div>
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-[#d97706]">
                  <Triangle className="h-3.5 w-3.5" /> 도형
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddShape('rectangle', '#fef3c7')}
                    className="h-12 w-12 rounded-lg border border-[#e3dfd3]"
                    style={{ backgroundColor: '#fef3c7' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddShape('circle', '#fbcfe8')}
                    className="h-12 w-12 rounded-full border border-[#e3dfd3]"
                    style={{ backgroundColor: '#fbcfe8' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddShape('rectangle', '#ddd6fe')}
                    className="h-12 w-12 rounded-lg border border-[#e3dfd3]"
                    style={{ backgroundColor: '#ddd6fe' }}
                  />
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>
      </div>

      {selectedItem ? (
        <section className="mt-3 rounded-md border border-[#e7e2d8] bg-[#fbfaf7] p-3 text-xs text-[#6b3f1d]">
          선택됨: {selectedItem.type} / x:{Math.round(selectedItem.x)} y:{Math.round(selectedItem.y)}
        </section>
      ) : null}
    </main>
  );
}
