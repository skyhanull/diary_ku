// 루트 레이아웃: 앱 전체 HTML 껍데기, 메타데이터, 글로벌 스타일을 정의한다
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Memolie',
  description: 'Digital diary decoration app'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
