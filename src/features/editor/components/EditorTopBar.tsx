import { LayoutTemplate, MousePointer2, Plus, Sticker, Type, ZoomIn, ZoomOut, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { EditorViewMode } from '@/features/editor/types/editor.types';

export type EditorTool = 'select' | 'text' | 'sticker' | 'image';

interface EditorTopBarProps {
  pageId: string;
  viewMode: EditorViewMode;
  isSaving: boolean;
  isDirty: boolean;
  activeTool: EditorTool;
  zoom: number;
  onChangeViewMode: (mode: EditorViewMode) => void;
  onSave: () => Promise<void>;
  onAddText: () => void;
  onAddSticker: () => void;
  onAddPhoto: () => void;
  onChangeTool: (tool: EditorTool) => void;
  onZoomChange: (next: number) => void;
  textDraft: string;
  onTextDraftChange: (value: string) => void;
  onSubmitTextDraft: () => void;
}

export function EditorTopBar({
  pageId,
  viewMode,
  isSaving,
  isDirty,
  activeTool,
  zoom,
  onChangeViewMode,
  onSave,
  onAddText,
  onAddSticker,
  onAddPhoto,
  onChangeTool,
  onZoomChange,
  textDraft,
  onTextDraftChange,
  onSubmitTextDraft
}: EditorTopBarProps) {
  const percent = Math.round(zoom * 100);

  return (
    <header className="rounded-xl border bg-card px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-foreground/50">Editor</p>
          <p className="truncate text-sm font-semibold">{pageId}</p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto rounded-lg border bg-white px-2 py-1">
          <Button variant={activeTool === 'select' ? 'default' : 'ghost'} size="sm" onClick={() => onChangeTool('select')}>
            <MousePointer2 className="mr-1 h-4 w-4" /> Select
          </Button>
          <Button variant={activeTool === 'text' ? 'default' : 'ghost'} size="sm" onClick={() => onChangeTool('text')}>
            <Type className="mr-1 h-4 w-4" /> Text
          </Button>
          <Button
            variant={activeTool === 'sticker' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              onChangeTool('sticker');
              onAddSticker();
            }}
          >
            <Sticker className="mr-1 h-4 w-4" /> Sticker
          </Button>
          <Button
            variant={activeTool === 'image' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => {
              onChangeTool('image');
              onAddPhoto();
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Image
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border bg-white p-1">
            <Button variant="ghost" size="sm" onClick={() => onChangeViewMode('single')}>
              1P
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onChangeViewMode('spread')}>
              <LayoutTemplate className="mr-1 h-4 w-4" /> 2P
            </Button>
          </div>

          <div className="flex items-center gap-1 rounded-lg border bg-white p-1">
            <Button variant="ghost" size="sm" onClick={() => onZoomChange(Math.max(0.6, zoom - 0.1))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="w-14 text-center text-xs font-medium">{percent}%</span>
            <Button variant="ghost" size="sm" onClick={() => onZoomChange(Math.min(1.6, zoom + 0.1))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
          </div>

          <Button onClick={onSave} disabled={isSaving || !isDirty} size="sm">
            <Save className="mr-1 h-4 w-4" /> {isSaving ? '저장 중' : '저장'}
          </Button>
        </div>
      </div>

      {activeTool === 'text' ? (
        <div className="mt-2 flex items-center gap-2 rounded-lg border bg-white p-2">
          <Input
            value={textDraft}
            onChange={(event) => onTextDraftChange(event.target.value)}
            placeholder="텍스트를 입력한 뒤 속지를 클릭하면 해당 위치에 추가돼요."
          />
          <Button
            size="sm"
            onClick={() => {
              onSubmitTextDraft();
            }}
          >
            텍스트 추가
          </Button>
        </div>
      ) : null}
      {activeTool === 'text' ? <p className="mt-1 text-xs text-foreground/60">텍스트 모드: 속지를 클릭해 원하는 위치에 배치</p> : null}
    </header>
  );
}
