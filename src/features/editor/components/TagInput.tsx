"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
}

export function TagInput({ tags, onAdd, onRemove, placeholder = "태그 입력 후 Enter" }: TagInputProps) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onAdd(trimmed);
    setDraft("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") { event.preventDefault(); commit(); }
    if (event.key === "Backspace" && draft === "" && tags.length > 0) {
      onRemove(tags[tags.length - 1]);
    }
  };

  return (
    <div
      className="flex flex-wrap gap-ds-1 rounded-2xl border border-line bg-paper px-ds-3 py-ds-2 cursor-text"
      onClick={() => inputRef.current?.focus()}
    >
      {tags.map((tag) => (
        <span key={tag} className="flex items-center gap-1 rounded-full bg-oatmeal px-ds-2 py-0.5 text-ds-caption text-cedar">
          #{tag}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onRemove(tag); }}
            className="text-cedar/60 hover:text-cedar"
            aria-label={`${tag} 태그 삭제`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={commit}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="min-w-[120px] flex-1 bg-transparent text-ds-caption text-ink outline-none placeholder:text-cedar/50"
      />
    </div>
  );
}
