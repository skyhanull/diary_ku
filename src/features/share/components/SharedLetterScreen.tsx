'use client';
// 공유 편지 화면: shareToken으로 공유된 일기를 봉투 열기 연출과 함께 읽기 전용 편지로 렌더링한다
import { useEffect, useMemo, useRef, useState } from 'react';
import { Copy, Download, Mail, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { NoticeBox } from '@/components/ui/notice-box';
import { SurfaceCard } from '@/components/ui/surface-card';
import { extractEditorBodyText } from '@/features/editor/lib/editor-body';
import { loadSharedLetter } from '@/features/editor/lib/editor-persistence';
import type { SharedLetterRecord } from '@/features/editor/types/editor.types';
import { getLetterTheme, type LetterThemeVisual } from '@/features/share/lib/letter-theme';
import { LetterEnvelopeStage } from './LetterEnvelopeStage';

// SharedLetterScreen 컴포넌트에 전달되는 공유 토큰 prop 타입이다
interface SharedLetterScreenProps {
  shareToken: string;
}

// 봉투가 열리기 전 보여주는 닫힌 봉투 화면. 클릭하면 봉투 뚜껑이 열리는 연출을 시작한다.
function ClosedEnvelope({
  letter,
  theme,
  isOpening,
  onOpen
}: {
  letter: SharedLetterRecord;
  theme: LetterThemeVisual;
  isOpening: boolean;
  onOpen: () => void;
}) {
  return (
    <div className={`mx-auto max-w-[520px] transition-opacity duration-500 ${isOpening ? 'opacity-0' : 'opacity-100'}`}>
      <div className="relative aspect-[3/2] [perspective:1400px]">
        {/* 봉투 몸통 */}
        <div className={`absolute inset-0 rounded-[18px] bg-gradient-to-br ${theme.envelope} shadow-[0_24px_60px_rgba(78,60,45,0.2)]`} />

        {/* 살짝 보이는 편지지 */}
        <div className="absolute inset-x-6 top-5 bottom-10 rounded-[12px] bg-[linear-gradient(180deg,#fffdf8_0%,#fff8f0_100%)] shadow-[0_6px_18px_rgba(76,54,36,0.12)]" />

        {/* 아래로 접힌 앞면 */}
        <div
          className={`absolute inset-0 rounded-b-[18px] bg-gradient-to-t ${theme.envelope}`}
          style={{ clipPath: 'polygon(0 42%, 50% 100%, 100% 42%, 100% 100%, 0 100%)' }}
        />

        {/* 봉투 뚜껑: 열림 시 위로 젖혀진다 */}
        <div
          className={`absolute inset-x-0 top-0 h-[62%] origin-top rounded-t-[18px] bg-gradient-to-b ${theme.flap} shadow-[0_10px_20px_rgba(76,54,36,0.12)] transition-transform duration-700 ease-in-out [backface-visibility:hidden]`}
          style={{ clipPath: 'polygon(0 0, 100% 0, 50% 92%)', transform: isOpening ? 'rotateX(-172deg)' : 'rotateX(0deg)' }}
        />

        {/* 밀랍 실 */}
        <div
          className={`absolute left-1/2 top-[52%] h-11 w-11 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_3px_8px_rgba(76,54,36,0.28)] transition-opacity duration-300 ${isOpening ? 'opacity-0' : 'opacity-100'}`}
          style={{ backgroundColor: theme.seal }}
        >
          <span className="grid h-full w-full place-items-center text-sm font-bold text-white/85">M</span>
        </div>
      </div>

      <div className="mt-8 text-center">
        {letter.recipientName ? (
          <p className={`text-sm ${theme.ink}`}>To. {letter.recipientName}</p>
        ) : null}
        {/* 커버 메시지: 봉투를 열기 전, 보내는 사람이 남긴 짧은 인사말 */}
        {letter.coverMessage ? (
          <p className={`mx-auto mt-3 max-w-[420px] whitespace-pre-wrap text-[15px] leading-relaxed ${theme.ink}`}>
            {letter.coverMessage}
          </p>
        ) : null}
        <p className={`mt-2 text-xs ${theme.inkSoft}`}>{letter.snapshot.entryDate}</p>
        <Button className="mt-5 h-11 px-8" onClick={onOpen} disabled={isOpening}>
          <Mail className="mr-2 h-4 w-4" />
          편지 열어보기
        </Button>
      </div>
    </div>
  );
}

// shareToken으로 공유 편지를 불러와 봉투 열기 연출과 함께 읽기 전용으로 보여주는 컴포넌트다
export function SharedLetterScreen({ shareToken }: SharedLetterScreenProps) {
  const [letter, setLetter] = useState<SharedLetterRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [isSavingImage, setIsSavingImage] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const letterRef = useRef<HTMLElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchLetter = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const nextLetter = await loadSharedLetter(shareToken);
        if (!isMounted) return;

        if (!nextLetter) {
          setError('편지를 찾을 수 없어요.');
          return;
        }

        setLetter(nextLetter);
      } catch (nextError) {
        if (!isMounted) return;
        setError(nextError instanceof Error ? nextError.message : '편지를 불러오는 중 문제가 발생했어요.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchLetter();

    return () => {
      isMounted = false;
    };
  }, [shareToken]);

  const bodyText = useMemo(() => extractEditorBodyText(letter?.snapshot.bodyHtml ?? null), [letter]);
  const theme = getLetterTheme(letter?.theme);

  // 모션 최소화 설정 사용자는 봉투 연출을 건너뛰고 편지를 바로 보여준다.
  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const flashNotice = (message: string) => {
    setNoticeMessage(message);
    window.setTimeout(() => setNoticeMessage((current) => (current === message ? null : current)), 2200);
  };

  const handleOpenLetter = () => {
    if (prefersReducedMotion) {
      setIsOpened(true);
      return;
    }
    setIsOpening(true);
    window.setTimeout(() => setIsOpened(true), 720);
  };

  // 다시 봉투 닫힘 상태로 되돌려 열기 연출을 처음부터 다시 볼 수 있게 한다.
  const handleReplay = () => {
    setIsOpened(false);
    setIsOpening(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      flashNotice('링크를 복사했어요.');
    } catch {
      flashNotice('링크 복사에 실패했어요.');
    }
  };

  // Blob을 PNG 파일로 내려받는다.
  const triggerDownload = (blob: Blob) => {
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `memolie-letter-${shareToken}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  };

  // 편지지 전체(본문+아이템)를 html2canvas로 캡처해 PNG로 저장한다.
  // 원격 이미지 CORS 등으로 캡처가 실패하면 서버 OG 카드 이미지로 폴백한다.
  const handleSaveImage = async () => {
    setIsSavingImage(true);
    try {
      const node = letterRef.current;
      if (!node) throw new Error('편지지를 찾지 못했어요.');

      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(node, {
        useCORS: true,
        backgroundColor: '#fffdf9',
        scale: Math.min(2, (window.devicePixelRatio || 1) + 1)
      });
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('capture failed');

      triggerDownload(blob);
      flashNotice('편지 이미지를 저장했어요.');
    } catch {
      // 폴백: 서버가 만든 OG 카드(요약) 이미지
      try {
        const response = await fetch(`/letter/${shareToken}/opengraph-image`);
        if (!response.ok) throw new Error('fallback failed');
        triggerDownload(await response.blob());
        flashNotice('편지 카드 이미지를 저장했어요.');
      } catch {
        flashNotice('이미지 저장에 실패했어요.');
      }
    } finally {
      setIsSavingImage(false);
    }
  };

  return (
    <main className={`min-h-screen bg-gradient-to-br ${theme.shell} px-4 py-8 text-[#332d29]`}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/55 px-4 py-2 text-sm text-[#6f5c45] backdrop-blur">
            <Mail className="h-4 w-4" />
            Memolie Letter
          </div>
          <div className="flex items-center gap-2">
            {isOpened ? (
              <>
                <Button variant="ghost" size="sm" onClick={handleReplay}>
                  <RotateCcw className="mr-2 h-4 w-4" />
                  다시 보기
                </Button>
                <Button variant="outline" size="sm" onClick={handleSaveImage} disabled={isSavingImage}>
                  <Download className="mr-2 h-4 w-4" />
                  {isSavingImage ? '저장 중...' : '이미지 저장'}
                </Button>
              </>
            ) : null}
            <Button variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" />
              링크 복사
            </Button>
          </div>
        </div>

        {noticeMessage ? <NoticeBox tone="overlay" className="mb-4">{noticeMessage}</NoticeBox> : null}

        {isLoading ? (
          <SurfaceCard tone="overlay" radius="xl" className="rounded-[32px] px-8 py-20 text-center text-[#6f5c45]">
            편지를 준비하고 있어요...
          </SurfaceCard>
        ) : null}

        {error ? (
          <SurfaceCard tone="overlay" radius="xl" className="rounded-[32px] px-8 py-20 text-center">
            <p className="text-xl font-semibold">편지를 열 수 없어요.</p>
            <p className="mt-2 text-sm text-[#6f5c45]">{error}</p>
          </SurfaceCard>
        ) : null}

        {letter && !isOpened ? (
          <div className="py-10">
            <ClosedEnvelope letter={letter} theme={theme} isOpening={isOpening} onOpen={handleOpenLetter} />
          </div>
        ) : null}

        {letter && isOpened ? (
          <div className="animate-letter-in">
            <LetterEnvelopeStage letter={letter} bodyText={bodyText} captureRef={letterRef} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
