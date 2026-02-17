'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DragEvent as ReactDragEvent, PointerEvent as ReactPointerEvent } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import type { Editor as TiptapEditor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { TextStyleKit } from '@tiptap/extension-text-style';

import type { EditorTool } from '@/features/editor/components/EditorTopBar';
import type { CreateEditorItemInput, EditorItem } from '@/features/editor/types/editor.types';

const MARGIN_LEFT = 24;
const TOP_PADDING = 24;
const HEADER_HEIGHT = 88;

interface EditorCanvasSingleProps {
  background: string;
  items: EditorItem[];
  selectedItemId: string | null;
  zoom: number;
  activeTool: EditorTool;
  notebookVariant?: boolean;
  diaryText?: string;
  onDiaryTextChange?: (text: string) => void;
  diaryDate?: string;
  onDiaryDateChange?: (value: string) => void;
  dailyExpense?: string;
  onDailyExpenseChange?: (value: string) => void;
  onEditorReady?: (editor: TiptapEditor | null) => void;
  onSelectItem: (itemId: string | null) => void;
  onMoveItem: (itemId: string, x: number, y: number) => void;
  onResizeItem?: (itemId: string, width: number, height: number) => void;
  onDropAddItem: (input: CreateEditorItemInput) => void;
  onDeleteItem?: (itemId: string) => void;
  onPlaceTextAt: (x: number, y: number) => void;
  notebookTheme?: {
    workspaceBg: string;
    workspacePattern: string;
    paperBg: string;
    paperBorder: string;
    lineColor: string;
    marginColor: string;
    textColor: string;
  };
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
  diaryDate = '',
  onDiaryDateChange,
  dailyExpense = '',
  onDailyExpenseChange,
  onEditorReady,
  onSelectItem,
  onMoveItem,
  onResizeItem,
  onDropAddItem,
  onDeleteItem,
  onPlaceTextAt,
  notebookTheme
}: EditorCanvasSingleProps) {
  const pageRef = useRef<HTMLDivElement | null>(null);
  const interactionRef = useRef<InteractionState | null>(null);
  const itemsRef = useRef<EditorItem[]>(items);
  const diaryEditorRef = useRef<TiptapEditor | null>(null);
  const lastEditorHtmlRef = useRef<string>(diaryText || '<p></p>');
  const onMoveItemRef = useRef(onMoveItem);
  const onResizeItemRef = useRef(onResizeItem);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const diaryEditor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyleKit,
      TaskList,
      TaskItem.configure({
        nested: true
      })
    ],
    content: diaryText || '<p></p>',
    editorProps: {
      attributes: {
        class: 'diary-editor-content'
      },
      handleKeyDown(view, event): boolean {
        if (event.key !== ' ' || event.isComposing) return false;

        const { state } = view;
        const { $from, from } = state.selection;
        const textBefore = $from.parent.textContent.slice(0, $from.parentOffset);

        // Keep Tiptap default input rules for bullet/ordered list.
        // We only custom-handle task list marker ([] / [ ]).
        if (!/^(\[\]|\[ \])$/.test(textBefore)) return false;
        const editor = diaryEditorRef.current;
        if (!editor) return false;

        const deleteFrom = from - textBefore.length;

        const runToggle = (): boolean => {
          if (!editor.can().chain().focus().toggleTaskList().run()) return false;
          return editor
            .chain()
            .focus()
            .deleteRange({ from: deleteFrom, to: from })
            .toggleTaskList()
            .run();
        };

        event.preventDefault();
        return runToggle();
      }
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      lastEditorHtmlRef.current = html;
      onDiaryTextChange?.(html);
    }
  });

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
    diaryEditorRef.current = diaryEditor;
  }, [diaryEditor]);

  useEffect(() => {
    onEditorReady?.(diaryEditor ?? null);
    return () => onEditorReady?.(null);
  }, [diaryEditor, onEditorReady]);

  useEffect(() => {
    if (!diaryEditor) return;
    const incoming = diaryText || '<p></p>';
    // Ignore parent updates originating from this editor to prevent hydration loops while typing.
    if (incoming === lastEditorHtmlRef.current) return;
    if (diaryEditor.getHTML() !== incoming) {
      diaryEditor.commands.setContent(incoming, { emitUpdate: false });
      lastEditorHtmlRef.current = incoming;
    }
  }, [diaryEditor, diaryText]);

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
    const pageRect = page.getBoundingClientRect();
    const baseRect = { x: item.x, y: item.y, width: item.width, height: item.height };
    const offsetX = (event.clientX - pageRect.left) / zoom - baseRect.x;
    const offsetY = (event.clientY - pageRect.top) / zoom - baseRect.y;

    interactionRef.current = {
      mode: 'drag',
      pointerId: event.pointerId,
      itemId: item.id,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: baseRect.x,
      startY: baseRect.y,
      startWidth: baseRect.width,
      startHeight: baseRect.height,
      offsetX,
      offsetY
    };
    setDraggingItemId(item.id);
    onSelectItem(item.id);
    event.preventDefault();
    event.stopPropagation();
  };

  const beginResize = (event: ReactPointerEvent<HTMLSpanElement>, item: EditorItem, handle: ResizeHandle) => {
    const baseRect = {
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height
    };
    interactionRef.current = {
      mode: 'resize',
      pointerId: event.pointerId,
      itemId: item.id,
      handle,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: baseRect.x,
      startY: baseRect.y,
      startWidth: baseRect.width,
      startHeight: baseRect.height
    };
    onSelectItem(item.id);
    event.preventDefault();
    event.stopPropagation();
  };

  useEffect(() => {
    const resetInteraction = () => {
      interactionRef.current = null;
      setDraggingItemId(null);
    };

    const handleGlobalPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-sticker]') && !target?.closest('[data-resize-handle]')) {
        resetInteraction();
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      const interaction = interactionRef.current;
      const page = pageRef.current;
      if (!interaction || !page || event.pointerId !== interaction.pointerId) return;
      if (event.pointerType === 'mouse' && event.buttons === 0) {
        resetInteraction();
        return;
      }
      if (draggingItemId !== interaction.itemId) return;

      const rect = page.getBoundingClientRect();
      const isInsidePage =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!isInsidePage) return;
      const pageWidth = rect.width / zoom;
      const pageHeight = rect.height / zoom;
      const deltaX = (event.clientX - interaction.startClientX) / zoom;
      const deltaY = (event.clientY - interaction.startClientY) / zoom;

      const currentItem = itemsRef.current.find((candidate) => candidate.id === interaction.itemId);
      if (!currentItem) return;
      const currentRect = {
        x: currentItem.x,
        y: currentItem.y,
        width: currentItem.width,
        height: currentItem.height
      };

      if (interaction.mode === 'drag') {
        const offsetX = interaction.offsetX ?? currentRect.width / 2;
        const offsetY = interaction.offsetY ?? currentRect.height / 2;
        const nextX = clamp((event.clientX - rect.left) / zoom - offsetX, 0, pageWidth - currentRect.width);
        const nextY = clamp((event.clientY - rect.top) / zoom - offsetY, 0, pageHeight - currentRect.height);
        onMoveItemRef.current(interaction.itemId, nextX, nextY);
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

        onMoveItemRef.current(interaction.itemId, nextX, nextY);
        onResizeItemRef.current(interaction.itemId, nextWidth, nextHeight);
      }
    };

    const endInteraction = (event: PointerEvent) => {
      const interaction = interactionRef.current;
      if (!interaction || event.pointerId !== interaction.pointerId) return;
      resetInteraction();
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', endInteraction);
    window.addEventListener('pointercancel', endInteraction);
    window.addEventListener('blur', resetInteraction);
    window.addEventListener('pointerdown', handleGlobalPointerDown, true);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endInteraction);
      window.removeEventListener('pointercancel', endInteraction);
      window.removeEventListener('blur', resetInteraction);
      window.removeEventListener('pointerdown', handleGlobalPointerDown, true);
    };
  }, [zoom, draggingItemId]);

  useEffect(() => {
    if (!draggingItemId) return;
    const exists = items.some((item) => item.id === draggingItemId);
    if (!exists) {
      interactionRef.current = null;
      setDraggingItemId(null);
    }
  }, [items, draggingItemId]);

  useEffect(() => {
    interactionRef.current = null;
    setDraggingItemId(null);
  }, [items.length]);

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

  const theme = notebookTheme ?? {
    workspaceBg: '#f3f2ee',
    workspacePattern:
      'radial-gradient(circle at 1px 1px, rgba(160,160,160,0.12) 1px, transparent 1.2px)',
    paperBg: '#ffffff',
    paperBorder: '#e7e3db',
    lineColor: 'rgba(170,170,170,0.45)',
    marginColor: 'rgba(228,142,142,0.5)',
    textColor: '#2f2f2f'
  };

  const renderStickerItems = () =>
    stickerItems.map((item) => {
      const isSelected = selectedItemId === item.id;
      const rect = { x: item.x, y: item.y, width: item.width, height: item.height };

      return (
        <div
          key={item.id}
          data-sticker
          data-sticker-item
          style={{
            position: 'absolute',
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
            zIndex: draggingItemId === item.id ? 9999 : item.zIndex + 20,
            transform: `rotate(${item.rotation}deg)`,
            cursor: 'move',
            touchAction: 'none',
            userSelect: 'none',
            pointerEvents: draggingItemId && draggingItemId !== item.id ? 'none' : 'auto'
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

            {isSelected ? (
              <>
                <SelectionHandles onResizeStart={(event, handle) => beginResize(event, item, handle)} />
                {onDeleteItem ? (
                  <button
                    type="button"
                    className="absolute -right-2.5 -top-2.5 grid h-5 w-5 place-items-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white shadow-sm hover:bg-red-600"
                    style={{ zIndex: 1, pointerEvents: 'auto' }}
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteItem(item.id);
                    }}
                  >
                    ✕
                  </button>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      );
    });

  if (notebookVariant) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          minHeight: 0,
          backgroundColor: theme.workspaceBg,
          backgroundImage: theme.workspacePattern,
          backgroundSize: '16px 16px',
          borderRadius: '8px',
          padding: '8px'
        }}
      >
        <div
          ref={pageRef}
          className="relative overflow-hidden touch-none"
          style={{
            width: '100%',
            flex: '1 1 0%',
            backgroundColor: theme.paperBg,
            border: `1px solid ${theme.paperBorder}`,
            borderRadius: '6px',
            boxShadow: '0 4px 12px rgba(30, 30, 30, 0.06)'
          }}
          onClick={handleCanvasClick}
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              right: 16,
              zIndex: 2,
              pointerEvents: draggingItemId ? 'none' : 'auto',
              borderBottom: `1px solid ${theme.paperBorder}`,
              display: 'grid',
              gridTemplateColumns: '1fr 220px',
              gap: '18px',
              paddingBottom: '12px'
            }}
          >
            <label style={{ display: 'grid', gap: '4px' }}>
              <span style={{ fontSize: '10px', letterSpacing: '0.08em', color: '#8b8579', fontWeight: 700 }}>DATE</span>
              <input
                type="text"
                value={diaryDate}
                onChange={(event) => onDiaryDateChange?.(event.target.value)}
                placeholder="2026. 02. 15"
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: theme.textColor
                }}
              />
            </label>
            <label style={{ display: 'grid', gap: '4px' }}>
              <span style={{ fontSize: '10px', letterSpacing: '0.08em', color: '#8b8579', fontWeight: 700 }}>TODAY EXPENSE</span>
              <input
                type="text"
                value={dailyExpense}
                onChange={(event) => onDailyExpenseChange?.(event.target.value)}
                placeholder="35000"
                style={{
                  width: '100%',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: '18px',
                  fontWeight: 600,
                  color: theme.textColor,
                  textAlign: 'right'
                }}
              />
            </label>
          </div>

          <div
            style={{
              position: 'absolute',
              top: TOP_PADDING + HEADER_HEIGHT,
              left: MARGIN_LEFT + 8,
              right: 16,
              bottom: 16,
              zIndex: 1,
              overflowY: 'auto',
              color: theme.textColor,
              pointerEvents: draggingItemId ? 'none' : 'auto'
            }}
          >
            <EditorContent editor={diaryEditor} />
          </div>

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
