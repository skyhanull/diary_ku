'use client';

import { useRef, useState } from 'react';
import type { DragEvent as ReactDragEvent, PointerEvent as ReactPointerEvent } from 'react';

import type { EditorTool } from '@/features/editor/components/EditorTopBar';
import type { CreateEditorItemInput, EditorItem, PageSide } from '@/features/editor/types/editor.types';

interface EditorCanvasSpreadProps {
  background: string;
  items: EditorItem[];
  selectedItemId: string | null;
  zoom: number;
  activeTool: EditorTool;
  diaryText?: string;
  diaryDate?: string;
  textToolbar?: EditorItem | null;
  onSelectItem: (itemId: string | null) => void;
  onMoveItem: (itemId: string, x: number, y: number) => void;
  onUpdateTextFontSize?: (itemId: string, fontSize: number) => void;
  onUpdateTextColor?: (itemId: string, color: string) => void;
  onDeleteItem?: (itemId: string) => void;
  onDropAddItem: (input: CreateEditorItemInput) => void;
  onPlaceTextAt: (x: number, y: number, side: PageSide) => void;
}

interface DragState {
  itemId: string;
  side: 'left' | 'right';
  offsetX: number;
  offsetY: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getPreviewHtml(html: string | undefined) {
  if (!html || html.trim() === '') {
    return '<p>오늘의 기록을 시작해보세요.</p>';
  }

  return html;
}

function isItemInSide(item: EditorItem, side: PageSide) {
  if (side === 'left') return item.pageSide === 'left' || item.pageSide === 'single';
  return item.pageSide === 'right';
}

function SelectionHandles() {
  const base = 'absolute h-2.5 w-2.5 rounded-full border border-primary bg-white';

  return (
    <>
      <span className={`${base} -left-1.5 -top-1.5`} />
      <span className={`${base} -right-1.5 -top-1.5`} />
      <span className={`${base} -bottom-1.5 -left-1.5`} />
      <span className={`${base} -bottom-1.5 -right-1.5`} />
    </>
  );
}

export function EditorCanvasSpread({
  background,
  items,
  selectedItemId,
  zoom,
  activeTool,
  diaryText,
  diaryDate,
  textToolbar,
  onSelectItem,
  onMoveItem,
  onUpdateTextFontSize,
  onUpdateTextColor,
  onDeleteItem,
  onDropAddItem,
  onPlaceTextAt
}: EditorCanvasSpreadProps) {
  const leftRef = useRef<HTMLDivElement | null>(null);
  const rightRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>, item: EditorItem, side: 'left' | 'right') => {
    const page = side === 'left' ? leftRef.current : rightRef.current;
    if (!page) return;

    const rect = page.getBoundingClientRect();

    setDragging({
      itemId: item.id,
      side,
      offsetX: (event.clientX - rect.left) / zoom - item.x,
      offsetY: (event.clientY - rect.top) / zoom - item.y
    });

    onSelectItem(item.id);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>, side: 'left' | 'right') => {
    if (!dragging || dragging.side !== side) return;

    const page = side === 'left' ? leftRef.current : rightRef.current;
    if (!page) return;

    const item = items.find((candidate) => candidate.id === dragging.itemId);
    if (!item) return;

    const rect = page.getBoundingClientRect();
    const pageWidth = rect.width / zoom;
    const pageHeight = rect.height / zoom;

    const nextX = clamp((event.clientX - rect.left) / zoom - dragging.offsetX, 0, pageWidth - item.width);
    const nextY = clamp((event.clientY - rect.top) / zoom - dragging.offsetY, 0, pageHeight - item.height);

    onMoveItem(dragging.itemId, nextX, nextY);
  };

  const handleDrop = (event: ReactDragEvent<HTMLDivElement>, side: 'left' | 'right') => {
    event.preventDefault();
    const payload = event.dataTransfer.getData('application/x-dearme-item');
    const page = side === 'left' ? leftRef.current : rightRef.current;
    if (!payload || !page) return;

    try {
      const parsed = JSON.parse(payload) as CreateEditorItemInput;
      const rect = page.getBoundingClientRect();
      const width = parsed.width ?? 120;
      const height = parsed.height ?? 120;
      const pageWidth = rect.width / zoom;
      const pageHeight = rect.height / zoom;

      const x = clamp((event.clientX - rect.left) / zoom - width / 2, 0, pageWidth - width);
      const y = clamp((event.clientY - rect.top) / zoom - height / 2, 0, pageHeight - height);

      onDropAddItem({ ...parsed, pageSide: side, x, y, width, height });
    } catch {
      return;
    }
  };

  const sortedLeft = [...items].filter((item) => isItemInSide(item, 'left')).sort((a, b) => a.zIndex - b.zIndex);
  const sortedRight = [...items].filter((item) => isItemInSide(item, 'right')).sort((a, b) => a.zIndex - b.zIndex);
  const previewHtml = getPreviewHtml(diaryText);

  const renderItem = (item: EditorItem, side: 'left' | 'right') => {
    const isSelected = selectedItemId === item.id;

    return (
      <div
        key={item.id}
        className={`absolute select-none overflow-visible rounded ${isSelected ? 'ring-1 ring-primary' : ''}`}
        style={{
          left: item.x,
          top: item.y,
          width: item.width,
          height: item.height,
          zIndex: item.zIndex,
          transform: `rotate(${item.rotation}deg)`
        }}
        onClick={(event) => {
          event.stopPropagation();
          onSelectItem(item.id);
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          handlePointerDown(event, item, side);
        }}
      >
        {item.type === 'text' ? (
          <div
            className="h-full w-full whitespace-pre-wrap break-words rounded bg-white/80 p-2"
            style={{
              fontSize: item.payload.text?.fontSize ?? 16,
              color: item.payload.text?.color ?? '#111827',
              fontFamily: item.payload.text?.fontFamily ?? 'inherit'
            }}
          >
            {item.payload.text?.content ?? '텍스트'}
          </div>
        ) : (
          <img
            src={item.payload.imageUrl ?? 'https://placehold.co/200x200/png?text=Item'}
            alt={item.type}
            draggable={false}
            className="h-full w-full rounded object-cover"
          />
        )}
        {isSelected ? (
          <button
            type="button"
            className="absolute -right-2 -top-2 z-10 grid h-7 w-7 place-items-center rounded-full bg-[#a83836] text-xs font-semibold text-white shadow-sm"
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            onClick={(event) => {
              event.stopPropagation();
              onDeleteItem?.(item.id);
            }}
          >
            x
          </button>
        ) : null}
        {isSelected ? <SelectionHandles /> : null}
      </div>
    );
  };

  return (
    <section className="rounded-xl border bg-card p-4">
      <div
        className="grid min-h-[620px] place-items-center rounded-xl border"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(60,60,60,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(60,60,60,0.08) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }}
      >
        <div className="origin-center transition-transform" style={{ transform: `scale(${zoom})` }}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-1 text-xs text-foreground/60">Left Page</p>
              <div
                ref={leftRef}
                className="relative aspect-[3/4] w-[330px] overflow-hidden rounded-xl border-2 bg-white shadow-lg touch-none"
                style={{ backgroundColor: background }}
                onClick={(event) => {
                  if (activeTool === 'text') {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const x = clamp((event.clientX - rect.left) / zoom - 90, 0, rect.width / zoom - 180);
                    const y = clamp((event.clientY - rect.top) / zoom - 28, 0, rect.height / zoom - 56);
                    onPlaceTextAt(x, y, 'left');
                    return;
                  }

                  onSelectItem(null);
                }}
                onPointerMove={(event) => handlePointerMove(event, 'left')}
                onPointerUp={() => setDragging(null)}
                onPointerCancel={() => setDragging(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, 'left')}
              >
                {textToolbar && textToolbar.pageSide !== 'right' ? (
                  <div
                    data-editor-toolbar
                    className="absolute right-3 top-3 z-30 flex items-center gap-2 rounded-full border border-[#e9ddd3] bg-white/95 px-3 py-2 shadow-[0_10px_30px_rgba(52,50,47,0.12)] backdrop-blur"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <span className="text-xs font-semibold text-[#8C6A5D]">텍스트</span>
                    <button
                      type="button"
                      className="grid h-7 w-7 place-items-center rounded-full bg-[#f8f3ef] text-[#6f5c45]"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={() => onUpdateTextFontSize?.(textToolbar.id, Math.max(12, (textToolbar.payload.text?.fontSize ?? 18) - 2))}
                    >
                      -
                    </button>
                    <span className="min-w-9 text-center text-xs font-semibold text-[#34322f]">{textToolbar.payload.text?.fontSize ?? 18}</span>
                    <button
                      type="button"
                      className="grid h-7 w-7 place-items-center rounded-full bg-[#f8f3ef] text-[#6f5c45]"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={() => onUpdateTextFontSize?.(textToolbar.id, Math.min(72, (textToolbar.payload.text?.fontSize ?? 18) + 2))}
                    >
                      +
                    </button>
                    <input
                      type="color"
                      value={textToolbar.payload.text?.color ?? '#4F3328'}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                      }}
                      onChange={(event) => onUpdateTextColor?.(textToolbar.id, event.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border border-[#ece7e3] bg-white p-1"
                    />
                    <button
                      type="button"
                      className="rounded-full bg-[#fbe4df] px-3 py-1 text-xs font-semibold text-[#a83836]"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={() => onDeleteItem?.(textToolbar.id)}
                    >
                      삭제
                    </button>
                  </div>
                ) : null}
                <div className="absolute inset-x-0 top-0 z-0 border-b border-[#f0e6dd] bg-[linear-gradient(180deg,#fffaf4_0%,#fffdf9_100%)] px-6 pb-5 pt-6">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b39a88]">Diary Body</p>
                  {diaryDate ? <p className="mt-2 text-xs font-semibold text-[#6f5c45]">{diaryDate}</p> : null}
                  <div
                    className="mt-3 max-h-[220px] overflow-hidden whitespace-pre-wrap break-words text-[13px] leading-6 text-[#4f473f] [&_p]:mb-2 [&_p:last-child]:mb-0"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                </div>
                {sortedLeft.map((item) => renderItem(item, 'left'))}
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs text-foreground/60">Right Page</p>
              <div
                ref={rightRef}
                className="relative aspect-[3/4] w-[330px] overflow-hidden rounded-xl border-2 bg-white shadow-lg touch-none"
                style={{ backgroundColor: background }}
                onClick={(event) => {
                  if (activeTool === 'text') {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const x = clamp((event.clientX - rect.left) / zoom - 90, 0, rect.width / zoom - 180);
                    const y = clamp((event.clientY - rect.top) / zoom - 28, 0, rect.height / zoom - 56);
                    onPlaceTextAt(x, y, 'right');
                    return;
                  }

                  onSelectItem(null);
                }}
                onPointerMove={(event) => handlePointerMove(event, 'right')}
                onPointerUp={() => setDragging(null)}
                onPointerCancel={() => setDragging(null)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, 'right')}
              >
                {textToolbar && textToolbar.pageSide === 'right' ? (
                  <div
                    data-editor-toolbar
                    className="absolute right-3 top-3 z-30 flex items-center gap-2 rounded-full border border-[#e9ddd3] bg-white/95 px-3 py-2 shadow-[0_10px_30px_rgba(52,50,47,0.12)] backdrop-blur"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <span className="text-xs font-semibold text-[#8C6A5D]">텍스트</span>
                    <button
                      type="button"
                      className="grid h-7 w-7 place-items-center rounded-full bg-[#f8f3ef] text-[#6f5c45]"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={() => onUpdateTextFontSize?.(textToolbar.id, Math.max(12, (textToolbar.payload.text?.fontSize ?? 18) - 2))}
                    >
                      -
                    </button>
                    <span className="min-w-9 text-center text-xs font-semibold text-[#34322f]">{textToolbar.payload.text?.fontSize ?? 18}</span>
                    <button
                      type="button"
                      className="grid h-7 w-7 place-items-center rounded-full bg-[#f8f3ef] text-[#6f5c45]"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={() => onUpdateTextFontSize?.(textToolbar.id, Math.min(72, (textToolbar.payload.text?.fontSize ?? 18) + 2))}
                    >
                      +
                    </button>
                    <input
                      type="color"
                      value={textToolbar.payload.text?.color ?? '#4F3328'}
                      onPointerDown={(event) => {
                        event.stopPropagation();
                      }}
                      onChange={(event) => onUpdateTextColor?.(textToolbar.id, event.target.value)}
                      className="h-8 w-10 cursor-pointer rounded border border-[#ece7e3] bg-white p-1"
                    />
                    <button
                      type="button"
                      className="rounded-full bg-[#fbe4df] px-3 py-1 text-xs font-semibold text-[#a83836]"
                      onPointerDown={(event) => {
                        event.stopPropagation();
                      }}
                      onClick={() => onDeleteItem?.(textToolbar.id)}
                    >
                      삭제
                    </button>
                  </div>
                ) : null}
                {sortedRight.map((item) => renderItem(item, 'right'))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
