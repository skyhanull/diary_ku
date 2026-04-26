// 공유 편지 페이지: shareToken으로 공유된 일기 편지를 읽기 전용으로 보여주는 라우트
import { SharedLetterScreen } from '@/features/share/components/SharedLetterScreen';

interface LetterPageProps {
  params: Promise<{
    shareToken: string;
  }>;
}

export default async function LetterPage({ params }: LetterPageProps) {
  const { shareToken } = await params;

  return <SharedLetterScreen shareToken={shareToken} />;
}
