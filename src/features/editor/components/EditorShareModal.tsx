"use client";
// 공유 모달: 일기를 편지로 공유하는 링크를 생성·복사하고, 이미 만든 링크를 관리(복사/열기/해제)한다
import { useState } from "react";
import { Copy, ExternalLink, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NoticeBox } from "@/components/ui/notice-box";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatDiaryDate } from "@/lib/date";
import type { SharedLetterRecord, SharedLetterTheme } from "@/features/editor/types/editor.types";
import { LETTER_THEMES, LETTER_THEME_ORDER, getLetterTheme } from "@/features/share/lib/letter-theme";

const COVER_MESSAGE_MAX = 140;
const shareThemeOptions = LETTER_THEME_ORDER.map((value) => LETTER_THEMES[value]);

interface EditorShareModalProps {
  recipientName: string;
  coverMessage: string;
  theme: SharedLetterTheme;
  sharedLetterUrl: string | null;
  existingShares: SharedLetterRecord[];
  isLoadingShares: boolean;
  deletingShareId: string | null;
  isCreatingShare: boolean;
  isSaveLocked?: boolean;
  shareMessage: string | null;
  saveError: string | null;
  onChangeRecipientName: (value: string) => void;
  onChangeCoverMessage: (value: string) => void;
  onChangeTheme: (theme: SharedLetterTheme) => void;
  onCreateShare: () => void;
  onCopyShareLink: () => void;
  onDeleteShare: (shareId: string) => void;
  onClose: () => void;
}

// shareToken으로 공유 편지의 전체 URL을 만든다 (브라우저 origin 기준)
function buildShareUrl(shareToken: string) {
  if (typeof window === "undefined") return `/letter/${shareToken}`;
  return `${window.location.origin}/letter/${shareToken}`;
}

export function EditorShareModal({
  recipientName,
  coverMessage,
  theme,
  sharedLetterUrl,
  existingShares,
  isLoadingShares,
  deletingShareId,
  isCreatingShare,
  isSaveLocked = false,
  shareMessage,
  saveError,
  onChangeRecipientName,
  onChangeCoverMessage,
  onChangeTheme,
  onCreateShare,
  onCopyShareLink,
  onDeleteShare,
  onClose,
}: EditorShareModalProps) {
  const [copiedShareId, setCopiedShareId] = useState<string | null>(null);

  const handleCopyExisting = async (share: SharedLetterRecord) => {
    try {
      await navigator.clipboard.writeText(buildShareUrl(share.shareToken));
      setCopiedShareId(share.id);
      window.setTimeout(() => setCopiedShareId((current) => (current === share.id ? null : current)), 1600);
    } catch {
      setCopiedShareId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-[rgba(38,30,28,0.5)] px-ds-4 py-ds-6 backdrop-blur-[4px]">
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-[24px] border border-line-warm bg-paper-soft shadow-[0_28px_80px_rgba(52,50,47,0.24)]">
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

        <div className="min-h-0 flex-1 overflow-y-auto px-ds-6 py-ds-5">
          <div className="grid gap-ds-4 md:grid-cols-[0.85fr_1.15fr]">
            <div className="space-y-ds-4">
              <section className="rounded-2xl border border-line-soft bg-white/80 p-ds-4">
                <label className="mb-ds-2 block text-ds-body font-semibold text-ink">받는 사람</label>
                <Input value={recipientName} onChange={(event) => onChangeRecipientName(event.target.value)} placeholder="예: 미래의 나, 윤경에게" className="h-11 rounded-2xl border-line bg-paper" />
              </section>

              <section className="rounded-2xl border border-line-soft bg-white/80 p-ds-4">
                <div className="mb-ds-2 flex items-center justify-between">
                  <label className="block text-ds-body font-semibold text-ink">봉투 커버 메시지</label>
                  <span className="text-ds-micro text-cedar">{coverMessage.length}/{COVER_MESSAGE_MAX}</span>
                </div>
                <textarea
                  value={coverMessage}
                  onChange={(event) => onChangeCoverMessage(event.target.value.slice(0, COVER_MESSAGE_MAX))}
                  placeholder="봉투를 열기 전 보여줄 짧은 인사말을 적어보세요."
                  rows={3}
                  className="w-full resize-none rounded-2xl border border-line bg-paper px-ds-3 py-ds-3 text-ds-body text-ink placeholder:text-cedar/70 focus:outline-none focus:ring-2 focus:ring-cedar/30"
                />
              </section>

              <Button className="h-11 w-full" onClick={onCreateShare} disabled={isCreatingShare || isSaveLocked}>
                <Send className="mr-ds-2 h-4 w-4" />
                {isCreatingShare ? "링크 생성 중..." : isSaveLocked ? "저장 처리 중..." : "편지지 링크 만들기"}
              </Button>
            </div>

            <div className="space-y-ds-4">
              <SurfaceCard tone="soft" radius="xl" className="p-ds-4">
                <p className="mb-ds-3 text-ds-body font-semibold text-ink">편지지 무드</p>
                <div className="grid gap-ds-2 sm:grid-cols-3">
                  {shareThemeOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => onChangeTheme(option.key)}
                      className={`rounded-2xl border px-ds-4 py-ds-3 text-left transition ${theme === option.key ? "border-cedar bg-cedar-soft" : "border-line bg-paper"}`}
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
                  <p className="mb-ds-2 text-ds-body font-semibold text-ink">방금 만든 링크</p>
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

          <section className="mt-ds-5 border-t border-line-soft pt-ds-5">
            <div className="mb-ds-3 flex items-center justify-between gap-ds-3">
              <p className="text-ds-body font-semibold text-ink">이 일기로 만든 편지 링크</p>
              {existingShares.length > 0 ? (
                <span className="text-ds-caption text-cedar">{existingShares.length}개</span>
              ) : null}
            </div>

            {isLoadingShares ? (
              <p className="rounded-2xl border border-line-soft bg-white/70 px-ds-4 py-ds-4 text-ds-body text-cedar">링크 목록을 불러오는 중이에요...</p>
            ) : existingShares.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line bg-white/50 px-ds-4 py-ds-4 text-ds-body text-cedar">아직 만든 편지 링크가 없어요. 위에서 링크를 만들어 보세요.</p>
            ) : (
              <ul className="space-y-ds-2">
                {existingShares.map((share) => {
                  const url = buildShareUrl(share.shareToken);
                  const isDeleting = deletingShareId === share.id;

                  return (
                    <li key={share.id} className="rounded-2xl border border-line-soft bg-white/80 px-ds-4 py-ds-3">
                      <div className="flex flex-wrap items-center justify-between gap-ds-2">
                        <div className="min-w-0">
                          <p className="truncate text-ds-body font-semibold text-ink">
                            {share.recipientName ? `To. ${share.recipientName}` : "받는 사람 미지정"}
                            <span className="ml-ds-2 rounded-full bg-oatmeal px-ds-2 py-0.5 text-ds-micro font-medium text-cedar">{getLetterTheme(share.theme).label}</span>
                          </p>
                          <p className="mt-ds-1 truncate text-ds-caption text-cedar" title={url}>
                            {formatDiaryDate(share.snapshot.entryDate)} · {url}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-ds-1">
                          <Button variant="ghost" size="sm" onClick={() => void handleCopyExisting(share)}>
                            <Copy className="mr-ds-1 h-4 w-4" />
                            {copiedShareId === share.id ? "복사됨" : "복사"}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => window.open(url, "_blank", "noopener,noreferrer")}>
                            <ExternalLink className="mr-ds-1 h-4 w-4" />
                            열기
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeleteShare(share.id)}
                            disabled={isDeleting}
                            className="text-rose-danger hover:text-rose-danger"
                          >
                            <Trash2 className="mr-ds-1 h-4 w-4" />
                            {isDeleting ? "해제 중..." : "해제"}
                          </Button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
