"use client";
// 공유 모달: 일기를 편지로 공유하는 링크를 생성하고 복사하는 UI
import { Copy, ExternalLink, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoticeBox } from "@/components/ui/notice-box";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { SharedLetterTheme } from "@/features/editor/types/editor.types";

const shareThemeOptions: Array<{ value: SharedLetterTheme; label: string; description: string }> = [
  { value: "paper", label: "종이 편지", description: "가장 기본적인 따뜻한 편지 무드예요." },
  { value: "midnight", label: "밤 편지", description: "저녁 분위기의 깊은 그라데이션이에요." },
];

interface EditorShareModalProps {
  recipientName: string;
  theme: SharedLetterTheme;
  sharedLetterUrl: string | null;
  isCreatingShare: boolean;
  isSaveLocked?: boolean;
  shareMessage: string | null;
  saveError: string | null;
  onChangeRecipientName: (value: string) => void;
  onChangeTheme: (theme: SharedLetterTheme) => void;
  onCreateShare: () => void;
  onCopyShareLink: () => void;
  onClose: () => void;
}

export function EditorShareModal({
  recipientName,
  theme,
  sharedLetterUrl,
  isCreatingShare,
  isSaveLocked = false,
  shareMessage,
  saveError,
  onChangeRecipientName,
  onChangeTheme,
  onCreateShare,
  onCopyShareLink,
  onClose,
}: EditorShareModalProps) {
  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(38,30,28,0.5)] px-ds-4 backdrop-blur-[4px]">
      <div className="w-full max-w-3xl overflow-hidden rounded-[24px] border border-line-warm bg-paper-soft shadow-[0_28px_80px_rgba(52,50,47,0.24)]">
        <div className="border-b border-line-soft bg-oatmeal px-ds-6 py-ds-5">
          <div className="flex items-start justify-between gap-ds-4">
            <div>
              <p className="text-ds-caption font-semibold uppercase tracking-[0.24em] text-cedar">Share As Letter</p>
              <h3 className="mt-ds-2 font-display text-ds-brand font-bold tracking-tight text-ink">편지처럼 보내기</h3>
            </div>
            <button type="button" onClick={onClose} className="text-ds-body text-cedar">
              닫기
            </button>
          </div>
        </div>

        <div className="grid gap-ds-4 px-ds-6 py-ds-5 md:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-ds-4">
            <section className="rounded-2xl border border-line-soft bg-white/80 p-ds-4">
              <label className="mb-ds-2 block text-ds-body font-semibold text-ink">받는 사람</label>
              <Input value={recipientName} onChange={(event) => onChangeRecipientName(event.target.value)} placeholder="예: 미래의 나, 윤경에게" className="h-11 rounded-2xl border-line bg-paper" />
            </section>

            <Button className="h-11 w-full" onClick={onCreateShare} disabled={isCreatingShare || isSaveLocked}>
              <Send className="mr-ds-2 h-4 w-4" />
              {isCreatingShare ? "링크 생성 중..." : isSaveLocked ? "저장 처리 중..." : "편지지 링크 만들기"}
            </Button>
          </div>

          <div className="space-y-ds-4">
            <SurfaceCard tone="soft" radius="xl" className="p-ds-4">
              <p className="mb-ds-3 text-ds-body font-semibold text-ink">편지지 무드</p>
              <div className="grid gap-ds-2 sm:grid-cols-2">
                {shareThemeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => onChangeTheme(option.value)}
                    className={`rounded-2xl border px-ds-4 py-ds-3 text-left transition ${theme === option.value ? "border-cedar bg-cedar-soft" : "border-line bg-paper"}`}
                  >
                    <p className="text-ds-body font-semibold text-ink">{option.label}</p>
                    <p className="mt-ds-1 text-ds-caption text-cedar">{option.description}</p>
                  </button>
                ))}
              </div>
            </SurfaceCard>

            {shareMessage ? <NoticeBox tone="success">{shareMessage}</NoticeBox> : null}
            {saveError ? <NoticeBox tone="error">{saveError}</NoticeBox> : null}

            {sharedLetterUrl ? (
              <SurfaceCard tone="soft" radius="xl" className="p-ds-4">
                <p className="mb-ds-2 text-ds-body font-semibold text-ink">생성된 링크</p>
                <div className="flex min-w-0 items-center gap-ds-2">
                  <div className="min-w-0 flex-1 truncate rounded-2xl border border-line bg-paper px-ds-3 py-ds-3 text-ds-body text-ink-warm" title={sharedLetterUrl}>
                    {sharedLetterUrl}
                  </div>
                  <Button variant="outline" size="sm" onClick={onCopyShareLink}>
                    <Copy className="mr-ds-2 h-4 w-4" />
                    복사
                  </Button>
                  <Button size="sm" onClick={() => window.open(sharedLetterUrl, "_blank", "noopener,noreferrer")}>
                    <ExternalLink className="mr-ds-2 h-4 w-4" />
                    열기
                  </Button>
                </div>
              </SurfaceCard>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
