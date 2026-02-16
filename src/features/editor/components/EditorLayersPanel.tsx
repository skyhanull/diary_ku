import { Layers, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { EditorItem } from '@/features/editor/types/editor.types';

interface EditorLayersPanelProps {
  items: EditorItem[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string | null) => void;
  onRemoveItem: (itemId: string) => void;
}

export function EditorLayersPanel({ items, selectedItemId, onSelectItem, onRemoveItem }: EditorLayersPanelProps) {
  const sorted = [...items].sort((a, b) => b.zIndex - a.zIndex);

  return (
    <aside className="h-full rounded-xl border bg-card p-3">
      <div className="mb-3 flex items-center gap-2 border-b pb-2">
        <Layers className="h-4 w-4" />
        <p className="text-sm font-semibold">Layers</p>
      </div>

      <div className="h-[calc(100vh-220px)] space-y-2 overflow-auto pr-1">
        {sorted.length === 0 ? <p className="text-xs text-foreground/50">아이템이 없습니다.</p> : null}
        {sorted.map((item) => {
          const active = selectedItemId === item.id;
          return (
            <div
              key={item.id}
              className={`rounded-lg border p-2 transition ${active ? 'border-primary bg-secondary' : 'border-input bg-white'}`}
            >
              <button className="w-full text-left text-xs" onClick={() => onSelectItem(item.id)} type="button">
                <p className="font-medium">{item.type}</p>
                <p className="text-foreground/60">{item.pageSide} · z{item.zIndex}</p>
              </button>
              <Button
                size="sm"
                variant="ghost"
                className="mt-2 h-7 w-full justify-start px-2 text-xs"
                onClick={() => onRemoveItem(item.id)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" /> 삭제
              </Button>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
