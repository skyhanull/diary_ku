'use client';
// 공유 편지 화면: shareToken으로 공유된 일기를 봉투 열기 연출과 함께 읽기 전용 편지로 렌더링한다
import { useEffect, useMemo, useState } from 'react';
import { Copy, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { NoticeBox } from '@/components/ui/notice-box';
import { SurfaceCard } from '@/components/ui/surface-card';
import { extractEditorBodyText } from '@/features/editor/lib/editor-body';
import { loadSharedLetter } from '@/features/editor/lib/editor-persistence';
import type { SharedLetterRecord } from '@/features/editor/types/editor.types';
import { LetterEnvelopeStage } from './LetterEnvelopeStage';

// SharedLetterScreen 컴포넌트에 전달되는 공유 토큰 prop 타입이다
interface SharedLetterScreenProps {
  shareToken: string;
}

// 편지 테마별 배경·봉투·종이 Tailwind 클래스와 강조색을 모아둔 상수다
const paperThemeClasses = {
  paper: {
    shell: 'from-[#f8efe6] via-[#fffaf5] to-[#efe2d6]',
    envelope: 'from-[#f3e3d2] via-[#f9ecdf] to-[#e8d4c2]',
    flap: 'from-[#ead7c6] to-[#f7ebde]',
    seal: '#b98c6d'
  },
  cream: {
    shell: 'from-[#f5eedc] via-[#fff9ec] to-[#e7dcbc]',
    envelope: 'from-[#efe4c9] via-[#faf4df] to-[#decfa8]',
    flap: 'from-[#e8dbb8] to-[#f8f1d8]',
    seal: '#b39a52'
  },
  midnight: {
    shell: 'from-[#1f2030] via-[#2c2438] to-[#49354e]',
    envelope: 'from-[#403149] via-[#5a4260] to-[#7a5f78]',
    flap: 'from-[#674f6d] to-[#8d6f86]',
    seal: '#e6c79a'
  }
} as const;

// 봉투가 열리기 전 보여주는 닫힌 봉투 화면. 클릭하면 봉투 뚜껑이 열리는 연출을 시작한다.
function ClosedEnvelope({
  letter,
  theme,
  isOpening,
  onOpen
}: {
  letter: SharedLetterRecord;
  theme: (typeof paperThemeClasses)[keyof typeof paperThemeClasses];
  isOpening: boolean;
  onOpen: () => void;
}) {
  const isMidnight = letter.theme === 'midnight';

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
          <p className={`text-sm ${isMidnight ? 'text-[#e7d6c2]' : 'text-[#6f5c45]'}`}>To. {letter.recipientName}</p>
        ) : null}
        <p className={`mt-1 text-xs ${isMidnight ? 'text-[#c4b3c8]' : 'text-[#9b8170]'}`}>{letter.snapshot.entryDate}</p>
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
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);

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
  const theme = letter ? paperThemeClasses[letter.theme] : paperThemeClasses.paper;

  // 모션 최소화 설정 사용자는 봉투 연출을 건너뛰고 편지를 바로 보여준다.
  const prefersReducedMotion = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    []
  );

  const handleOpenLetter = () => {
    if (prefersReducedMotion) {
      setIsOpened(true);
      return;
    }
    setIsOpening(true);
    window.setTimeout(() => setIsOpened(true), 720);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyMessage('링크를 복사했어요.');
      window.setTimeout(() => setCopyMessage(null), 2200);
    } catch {
      setCopyMessage('링크 복사에 실패했어요.');
      window.setTimeout(() => setCopyMessage(null), 2200);
    }
  };

  return (
    <main className={`min-h-screen bg-gradient-to-br ${theme.shell} px-4 py-8 text-[#332d29]`}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/55 px-4 py-2 text-sm text-[#6f5c45] backdrop-blur">
            <Mail className="h-4 w-4" />
            Memolie Letter
          </div>
          <Button variant="outline" size="sm" onClick={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            링크 복사
          </Button>
        </div>

        {copyMessage ? <NoticeBox tone="overlay" className="mb-4">{copyMessage}</NoticeBox> : null}

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
            <LetterEnvelopeStage letter={letter} bodyText={bodyText} />
          </div>
        ) : null}
      </div>
    </main>
  );
}
