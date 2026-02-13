'use client';

import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CreateEditorItemInput, EditorItem, EditorViewMode, PageSide } from '@/features/editor/types/editor.types';

interface EditorSidebarProps {
  viewMode: EditorViewMode;
  insertSide: PageSide;
  onChangeInsertSide: (side: PageSide) => void;
  onAddItem: (input: CreateEditorItemInput) => void;
  selectedItem: EditorItem | null;
  totalItems: number;
}

function toDragPayload(input: CreateEditorItemInput) {
  return JSON.stringify(input);
}

export function EditorSidebar({
  viewMode,
  insertSide,
  onChangeInsertSide,
  onAddItem,
  selectedItem,
  totalItems
}: EditorSidebarProps) {
  const [textValue, setTextValue] = useState('오늘의 기록');
  const [stickerUrl, setStickerUrl] = useState('https://placehold.co/200x200/png?text=Sticker');
  const [photoUrl, setPhotoUrl] = useState('https://placehold.co/360x280/png?text=Photo');

  const baseSide = useMemo<PageSide>(() => (viewMode === 'spread' ? insertSide : 'single'), [insertSide, viewMode]);

  return (
    <aside className="space-y-3 rounded-xl border bg-card p-3">
      <section className="rounded-lg border bg-white p-3">
        <p className="text-sm font-semibold">에디터 패널</p>
        <p className="mt-1 text-xs text-foreground/60">패널에서 요소를 만들고 속지로 드래그하거나 추가하세요.</p>
      </section>

      {viewMode === 'spread' ? (
        <section className="rounded-lg border bg-white p-3">
          <p className="mb-2 text-sm font-medium">추가 위치</p>
          <div className="grid grid-cols-2 gap-2">
            <Button size="sm" variant={insertSide === 'left' ? 'default' : 'outline'} onClick={() => onChangeInsertSide('left')}>
              왼쪽
            </Button>
            <Button size="sm" variant={insertSide === 'right' ? 'default' : 'outline'} onClick={() => onChangeInsertSide('right')}>
              오른쪽
            </Button>
          </div>
        </section>
      ) : null}

      <section className="rounded-lg border bg-white p-3">
        <p className="mb-2 text-sm font-medium">텍스트</p>
        <Input value={textValue} onChange={(event) => setTextValue(event.target.value)} placeholder="텍스트를 입력하세요" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData(
                'application/x-dearme-item',
                toDragPayload({
                  type: 'text',
                  pageSide: baseSide,
                  width: 180,
                  height: 56,
                  payload: { text: { content: textValue || '텍스트', fontSize: 18, color: '#1f2937' } }
                })
              );
            }}
          >
            드래그
          </Button>
          <Button
            size="sm"
            onClick={() =>
              onAddItem({
                type: 'text',
                pageSide: baseSide,
                width: 180,
                height: 56,
                payload: { text: { content: textValue || '텍스트', fontSize: 18, color: '#1f2937' } }
              })
            }
          >
            추가
          </Button>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-3">
        <p className="mb-2 text-sm font-medium">스티커 URL</p>
        <Input value={stickerUrl} onChange={(event) => setStickerUrl(event.target.value)} placeholder="스티커 이미지 URL" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData(
                'application/x-dearme-item',
                toDragPayload({
                  type: 'sticker',
                  pageSide: baseSide,
                  width: 120,
                  height: 120,
                  payload: { imageUrl: stickerUrl }
                })
              );
            }}
          >
            드래그
          </Button>
          <Button
            size="sm"
            onClick={() => onAddItem({ type: 'sticker', pageSide: baseSide, payload: { imageUrl: stickerUrl } })}
          >
            추가
          </Button>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-3">
        <p className="mb-2 text-sm font-medium">사진 URL</p>
        <Input value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} placeholder="사진 이미지 URL" />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData(
                'application/x-dearme-item',
                toDragPayload({
                  type: 'image',
                  pageSide: baseSide,
                  width: 180,
                  height: 140,
                  payload: { imageUrl: photoUrl }
                })
              );
            }}
          >
            드래그
          </Button>
          <Button
            size="sm"
            onClick={() =>
              onAddItem({
                type: 'image',
                pageSide: baseSide,
                width: 180,
                height: 140,
                payload: { imageUrl: photoUrl }
              })
            }
          >
            추가
          </Button>
        </div>
      </section>

      <section className="rounded-lg border bg-white p-3 text-xs">
        <p className="font-medium">상태</p>
        <p className="mt-1 text-foreground/70">전체 아이템: {totalItems}</p>
        <p className="mt-1 text-foreground/70">선택: {selectedItem ? `${selectedItem.type} (${selectedItem.id.slice(0, 6)})` : '없음'}</p>
      </section>
    </aside>
  );
}
