'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Eye, Redo2, RotateCcw, Undo2 } from 'lucide-react';
import type { Editor as TiptapEditor } from '@tiptap/core';

import { Button } from '@/components/ui/button';
import { EditorCanvasSingle } from '@/features/editor/components/EditorCanvasSingle';
import { useEditorState } from '@/features/editor/hooks/useEditorState';
import type { EditorTool } from '@/features/editor/components/EditorTopBar';

interface EditorScreenProps {
  pageId: string;
}

type CustomPaperColors = {
  workspaceBg: string;
  paperBg: string;
  paperBorder: string;
  lineColor: string;
  marginColor: string;
  textColor: string;
};

const toPickerColor = (value: string) => {
  if (value.startsWith('#')) return value;
  const rgbaMatch = value.match(/rgba?\(([^)]+)\)/i);
  if (!rgbaMatch) return '#000000';
  const [r, g, b] = rgbaMatch[1]
    .split(',')
    .slice(0, 3)
    .map((part) => Number.parseInt(part.trim(), 10))
    .map((channel) => clampChannel(channel));

  const hex = [r, g, b]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('');
  return `#${hex}`;
};

const clampChannel = (value: number) => Math.min(255, Math.max(0, Number.isNaN(value) ? 0 : value));

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

const moodEmojis = [
  { emoji: '🙂', bg: '#fef3c7' },
  { emoji: '😉', bg: '#fef3c7' },
  { emoji: '😄', bg: '#fef3c7' },
  { emoji: '😀', bg: '#fef3c7' },
  { emoji: '🤓', bg: '#fef3c7' },
  { emoji: '😢', bg: '#fef3c7' }
];

const fontOptions = [
  { id: 'sans', label: 'Noto Sans', fontFamily: '"Noto Sans KR", "Apple SD Gothic Neo", sans-serif' },
  { id: 'serif', label: 'Noto Serif', fontFamily: '"Noto Serif KR", Georgia, serif' },
  { id: 'pen', label: 'Nanum Pen', fontFamily: '"Nanum Pen Script", "Patrick Hand", cursive' },
  { id: 'batang', label: 'Gowun Batang', fontFamily: '"Gowun Batang", "Times New Roman", serif' },
  { id: 'pretendard', label: 'Pretendard', fontFamily: '"Pretendard", "Noto Sans KR", sans-serif' }
] as const;

export function EditorScreen({ pageId }: EditorScreenProps) {
  const { state, selectedItem, addItem, updateItem, removeItem, selectItem, resetDirty } = useEditorState({ pageId });
  const [isSaving, setIsSaving] = useState(false);
  const [diaryText, setDiaryText] = useState('');
  const [diaryDate, setDiaryDate] = useState('2026. 02. 15');
  const [dailyExpense, setDailyExpense] = useState('');
  const [aiPrompt, setAiPrompt] = useState('cute cat sticker');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [gifQuery, setGifQuery] = useState('');
  const [gifResults, setGifResults] = useState<Array<{ id: string; url: string; preview: string }>>([]);
  const [gifLoading, setGifLoading] = useState(false);
  const [gifError, setGifError] = useState<string | null>(null);
  const [gifPage, setGifPage] = useState(0);
  const [gifOffset, setGifOffset] = useState(0);
  const [gifHasMore, setGifHasMore] = useState(false);
  const [gifLoadingMore, setGifLoadingMore] = useState(false);
  const GIF_PER_PAGE = 4;
  const GIF_FETCH_SIZE = 24;
  const currentTheme = notebookThemes[0];
  const [customColors, setCustomColors] = useState<CustomPaperColors>(() => ({
    workspaceBg: toPickerColor(currentTheme.workspaceBg),
    paperBg: toPickerColor(currentTheme.paperBg),
    paperBorder: toPickerColor(currentTheme.paperBorder),
    lineColor: toPickerColor(currentTheme.lineColor),
    marginColor: toPickerColor(currentTheme.marginColor),
    textColor: toPickerColor(currentTheme.textColor)
  }));
  const spawnX = 40;
  const spawnY = 40;
  const [sidebarTab, setSidebarTab] = useState<'stickers' | 'text' | 'photos'>('text');
  const [selectedFontId, setSelectedFontId] = useState<(typeof fontOptions)[number]['id']>('sans');
  const diaryEditorRef = useRef<TiptapEditor | null>(null);

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

  const handleSearchGif = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
    if (!apiKey) {
      setGifError('NEXT_PUBLIC_GIPHY_API_KEY 설정이 필요해요.');
      return;
    }

    const query = gifQuery.trim();
    if (!query) {
      setGifError('검색어를 입력해주세요.');
      return;
    }

    setGifLoading(true);
    setGifError(null);

    try {
      const params = new URLSearchParams({
        api_key: apiKey,
        q: query,
        limit: String(GIF_FETCH_SIZE),
        offset: '0',
        rating: 'g'
      });
      setGifPage(0);
      setGifOffset(GIF_FETCH_SIZE);
      const response = await fetch(`https://api.giphy.com/v1/stickers/search?${params}`);
      const data = (await response.json()) as {
        data?: Array<{
          id: string;
          images: {
            fixed_width: { url: string };
            fixed_width_still: { url: string };
            original: { url: string };
          };
        }>;
        pagination?: { total_count?: number; count?: number; offset?: number };
        meta?: { msg?: string };
      };

      if (!response.ok || !data.data) {
        throw new Error(data.meta?.msg || 'GIF 검색에 실패했어요.');
      }

      const total = data.pagination?.total_count ?? 0;
      setGifHasMore(GIF_FETCH_SIZE < total);

      setGifResults(
        data.data.map((gif) => ({
          id: gif.id,
          url: gif.images.fixed_width.url,
          preview: gif.images.fixed_width_still.url
        }))
      );
    } catch (error) {
      setGifError(error instanceof Error ? error.message : '알 수 없는 에러가 발생했어요.');
    } finally {
      setGifLoading(false);
    }
  };

  const handleAddGifSticker = (gifUrl: string) => {
    addItem({
      type: 'sticker',
      pageSide: 'single',
      width: 150,
      height: 150,
      payload: {
        imageUrl: gifUrl
      }
    });
  };

  const handleLoadMoreGifs = async () => {
    const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;
    if (!apiKey || !gifQuery.trim()) return;

    setGifLoadingMore(true);
    try {
      const params = new URLSearchParams({
        api_key: apiKey,
        q: gifQuery.trim(),
        limit: String(GIF_FETCH_SIZE),
        offset: String(gifOffset),
        rating: 'g'
      });
      const response = await fetch(`https://api.giphy.com/v1/stickers/search?${params}`);
      const data = (await response.json()) as {
        data?: Array<{
          id: string;
          images: {
            fixed_width: { url: string };
            fixed_width_still: { url: string };
            original: { url: string };
          };
        }>;
        pagination?: { total_count?: number };
        meta?: { msg?: string };
      };

      if (!response.ok || !data.data) return;

      const newResults = data.data.map((gif) => ({
        id: gif.id,
        url: gif.images.fixed_width.url,
        preview: gif.images.fixed_width_still.url
      }));

      setGifResults((prev) => [...prev, ...newResults]);
      setGifOffset((prev) => prev + GIF_FETCH_SIZE);
      const total = data.pagination?.total_count ?? 0;
      setGifHasMore(gifOffset + GIF_FETCH_SIZE < total);
    } finally {
      setGifLoadingMore(false);
    }
  };

  const handleApplySelectedFont = () => {
    const editor = diaryEditorRef.current;
    if (!editor) return;
    const font = fontOptions.find((item) => item.id === selectedFontId) ?? fontOptions[0];
    const chain = editor.chain().focus();
    const hasTextStyleMark = Boolean(editor.schema.marks.textStyle);
    if (hasTextStyleMark) {
      chain.setFontFamily(font.fontFamily);
    }
    chain.run();
  };

  const handleDeleteSelectedSticker = useCallback(() => {
    if (!selectedItem || selectedItem.type !== 'sticker') return;
    removeItem(selectedItem.id);
  }, [selectedItem, removeItem]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        const tag = (event.target as HTMLElement).tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || (event.target as HTMLElement).isContentEditable) return;
        if (!selectedItem || selectedItem.type !== 'sticker') return;
        event.preventDefault();
        handleDeleteSelectedSticker();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, handleDeleteSelectedSticker]);

  return (
    <div
      className="flex h-full flex-col overflow-hidden"
      style={{
        backgroundColor: customColors.workspaceBg
      }}
    >
      {/* ── Header ── */}
      <header className="flex shrink-0 items-center justify-between border-b border-[#e7e3da] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="grid h-7 w-7 place-items-center rounded-full bg-[#c8b796] text-xs font-bold text-white">D</div>
          <span className="text-sm font-bold text-[#4c473f]">My Daily Log</span>
          <span className="rounded-full bg-[#e9f6ea] px-2.5 py-0.5 text-[11px] font-semibold text-[#3b8a55]">Auto-saved</span>
          <span className="text-xs text-[#8a867f]">Last edited just now</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button type="button" className="grid h-8 w-8 place-items-center rounded-md text-[#8a867f] hover:bg-white/60">
            <Undo2 className="h-4 w-4" />
          </button>
          <button type="button" className="grid h-8 w-8 place-items-center rounded-md text-[#8a867f] hover:bg-white/60">
            <Redo2 className="h-4 w-4" />
          </button>
          <button type="button" className="grid h-8 w-8 place-items-center rounded-md text-[#8a867f] hover:bg-white/60">
            <Eye className="h-4 w-4" />
          </button>
          <Button
            size="sm"
            className="ml-1 gap-1.5 bg-[#2d2d2d] text-white hover:bg-[#1a1a1a]"
            onClick={handleSave}
            disabled={isSaving || !state.isDirty}
          >
            <Check className="h-3.5 w-3.5" />
            Save Entry
          </Button>
        </div>
      </header>

      {/* ── Body ── */}
      <div
        className="relative isolate h-full flex-1"
        style={{
          display: 'grid',
          gridTemplateColumns: '7fr 3fr',
          backgroundColor: customColors.workspaceBg,
          backgroundImage: currentTheme.workspacePattern,
          backgroundSize: '16px 16px'
        }}
      >
        {/* Canvas area — 70% */}
        <section
          className="relative h-full min-w-0 overflow-hidden p-2"
          style={{ contain: 'paint', zIndex: 1, display: 'flex', flexDirection: 'column' }}
        >
              <EditorCanvasSingle
                background="#fffdf7"
                items={singleModeItems}
                selectedItemId={state.selectedItemId}
                zoom={1}
                activeTool={'select' as EditorTool}
                notebookTheme={{
                  ...currentTheme,
                  ...customColors
                }}
                diaryText={diaryText}
                onDiaryTextChange={setDiaryText}
                diaryDate={diaryDate}
                onDiaryDateChange={setDiaryDate}
                dailyExpense={dailyExpense}
                onDailyExpenseChange={setDailyExpense}
                onEditorReady={(editor) => {
                  diaryEditorRef.current = editor;
                }}
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
                onDeleteItem={(itemId) => removeItem(itemId)}
                onPlaceTextAt={handlePlaceTextAt}
                notebookVariant
              />
            </section>

            {/* Right sidebar — Decorate panel */}
            <aside className="relative z-20 h-dvh min-w-0 overflow-y-auto border-l border-[#e7e3da] bg-[#faf9f6]">
              <div className="p-5">
                {/* Panel header */}
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[15px] font-bold text-[#3a3a3a]">Decorate</p>
                  <button type="button" className="grid h-7 w-7 place-items-center rounded-full text-[#9b968d] hover:bg-[#eeebe5]">
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="mb-5 grid grid-cols-3 gap-1 rounded-lg bg-[#eceae4] p-1 text-[13px]">
                  {[
                    { key: 'text', label: '텍스트' },
                    { key: 'stickers', label: '스티커' },
                    { key: 'photos', label: '포토' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`rounded-md py-1.5 font-semibold capitalize transition-colors ${
                        sidebarTab === tab.key ? 'bg-white text-[#3a3a3a] shadow-sm' : 'text-[#8f8a82] hover:text-[#6b6357]'
                      }`}
                      onClick={() => setSidebarTab(tab.key as 'text' | 'stickers' | 'photos')}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* ── Stickers tab ── */}
                {sidebarTab === 'stickers' && (
                  <div className="space-y-6">
                    <section className="rounded-lg border border-[#e5e0d6] bg-white p-2.5">
                      <button
                        type="button"
                        onClick={handleDeleteSelectedSticker}
                        disabled={!selectedItem || selectedItem.type !== 'sticker'}
                        className="w-full rounded-md border border-[#dbcfc0] px-3 py-2 text-xs font-semibold text-[#6d5d47] transition-colors enabled:hover:bg-[#f8f4ec] disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        선택한 스티커 삭제
                      </button>
                    </section>
                    {/* Recently Used */}
                    <section>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#8e887d]">Recently Used</p>
                        <button type="button" className="text-[11px] font-medium text-[#b8b0a4] hover:text-[#8a8274]">Clear</button>
                      </div>
                      <div className="flex gap-3">
                        {stickerSet.slice(0, 4).map((sticker) => (
                          <button
                            key={`recent-${sticker.emoji}`}
                            type="button"
                            className="grid h-14 w-14 shrink-0 place-items-center rounded-full text-2xl transition-transform hover:scale-110"
                            style={{ backgroundColor: sticker.bg }}
                            onClick={() => handleAddSticker(sticker.emoji, sticker.bg)}
                          >
                            {sticker.emoji}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* Moods & Emojis */}
                    <section>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#8e887d]">Moods & Emojis</p>
                        <button type="button" className="text-[11px] font-medium text-[#6e9fd8] hover:text-[#4a84c4]">See All</button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {moodEmojis.map((mood) => (
                          <button
                            key={mood.emoji}
                            type="button"
                            className="grid aspect-square place-items-center rounded-full text-3xl transition-transform hover:scale-110"
                            style={{ backgroundColor: mood.bg }}
                            onClick={() => handleAddSticker(mood.emoji, mood.bg)}
                          >
                            {mood.emoji}
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* AI Sticker */}
                    <section className="rounded-lg border border-[#e5e0d6] bg-white p-3">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#8e887d]">AI Sticker</p>
                      <input
                        value={aiPrompt}
                        onChange={(event) => setAiPrompt(event.target.value)}
                        placeholder="예: cute rabbit with coffee"
                        className="w-full rounded-md border border-[#dfd9cc] px-2.5 py-1.5 text-xs outline-none focus:border-[#b7aa92]"
                      />
                      <button
                        type="button"
                        onClick={handleGenerateAiSticker}
                        disabled={aiLoading}
                        className="mt-2 w-full rounded-md bg-[#7b6a52] px-2 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {aiLoading ? '생성 중...' : 'AI 스티커 만들기'}
                      </button>
                      {aiError ? <p className="mt-1 text-[11px] text-red-600">{aiError}</p> : null}
                    </section>

                    {/* GIF Sticker Search */}
                    <section className="rounded-lg border border-[#e5e0d6] bg-white p-3">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#8e887d]">
                        GIF Sticker
                        <span className="ml-1.5 rounded-full bg-[#ede9fe] px-1.5 py-0.5 text-[9px] font-semibold normal-case text-[#7c3aed]">animated</span>
                      </p>
                      <div className="flex gap-1.5">
                        <input
                          value={gifQuery}
                          onChange={(event) => setGifQuery(event.target.value)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') handleSearchGif();
                          }}
                          placeholder="예: cat, heart, hello"
                          className="flex-1 rounded-md border border-[#dfd9cc] px-2.5 py-1.5 text-xs outline-none focus:border-[#b7aa92]"
                        />
                        <button
                          type="button"
                          onClick={handleSearchGif}
                          disabled={gifLoading}
                          className="shrink-0 rounded-md bg-[#7c3aed] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                        >
                          {gifLoading ? '...' : '검색'}
                        </button>
                      </div>
                      {gifError ? <p className="mt-1.5 text-[11px] text-red-600">{gifError}</p> : null}
                      {gifResults.length > 0 && (() => {
                        const totalPages = Math.ceil(gifResults.length / GIF_PER_PAGE);
                        const pageItems = gifResults.slice(gifPage * GIF_PER_PAGE, (gifPage + 1) * GIF_PER_PAGE);
                        return (
                          <div className="mt-2.5">
                            <div className="grid grid-cols-2 gap-2">
                              {pageItems.map((gif) => (
                                <button
                                  key={gif.id}
                                  type="button"
                                  className="aspect-square overflow-hidden rounded-lg border border-[#ece6da] bg-[#faf8f4] transition-transform hover:scale-105"
                                  onClick={() => handleAddGifSticker(gif.url)}
                                >
                                  <img
                                    src={gif.url}
                                    alt="gif sticker"
                                    className="h-full w-full object-contain"
                                    loading="lazy"
                                  />
                                </button>
                              ))}
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <button
                                type="button"
                                onClick={() => setGifPage((p) => Math.max(0, p - 1))}
                                disabled={gifPage === 0}
                                className="rounded-md border border-[#ddd6c8] px-2.5 py-1 text-[11px] font-semibold text-[#6d5d47] disabled:opacity-30"
                              >
                                이전
                              </button>
                              <span className="text-[11px] text-[#8e887d]">
                                {gifPage + 1} / {totalPages}
                              </span>
                              <button
                                type="button"
                                onClick={() => setGifPage((p) => Math.min(totalPages - 1, p + 1))}
                                disabled={gifPage >= totalPages - 1}
                                className="rounded-md border border-[#ddd6c8] px-2.5 py-1 text-[11px] font-semibold text-[#6d5d47] disabled:opacity-30"
                              >
                                다음
                              </button>
                            </div>
                            {gifPage >= totalPages - 1 && gifHasMore && (
                              <button
                                type="button"
                                onClick={handleLoadMoreGifs}
                                disabled={gifLoadingMore}
                                className="mt-2 w-full rounded-md border border-[#7c3aed] px-2 py-1.5 text-[11px] font-semibold text-[#7c3aed] transition-colors hover:bg-[#7c3aed]/10 disabled:opacity-50"
                              >
                                {gifLoadingMore ? '불러오는 중...' : '더 불러오기'}
                              </button>
                            )}
                          </div>
                        );
                      })()}
                      <p className="mt-2 text-center text-[9px] text-[#b8b0a4]">Powered by GIPHY</p>
                    </section>
                  </div>
                )}

                {/* ── Text tab ── */}
                {sidebarTab === 'text' && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-[#e5e0d6] bg-white p-3.5 shadow-sm">
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-[#8e887d]">Font</p>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedFontId}
                          onChange={(event) => setSelectedFontId(event.target.value as (typeof fontOptions)[number]['id'])}
                          className="h-9 flex-1 rounded-md border border-[#ddd6c8] bg-white px-2 text-sm text-[#4d463b] outline-none focus:border-[#b6a283]"
                        >
                          {fontOptions.map((font) => (
                            <option key={font.id} value={font.id}>
                              {font.label}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleApplySelectedFont();
                          }}
                          className="h-9 rounded-md bg-[#7b6a52] px-3 text-xs font-semibold text-white hover:bg-[#675740]"
                        >
                          선택영역 적용
                        </button>
                      </div>
                      <p
                        className="mt-2 text-sm text-[#6f685c]"
                        style={{
                          fontFamily: (fontOptions.find((item) => item.id === selectedFontId) ?? fontOptions[0]).fontFamily
                        }}
                      >
                        미리보기: 오늘의 기록을 남겨보세요.
                      </p>
                    </div>
                    <div className="rounded-xl border border-[#e5e0d6] bg-white p-2.5 shadow-sm">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#8e887d]">Theme Colors</p>
                        <button
                          type="button"
                          onClick={() =>
                            setCustomColors({
                              workspaceBg: toPickerColor(currentTheme.workspaceBg),
                              paperBg: toPickerColor(currentTheme.paperBg),
                              paperBorder: toPickerColor(currentTheme.paperBorder),
                              lineColor: toPickerColor(currentTheme.lineColor),
                              marginColor: toPickerColor(currentTheme.marginColor),
                              textColor: toPickerColor(currentTheme.textColor)
                            })
                          }
                          className="rounded-md border border-[#ddd6c8] px-1.5 py-0.5 text-[10px] font-semibold text-[#7c7569] hover:bg-[#f7f4ed]"
                        >
                          Reset
                        </button>
                      </div>
                      <div
                        className="gap-1.5 text-[11px] text-[#6b6357]"
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}
                      >
                        {[
                          { key: 'workspaceBg', label: 'Workspace' },
                          { key: 'paperBg', label: 'Paper' },
                          { key: 'paperBorder', label: 'Border' },
                          { key: 'lineColor', label: 'Line' },
                          { key: 'marginColor', label: 'Margin' },
                          { key: 'textColor', label: 'Text' }
                        ].map((color) => (
                          <label key={color.key} className="rounded-md border border-[#ece6da] bg-[#fcfbf8] px-2 py-1.5">
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-[10px] font-semibold text-[#7d7669]">{color.label}</span>
                              <span className="rounded bg-white px-1 py-0.5 font-mono text-[9px] text-[#8f8778]">
                                {customColors[color.key as keyof CustomPaperColors]}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={customColors[color.key as keyof CustomPaperColors]}
                                onChange={(event) =>
                                  setCustomColors((prev) => ({
                                    ...prev,
                                    [color.key]: event.target.value
                                  }))
                                }
                                className="h-6 w-7 cursor-pointer rounded border border-[#d9d2c4] bg-transparent p-0"
                              />
                              <span
                                className="inline-block h-4 flex-1 rounded border border-[#ddd6c8]"
                                style={{ backgroundColor: customColors[color.key as keyof CustomPaperColors] }}
                              />
                              <span className="text-[9px] text-[#9b9488]">Pick</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Photos tab ── */}
                {sidebarTab === 'photos' && (
                  <div className="space-y-4">
                    <button
                      type="button"
                      onClick={handleAddPhoto}
                      className="grid h-28 w-full place-items-center rounded-lg border-2 border-dashed border-[#d9d2c4] bg-white text-[#7a6c58] transition-colors hover:border-[#c5bba8] hover:bg-[#fdfcf9]"
                    >
                      <div className="text-center">
                        <span className="block text-3xl leading-none">+</span>
                        <span className="mt-1 block text-xs font-medium">Upload Photos</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </aside>
          </div>

    </div>
  );
}
