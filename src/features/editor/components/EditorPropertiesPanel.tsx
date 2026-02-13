import { Image as ImageIcon, Layers, Type } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EditorItem, EditorViewMode, PageSide } from '@/features/editor/types/editor.types';

interface EditorPropertiesPanelProps {
  items: EditorItem[];
  viewMode: EditorViewMode;
  insertSide: PageSide;
  textPreset: string;
  stickerPreset: string;
  photoPreset: string;
  selectedItem: EditorItem | null;
  onChangeInsertSide: (side: PageSide) => void;
  onChangeTextPreset: (value: string) => void;
  onChangeStickerPreset: (value: string) => void;
  onChangePhotoPreset: (value: string) => void;
  onAddText: () => void;
  onAddSticker: () => void;
  onAddPhoto: () => void;
  onUpdateSelected: (patch: Partial<EditorItem>) => void;
  onSelectItem: (itemId: string | null) => void;
  onRemoveItem: (itemId: string) => void;
}

export function EditorPropertiesPanel({
  items,
  viewMode,
  insertSide,
  textPreset,
  stickerPreset,
  photoPreset,
  selectedItem,
  onChangeInsertSide,
  onChangeTextPreset,
  onChangeStickerPreset,
  onChangePhotoPreset,
  onAddText,
  onAddSticker,
  onAddPhoto,
  onUpdateSelected,
  onSelectItem,
  onRemoveItem
}: EditorPropertiesPanelProps) {
  return (
    <aside className="rounded-xl border bg-card p-3">
      <div className="space-y-3">
        <section className="rounded-lg border bg-white p-3">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Layers className="h-4 w-4" /> 레이어
          </p>
          <div className="max-h-32 space-y-1 overflow-auto">
            {items.length === 0 ? <p className="text-xs text-foreground/50">아이템 없음</p> : null}
            {[...items]
              .sort((a, b) => b.zIndex - a.zIndex)
              .map((item) => (
                <div key={item.id} className="rounded border p-1.5 text-xs">
                  <button type="button" className="w-full text-left" onClick={() => onSelectItem(item.id)}>
                    {item.type} · {item.pageSide}
                  </button>
                  <Button size="sm" variant="ghost" className="mt-1 h-6 px-2 text-xs" onClick={() => onRemoveItem(item.id)}>
                    삭제
                  </Button>
                </div>
              ))}
          </div>
        </section>

        <section className="rounded-lg border bg-white p-3">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold">꾸미기 도구</p>

          {viewMode === 'spread' ? (
            <div className="mb-2 grid grid-cols-2 gap-2">
              <Button size="sm" variant={insertSide === 'left' ? 'default' : 'outline'} onClick={() => onChangeInsertSide('left')}>
                Left
              </Button>
              <Button size="sm" variant={insertSide === 'right' ? 'default' : 'outline'} onClick={() => onChangeInsertSide('right')}>
                Right
              </Button>
            </div>
          ) : null}

          <p className="mb-1 mt-3 flex items-center gap-1 text-xs font-semibold text-foreground/70">
            <Type className="h-3.5 w-3.5" /> 텍스트
          </p>
          <Input value={textPreset} onChange={(e) => onChangeTextPreset(e.target.value)} placeholder="텍스트 입력" />
          <Button size="sm" className="mt-2 w-full" onClick={onAddText}>
            텍스트 추가
          </Button>

          <p className="mb-1 mt-3 text-xs font-semibold text-foreground/70">스티커</p>
          <Input value={stickerPreset} onChange={(e) => onChangeStickerPreset(e.target.value)} placeholder="스티커 URL" />
          <Button size="sm" className="mt-2 w-full" onClick={onAddSticker}>
            스티커 추가
          </Button>

          <p className="mb-1 mt-3 flex items-center gap-1 text-xs font-semibold text-foreground/70">
            <ImageIcon className="h-3.5 w-3.5" /> 사진
          </p>
          <Input value={photoPreset} onChange={(e) => onChangePhotoPreset(e.target.value)} placeholder="사진 URL" />
          <Button size="sm" className="mt-2 w-full" onClick={onAddPhoto}>
            사진 추가
          </Button>
        </section>

        <section className="rounded-lg border bg-white p-3">
          <p className="mb-2 text-sm font-semibold">속성</p>
          {!selectedItem ? (
            <p className="text-xs text-foreground/50">아이템을 선택하세요.</p>
          ) : (
            <div className="space-y-2 text-xs">
              {selectedItem.type === 'text' ? (
                <Input
                  value={selectedItem.payload.text?.content ?? ''}
                  onChange={(e) =>
                    onUpdateSelected({
                      payload: {
                        ...selectedItem.payload,
                        text: {
                          content: e.target.value,
                          fontSize: selectedItem.payload.text?.fontSize ?? 18,
                          color: selectedItem.payload.text?.color ?? '#1f2937'
                        }
                      }
                    })
                  }
                  placeholder="텍스트 내용"
                />
              ) : null}

              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={String(Math.round(selectedItem.x))}
                  onChange={(e) => onUpdateSelected({ x: Number(e.target.value) || 0 })}
                  placeholder="x"
                />
                <Input
                  value={String(Math.round(selectedItem.y))}
                  onChange={(e) => onUpdateSelected({ y: Number(e.target.value) || 0 })}
                  placeholder="y"
                />
                <Input
                  value={String(Math.round(selectedItem.width))}
                  onChange={(e) => onUpdateSelected({ width: Math.max(40, Number(e.target.value) || 40) })}
                  placeholder="w"
                />
                <Input
                  value={String(Math.round(selectedItem.height))}
                  onChange={(e) => onUpdateSelected({ height: Math.max(40, Number(e.target.value) || 40) })}
                  placeholder="h"
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </aside>
  );
}
