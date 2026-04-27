"use client";
// AI 채팅 패널 UI: 오른쪽에서 슬라이드인하는 일기 친구 대화 화면
import { useEffect, useRef } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDiaryChat } from "@/features/chat/hooks/useDiaryChat";

interface DiaryChatProps {
  entryDate: string;
  isOpen: boolean;
  onClose: () => void;
}

export function DiaryChat({ entryDate, isOpen, onClose }: DiaryChatProps) {
  const { messages, input, isStreaming, isLoading, setInput, sendMessage } = useDiaryChat({ entryDate });
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  return (
    <div
      className={`fixed right-0 top-16 z-40 flex h-[calc(100vh-64px)] w-80 flex-col border-l border-line bg-paper shadow-xl transition-transform duration-300 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-cedar" />
          <span className="text-ds-body font-semibold text-ink">일기 친구</span>
        </div>
        <button type="button" onClick={onClose} className="text-cedar/60 hover:text-cedar">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <span className="animate-pulse text-ds-caption text-cedar/40">불러오는 중...</span>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-ds-caption leading-relaxed ${
                  msg.role === "user" ? "bg-cedar text-paper" : "bg-oatmeal text-ink"
                }`}
              >
                {msg.content ? (
                  msg.content
                ) : isStreaming ? (
                  <span className="animate-pulse opacity-60">···</span>
                ) : null}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-line px-3 py-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="메시지 입력..."
            disabled={isStreaming || isLoading}
            className="flex-1 rounded-full border border-line bg-vellum px-4 py-2 text-ds-caption text-ink placeholder:text-cedar/40 focus:outline-none focus:ring-1 focus:ring-cedar/30 disabled:opacity-50"
          />
          <Button
            size="sm"
            onClick={() => void sendMessage()}
            disabled={isStreaming || isLoading || !input.trim()}
            className="h-9 w-9 rounded-full p-0"
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
