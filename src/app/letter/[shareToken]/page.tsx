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
