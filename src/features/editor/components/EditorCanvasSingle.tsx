'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent as ReactDragEvent, PointerEvent as ReactPointerEvent } from 'react';

import type { EditorTool } from '@/features/editor/components/EditorTopBar';
import type { CreateEditorItemInput, EditorItem } from '@/features/editor/types/editor.types';

const LINE_HEIGHT = 28;
const MARGIN_LEFT = 60;
const TOP_PADDING = 32;

interface EditorCanvasSingleProps {
  background: string;
  items: EditorItem[];
  selectedItemId: string | null;
  zoom: number;
  activeTool: EditorTool;
  notebookVariant?: boolean;
  diaryText?: string;
  onDiaryTextChange?: (text: string) => void;
  onSelectItem: (itemId: string | null) => void;
  onMoveItem: (itemId: string, x: number, y: number) => void;
  onResizeItem?: (itemId: string, width: number, height: number) => void;
  onDropAddItem: (input: CreateEditorItemInput) => void;
  onPlaceTextAt: (x: number, y: number) => void;
}

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se';

interface InteractionState {
  mode: 'drag' | 'resize';
  pointerId: number;
  itemId: string;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  startWidth: number;
  startHeight: number;
  offsetX?: number;
  offsetY?: number;
  handle?: ResizeHandle;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const HANDLE_POSITIONS: Record<ResizeHandle, string> = {
  nw: '-left-2 -top-2 cursor-nwse-resize',
  ne: '-right-2 -top-2 cursor-nesw-resize',
  sw: '-bottom-2 -left-2 cursor-nesw-resize',
  se: '-bottom-2 -right-2 cursor-nwse-resize'
};

function SelectionHandles({ onResizeStart }: { onResizeStart: (event: ReactPointerEvent<HTMLSpanElement>, handle: ResizeHandle) => void }) {
  return (
    <>
      {(Object.keys(HANDLE_POSITIONS) as ResizeHandle[]).map((handle) => (
        <span
          key={handle}
          data-resize-handle={handle}
          className={`absolute h-3.5 w-3.5 rounded border border-[#2563eb] bg-white ${HANDLE_POSITIONS[handle]}`}
          onPointerDown={(event) => onResizeStart(event, handle)}
        />
      ))}
    </>
  );
}

export function EditorCanvasSingle({
  background,
  items,
  selectedItemId,
  zoom,
  activeTool,
  notebookVariant = false,
  diaryText = '',
  onDiaryTextChange,
  onSelectItem,
  onMoveItem,
  onResizeItem,
  onDropAddItem,
  onPlaceTextAt
}: EditorCanvasSingleProps) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const stickerNodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const interactionRef = useRef<InteractionState | null>(null);
  const itemsRef = useRef<EditorItem[]>(items);
  const onMoveItemRef = useRef(onMoveItem);
  const onResizeItemRef = useRef(onResizeItem);
  const [liveRects, setLiveRects] = useState<Record<string, { x: number; y: number; width: number; height: number }>>({});
  const liveRectsRef = useRef(liveRects);

  const applyLiveRect = useCallback((itemId: string, rect: { x: number; y: number; width: number; height: number }) => {
    liveRectsRef.current = { ...liveRectsRef.current, [itemId]: rect };
    setLiveRects((prev) => ({ ...prev, [itemId]: rect }));

    const node = stickerNodeRefs.current[itemId];
    if (node) {
      node.style.transform = `translate(${rect.x}px, ${rect.y}px)`;
      node.style.width = `${rect.width}px`;
      node.style.height = `${rect.height}px`;
    }
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    onMoveItemRef.current = onMoveItem;
  }, [onMoveItem]);

  useEffect(() => {
    onResizeItemRef.current = onResizeItem;
  }, [onResizeItem]);

  useEffect(() => {
    liveRectsRef.current = liveRects;
  }, [liveRects]);

  const handleDrop = (event: ReactDragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const payload = event.dataTransfer.getData('application/x-dearme-item');
    if (!payload || !pageRef.current) return;

    try {
      const parsed = JSON.parse(payload) as CreateEditorItemInput;
      const rect = pageRef.current.getBoundingClientRect();
      const width = parsed.width ?? 120;
      const height = parsed.height ?? 120;
      const pageWidth = rect.width / zoom;
      const pageHeight = rect.height / zoom;

      const x = clamp((event.clientX - rect.left) / zoom - width / 2, 0, pageWidth - width);
      const y = clamp((event.clientY - rect.top) / zoom - height / 2, 0, pageHeight - height);

      onDropAddItem({ ...parsed, pageSide: 'single', x, y, width, height });
    } catch {
      return;
    }
  };

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if ((event.target as HTMLElement).closest('[data-sticker]')) return;

      if (notebookVariant) {
        onSelectItem(null);
        return;
      }

      if (activeTool === 'text') {
        const rect = event.currentTarget.getBoundingClientRect();
        const x = clamp((event.clientX - rect.left) / zoom - 90, 0, rect.width / zoom - 180);
        const y = clamp((event.clientY - rect.top) / zoom - 28, 0, rect.height / zoom - 56);
        onPlaceTextAt(x, y);
        return;
      }

      onSelectItem(null);
    },
    [activeTool, notebookVariant, zoom, onPlaceTextAt, onSelectItem]
  );

  const beginDrag = (event: ReactPointerEvent<HTMLDivElement>, item: EditorItem) => {
    const page = pageRef.current;
    if (!page) return;
    const rect = page.getBoundingClientRect();
    const offsetX = (event.clientX - rect.left) / zoom - item.x;
    const offsetY = (event.clientY - rect.top) / zoom - item.y;

    interactionRef.current = {
      mode: 'drag',
      pointerId: event.pointerId,
      itemId: item.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: item.x,
      startY: item.y,
      startWidth: item.width,
      startHeight: item.height,
      offsetX,
      offsetY
    };
    applyLiveRect(item.id, { x: item.x, y: item.y, width: item.width, height: item.height });
    onSelectItem(item.id);
    event.preventDefault();
    event.stopPropagation();
  };

  const beginResize = (event: ReactPointerEvent<HTMLSpanElement>, item: EditorItem, handle: ResizeHandle) => {
    interactionRef.current = {
      mode: 'resize',
      pointerId: event.pointerId,
      itemId: item.id,
      handle,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: item.x,
      startY: item.y,
      startWidth: item.width,
      startHeight: item.height
    };
    applyLiveRect(item.id, { x: item.x, y: item.y, width: item.width, height: item.height });
    onSelectItem(item.id);
    event.preventDefault();
    event.stopPropagation();
  };

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const interaction = interactionRef.current;
      const page = pageRef.current;
      if (!interaction || !page || event.pointerId !== interaction.pointerId) return;

      const rect = page.getBoundingClientRect();
      const pageWidth = rect.width / zoom;
      const pageHeight = rect.height / zoom;
      const deltaX = (event.clientX - interaction.startClientX) / zoom;
      const deltaY = (event.clientY - interaction.startClientY) / zoom;

      const currentItem = itemsRef.current.find((candidate) => candidate.id === interaction.itemId);
      if (!currentItem) return;

      if (interaction.mode === 'drag') {
        const offsetX = interaction.offsetX ?? currentItem.width / 2;
        const offsetY = interaction.offsetY ?? currentItem.height / 2;
        const nextX = clamp((event.clientX - rect.left) / zoom - offsetX, 0, pageWidth - currentItem.width);
        const nextY = clamp((event.clientY - rect.top) / zoom - offsetY, 0, pageHeight - currentItem.height);
        applyLiveRect(interaction.itemId, {
          x: nextX,
          y: nextY,
          width: currentItem.width,
          height: currentItem.height
        });
        return;
      }

      if (interaction.mode === 'resize' && interaction.handle && onResizeItemRef.current) {
        const minSize = 48;
        let nextX = interaction.startX;
        let nextY = interaction.startY;
        let nextWidth = interaction.startWidth;
        let nextHeight = interaction.startHeight;

        if (interaction.handle.includes('e')) {
          nextWidth = interaction.startWidth + deltaX;
        }
        if (interaction.handle.includes('s')) {
          nextHeight = interaction.startHeight + deltaY;
        }
        if (interaction.handle.includes('w')) {
          nextWidth = interaction.startWidth - deltaX;
          nextX = interaction.startX + deltaX;
        }
        if (interaction.handle.includes('n')) {
          nextHeight = interaction.startHeight - deltaY;
          nextY = interaction.startY + deltaY;
        }

        nextWidth = clamp(nextWidth, minSize, 420);
        nextHeight = clamp(nextHeight, minSize, 420);
        nextX = clamp(nextX, 0, pageWidth - nextWidth);
        nextY = clamp(nextY, 0, pageHeight - nextHeight);

        applyLiveRect(interaction.itemId, { x: nextX, y: nextY, width: nextWidth, height: nextHeight });
      }
    };

    const endInteraction = (event: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction || event.pointerId !== interaction.pointerId) return;
      const finalRect = liveRectsRef.current[interaction.itemId];
      if (finalRect) {
        onMoveItemRef.current(interaction.itemId, finalRect.x, finalRect.y);
        if (interaction.mode === 'resize' && onResizeItemRef.current) {
          onResizeItemRef.current(interaction.itemId, finalRect.width, finalRect.height);
        }
      }
      setLiveRects((prev) => {
        const next = { ...prev };
        delete next[interaction.itemId];
        return next;
      });
      liveRectsRef.current = (() => {
        const next = { ...liveRectsRef.current };
        delete next[interaction.itemId];
        return next;
      })();
      interactionRef.current = null;
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', endInteraction);
    window.addEventListener('pointercancel', endInteraction);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endInteraction);
      window.removeEventListener('pointercancel', endInteraction);
    };
  }, [zoom, applyLiveRect]);

  const handleStickerWheel = (event: React.WheelEvent, item: EditorItem) => {
    if (!onResizeItem) return;

    event.preventDefault();
    event.stopPropagation();

    const page = pageRef.current;
    const pageWidth = page ? page.clientWidth : 420;
    const pageHeight = page ? page.clientHeight : 420;

    const delta = event.deltaY > 0 ? -12 : 12;
    const nextWidth = clamp(item.width + delta, 48, Math.min(420, pageWidth - item.x));
    const nextHeight = clamp(item.height + delta, 48, Math.min(420, pageHeight - item.y));

    onResizeItem(item.id, nextWidth, nextHeight);
  };

  const stickerItems = useMemo(
    () => [...items].filter((item) => item.type !== 'text').sort((a, b) => a.zIndex - b.zIndex),
    [items]
  );

  const renderStickerItems = () =>
    stickerItems.map((item) => {
      const isSelected = selectedItemId === item.id;
      const rect = liveRects[item.id] ?? { x: item.x, y: item.y, width: item.width, height: item.height };

      return (
        <div
          key={item.id}
          data-sticker
          className="absolute select-none"
          ref={(node) => {
            stickerNodeRefs.current[item.id] = node;
          }}
          style={{
            left: 0,
            top: 0,
            width: rect.width,
            height: rect.height,
            zIndex: item.zIndex + 20,
            transform: `translate(${rect.x}px, ${rect.y}px) rotate(${item.rotation}deg)`,
            cursor: 'move',
            touchAction: 'none',
            pointerEvents: 'auto'
          }}
          onClick={(event) => {
            event.stopPropagation();
            onSelectItem(item.id);
          }}
          onPointerDown={(event) => beginDrag(event, item)}
        >
          <div
            className="relative h-full w-full"
            style={{
              border: isSelected ? '2px dashed #2563eb' : '2px solid transparent',
              borderRadius: '12px',
              backgroundColor: 'transparent'
            }}
          >
            {item.type === 'sticker' && item.payload.text?.content ? (
              <div
                className="grid h-full w-full place-items-center rounded-[10px]"
                style={{ backgroundColor: item.payload.text.color ?? '#ffe4e6' }}
                onWheel={(event) => handleStickerWheel(event, item)}
              >
                <span style={{ fontSize: item.payload.text.fontSize ?? 48, lineHeight: 1 }}>
                  {item.payload.text.content}
                </span>
              </div>
            ) : (
              <img
                src={item.payload.imageUrl ?? 'https://placehold.co/200x200/png?text=Item'}
                alt={item.type}
                draggable={false}
                className="h-full w-full rounded-[10px] object-cover"
                onWheel={(event) => handleStickerWheel(event, item)}
              />
            )}

            {isSelected ? <SelectionHandles onResizeStart={(event, handle) => beginResize(event, item, handle)} /> : null}
          </div>
        </div>
      );
    });

  if (notebookVariant) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          minHeight: '660px',
          backgroundColor: '#e8e0c8',
          borderRadius: '12px',
          padding: '20px'
        }}
      >
        <div
          ref={pageRef}
          className="relative overflow-hidden touch-none"
          style={{
            width: '100%',
            height: '600px',
            backgroundColor: '#fffef8',
            border: '3px solid #e2b830',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            backgroundImage: [
              `linear-gradient(to bottom, rgba(180,165,145,0.5) 1px, transparent 1px)`,
              `linear-gradient(to right, rgba(210,90,90,0.45) 2px, transparent 2px)`,
              `linear-gradient(to right, rgba(210,90,90,0.45) 2px, transparent 2px)`
            ].join(', '),
            backgroundSize: `100% ${LINE_HEIGHT}px, 100% 100%, 100% 100%`,
            backgroundPosition: `0 ${TOP_PADDING}px, ${MARGIN_LEFT - 10}px 0, ${MARGIN_LEFT}px 0`
          }}
          onClick={handleCanvasClick}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <textarea
            value={diaryText}
            onChange={(event) => onDiaryTextChange?.(event.target.value)}
            placeholder="여기에 일기를 작성하세요..."
            spellCheck={false}
            style={{
              position: 'absolute',
              top: TOP_PADDING,
              left: MARGIN_LEFT + 8,
              right: 16,
              bottom: 16,
              lineHeight: `${LINE_HEIGHT}px`,
              fontSize: '16px',
              fontFamily: 'inherit',
              color: '#4b2e1f',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              padding: 0,
              zIndex: 1,
              whiteSpace: 'pre-wrap',
              overflowY: 'auto'
            }}
          />

          <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>{renderStickerItems()}</div>
        </div>
      </div>
    );
  }

  const allItems = [...items].sort((a, b) => a.zIndex - b.zIndex);

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
          <div
            ref={pageRef}
            className="relative aspect-[3/4] w-[430px] overflow-hidden rounded-xl border-2 bg-white shadow-lg"
            style={{ backgroundColor: background }}
            onClick={handleCanvasClick}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
          >
            {allItems.map((item) => {
              const isSelected = selectedItemId === item.id;
              return (
                <div
                  key={item.id}
                  className={`absolute rounded ${isSelected ? 'ring-1 ring-primary' : ''}`}
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
                  onPointerDown={(event) => beginDrag(event, item)}
                >
                  {item.type === 'text' ? (
                    <div
                      className="h-full w-full whitespace-pre-wrap break-words rounded bg-white/80 p-2"
                      style={{ fontSize: item.payload.text?.fontSize ?? 16, color: item.payload.text?.color ?? '#111827' }}
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
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
