'use client';

import { useMemo, useState } from 'react';
import { Camera, Share2, Sticker, Triangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EditorCanvasSingle } from '@/features/editor/components/EditorCanvasSingle';
import { useEditorState } from '@/features/editor/hooks/useEditorState';
import type { EditorTool } from '@/features/editor/components/EditorTopBar';

interface EditorScreenProps {
  pageId: string;
}

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

  return (
    <main className="mx-auto max-w-7xl px-4 py-4">
      <div className="rounded-md border-2 border-indigo-500 bg-[#f4efdf]">
        <header className="flex items-center justify-between border-b border-[#e7d69e] px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-[#8b4513]">My Diary</p>
            <span className="rounded-full bg-[#f6e7b6] px-3 py-1 text-xs font-medium text-[#b25f2e]">2026년 2월 13일</span>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={handleSave} disabled={isSaving || !state.isDirty}>
              저장
            </Button>
            <Button size="sm" className="bg-[#d97706] text-white hover:bg-[#b45309]">
              <Share2 className="mr-1 h-4 w-4" /> 공유
            </Button>
          </div>
        </header>

        <div
          className="relative isolate"
          style={{ display: 'grid', gridTemplateColumns: '1fr 240px', minHeight: '650px' }}
        >
          <section
            className="relative overflow-hidden border-r border-[#e7d69e] p-4"
            style={{ contain: 'paint', zIndex: 1 }}
          >
            <EditorCanvasSingle
              background="#fffdf7"
              items={singleModeItems}
              selectedItemId={state.selectedItemId}
              zoom={1}
              activeTool={'select' as EditorTool}
              diaryText={diaryText}
              onDiaryTextChange={setDiaryText}
              onSelectItem={selectItem}
              onMoveItem={(itemId, x, y) => updateItem(itemId, { x, y })}
              onResizeItem={(itemId, width, height) => updateItem(itemId, { width, height })}
              onDropAddItem={(input) => addItem({ ...input, pageSide: 'single' })}
              onPlaceTextAt={handlePlaceTextAt}
              notebookVariant
            />
          </section>

          <aside className="relative z-20 overflow-y-auto p-4">
            <section className="space-y-4">
              <p className="text-sm font-bold text-[#8b4513]">꾸미기 도구</p>

              <div>
                <p className="mb-2 flex items-center gap-1 text-xs font-semibold text-[#d9466f]">
                  <Sticker className="h-3.5 w-3.5" /> 스티커
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {stickerSet.map((sticker) => (
                    <button
                      key={sticker.emoji}
                      type="button"
                      className="grid h-10 w-10 place-items-center rounded-lg text-lg"
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
                  className="grid h-20 w-full place-items-center rounded-lg border border-dashed border-[#f0c36a] bg-[#fff3d0] text-[#b45309]"
                >
                  <span className="text-2xl leading-none">+</span>
                  <span className="text-sm">사진 추가하기</span>
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
                    className="h-14 w-14 rounded-lg border border-[#eacb72]"
                    style={{ backgroundColor: '#fef3c7' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddShape('circle', '#fbcfe8')}
                    className="h-14 w-14 rounded-full border border-[#f0a0c0]"
                    style={{ backgroundColor: '#fbcfe8' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleAddShape('rectangle', '#ddd6fe')}
                    className="h-14 w-14 rounded-lg border border-[#b8b0e0]"
                    style={{ backgroundColor: '#ddd6fe' }}
                  />
                </div>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {selectedItem ? (
        <section className="mt-3 rounded-md border border-[#e7d69e] bg-[#fffaf0] p-3 text-xs text-[#6b3f1d]">
          선택됨: {selectedItem.type} / x:{Math.round(selectedItem.x)} y:{Math.round(selectedItem.y)}
        </section>
      ) : null}
    </main>
  );
}
