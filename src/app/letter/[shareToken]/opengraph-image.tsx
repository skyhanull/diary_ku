// 공유 편지 OG 이미지: 링크 미리보기(카카오·SNS)와 "이미지 저장" 다운로드에 함께 쓰는 편지 카드 PNG.
// 한글 렌더링을 위해 요청 시 웹폰트를 불러오되, 폰트 로드가 실패해도 크롤러에 500을 주지 않도록 폴백한다.
import { ImageResponse } from 'next/og';

import { loadSharedLetter } from '@/features/editor/lib/editor-persistence';
import { getLetterTheme } from '@/features/share/lib/letter-theme';
import { htmlToPlainText } from '@/lib/html';

export const alt = 'Memolie 편지';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface OgImageProps {
  params: Promise<{ shareToken: string }>;
}

// 한글이 포함된 편지 텍스트를 렌더링하려면 CJK를 지원하는 폰트가 필요하다.
// 단일 OTF(Pretendard)만 받아 크기로 위계를 표현하고, 폰트 fetch는 캐시해 매 요청 다운로드를 피한다.
async function loadKoreanFont(): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(
      'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-SemiBold.otf',
      { cache: 'force-cache' }
    );
    if (!response.ok) return null;
    return await response.arrayBuffer();
  } catch {
    return null;
  }
}

export default async function OpengraphImage({ params }: OgImageProps) {
  const { shareToken } = await params;

  const [letter, fontData] = await Promise.all([
    loadSharedLetter(shareToken).catch(() => null),
    loadKoreanFont()
  ]);

  const theme = getLetterTheme(letter?.theme);
  const recipient = letter?.recipientName?.trim();
  const title = letter?.snapshot.title?.trim() || (recipient ? `${recipient}에게 보내는 편지` : 'Memolie 편지');
  const cover = letter?.coverMessage?.trim();
  const body = cover || htmlToPlainText(letter?.snapshot.bodyHtml ?? '').replace(/\s+/g, ' ').trim();
  const snippet = body ? `${body.slice(0, 88)}${body.length > 88 ? '…' : ''}` : '따뜻한 편지가 도착했어요.';

  const fonts = fontData
    ? [{ name: 'Pretendard', data: fontData, weight: 400 as const, style: 'normal' as const }]
    : undefined;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px',
          background: theme.og.background,
          fontFamily: fonts ? 'Pretendard' : 'sans-serif'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            borderRadius: '36px',
            background: theme.og.card,
            padding: '64px 72px',
            justifyContent: 'space-between',
            boxShadow: '0 24px 60px rgba(52,50,47,0.18)'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                fontSize: '26px',
                letterSpacing: '8px',
                color: theme.og.accent
              }}
            >
              MEMOLIE LETTER
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: '32px',
                fontSize: '68px',
                lineHeight: 1.2,
                color: theme.og.ink
              }}
            >
              {title}
            </div>
            {recipient ? (
              <div style={{ display: 'flex', marginTop: '24px', fontSize: '30px', color: theme.og.accent }}>
                To. {recipient}
              </div>
            ) : null}
            <div
              style={{
                display: 'flex',
                marginTop: '28px',
                fontSize: '32px',
                lineHeight: 1.5,
                color: theme.og.inkSoft
              }}
            >
              {snippet}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', fontSize: '26px', color: theme.og.inkSoft }}>
              {letter?.snapshot.entryDate ?? ''}
            </div>
            <div style={{ display: 'flex', fontSize: '26px', color: theme.og.accent }}>✉ Memolie</div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts }
  );
}
