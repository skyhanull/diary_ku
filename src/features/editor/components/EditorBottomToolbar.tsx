import { Button } from '@/components/ui/button';

interface EditorBottomToolbarProps {
  onAddText: () => void;
  onAddSticker: () => void;
  onAddPhoto: () => void;
}

export function EditorBottomToolbar({ onAddText, onAddSticker, onAddPhoto }: EditorBottomToolbarProps) {
  return (
    <footer className="grid grid-cols-3 gap-2 rounded-xl border bg-card p-3">
      <Button variant="outline" onClick={onAddText}>
        텍스트 추가
      </Button>
      <Button variant="outline" onClick={onAddSticker}>
        스티커 추가
      </Button>
      <Button variant="outline" onClick={onAddPhoto}>
        사진 추가
      </Button>
    </footer>
  );
}
