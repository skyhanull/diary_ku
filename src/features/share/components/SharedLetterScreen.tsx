'use client';

import { useEffect, useMemo, useState } from 'react';
import { Copy, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { NoticeBox } from '@/components/ui/notice-box';
import { SurfaceCard } from '@/components/ui/surface-card';
import { loadSharedLetter } from '@/features/editor/lib/editor-persistence';
import type { SharedLetterRecord } from '@/features/editor/types/editor.types';
import { LetterEnvelopeStage } from './LetterEnvelopeStage';

interface SharedLetterScreenProps {
  shareToken: string;
}

const paperThemeClasses = {
  paper: {
    shell: 'from-[#f8efe6] via-[#fffaf5] to-[#efe2d6]',
    envelope: 'from-[#f3e3d2] via-[#f9ecdf] to-[#e8d4c2]',
    flap: 'from-[#ead7c6] to-[#f7ebde]',
    paper: 'from-[#fffdfa] via-[#fff8f1] to-[#f6eee3]',
    accent: '#8c6a5d'
  },
  cream: {
    shell: 'from-[#f5eedc] via-[#fff9ec] to-[#e7dcbc]',
    envelope: 'from-[#efe4c9] via-[#faf4df] to-[#decfa8]',
    flap: 'from-[#e8dbb8] to-[#f8f1d8]',
    paper: 'from-[#fffef8] via-[#fff9ee] to-[#f3ebd6]',
    accent: '#8b6f2d'
  },
  midnight: {
    shell: 'from-[#1f2030] via-[#2c2438] to-[#49354e]',
    envelope: 'from-[#403149] via-[#5a4260] to-[#7a5f78]',
    flap: 'from-[#674f6d] to-[#8d6f86]',
    paper: 'from-[#f9f4ef] via-[#fffaf6] to-[#ece2d8]',
    accent: '#f0d4ae'
  }
} as const;

function extractBodyText(bodyHtml: string | null) {
  if (!bodyHtml) return '';
  return [...bodyHtml.matchAll(/<p>(.*?)<\/p>/g)]
    .map((match) => match[1].trim())
    .filter(Boolean)
    .join('\n');
}

export function SharedLetterScreen({ shareToken }: SharedLetterScreenProps) {
  const [letter, setLetter] = useState<SharedLetterRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);

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

  const bodyText = useMemo(() => extractBodyText(letter?.snapshot.bodyHtml ?? null), [letter]);
  const theme = letter ? paperThemeClasses[letter.theme] : paperThemeClasses.paper;

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

        {letter ? <LetterEnvelopeStage letter={letter} bodyText={bodyText} /> : null}
      </div>
    </main>
  );
}
