// 공유 편지 페이지: shareToken으로 공유된 일기 편지를 읽기 전용으로 보여주는 라우트
import type { Metadata } from 'next';

import { loadSharedLetter } from '@/features/editor/lib/editor-persistence';
import { SharedLetterScreen } from '@/features/share/components/SharedLetterScreen';
import { htmlToPlainText } from '@/lib/html';

interface LetterPageProps {
  params: Promise<{
    shareToken: string;
  }>;
}

// 링크 미리보기(카카오·SNS 등)를 위해 편지 제목·본문 일부로 OG 메타데이터를 구성한다.
// 공유 편지는 링크를 아는 사람만 보는 사적 콘텐츠라 검색 색인은 막는다.
export async function generateMetadata({ params }: LetterPageProps): Promise<Metadata> {
  const { shareToken } = await params;

  try {
    const letter = await loadSharedLetter(shareToken);
    if (!letter) {
      return { title: '편지를 찾을 수 없어요', robots: { index: false, follow: false } };
    }

    const recipient = letter.recipientName?.trim();
    const title = recipient
      ? `${recipient}에게 보내는 편지`
      : letter.snapshot.title?.trim() || 'Memolie 편지';

    const snippet = htmlToPlainText(letter.snapshot.bodyHtml).replace(/\s+/g, ' ').trim();
    const description = snippet
      ? `${snippet.slice(0, 90)}${snippet.length > 90 ? '…' : ''}`
      : '따뜻한 편지가 도착했어요. 링크를 열어 확인해보세요.';

    return {
      title,
      description,
      openGraph: { title: `${title} | Memolie`, description, type: 'article' },
      twitter: { card: 'summary_large_image', title: `${title} | Memolie`, description },
      robots: { index: false, follow: false }
    };
  } catch {
    return { title: 'Memolie 편지', robots: { index: false, follow: false } };
  }
}

export default async function LetterPage({ params }: LetterPageProps) {
  const { shareToken } = await params;

  return <SharedLetterScreen shareToken={shareToken} />;
}
