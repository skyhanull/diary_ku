// 루트 레이아웃: 앱 전체 HTML 껍데기, 메타데이터, 글로벌 스타일을 정의한다
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Memolie',
    template: '%s | Memolie'
  },
  description: '감정 기록, 캘린더 회고, AI 대화, 편지형 공유를 하나의 흐름으로 연결한 다이어리 웹앱',
  applicationName: 'Memolie',
  keywords: ['digital diary', 'next.js portfolio', 'supabase', 'rag chat', 'canvas editor'],
  openGraph: {
    title: 'Memolie',
    description: '감정 기록과 AI 회고, 편지형 공유를 지원하는 다이어리 웹앱',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Memolie',
    description: '감정 기록과 AI 회고, 편지형 공유를 지원하는 다이어리 웹앱'
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
