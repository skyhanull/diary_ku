import Link from 'next/link';

import { AppHeader } from '@/components/layout/AppHeader';

interface DeferredFeaturePageProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function DeferredFeaturePage({ eyebrow, title, description }: DeferredFeaturePageProps) {
  return (
    <div className="min-h-screen bg-vellum text-ink">
      <AppHeader showSearch={false} />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[960px] items-center px-ds-6 py-12 lg:px-ds-8">
        <section className="w-full rounded-[32px] border border-line bg-white p-8 shadow-[0_18px_48px_rgba(52,50,47,0.06)] md:p-12">
          <p className="font-display text-ds-body font-bold uppercase tracking-[0.24em] text-cedar">{eyebrow}</p>
          <h1 className="mt-ds-4 font-display text-ds-display font-bold tracking-tight">{title}</h1>
          <p className="mt-ds-4 max-w-2xl text-ds-title leading-7 text-ink-warm">{description}</p>
          <p className="mt-ds-6 rounded-2xl bg-oatmeal px-ds-4 py-ds-3 text-ds-body leading-6 text-ink-warm">
            이 화면은 공개 포트폴리오 기준으로 미완성 기능을 과하게 노출하지 않기 위해 MVP 범위 외로 분리했습니다. 현재 데모의 핵심 흐름은
            홈 캘린더, 일기 에디터, 저장, 편지형 공유 링크입니다.
          </p>
          <Link
            href="/"
            className="mt-ds-8 inline-flex h-10 items-center justify-center rounded-2xl bg-cedar px-ds-4 py-ds-2 text-ds-body font-medium text-white shadow-[0_12px_32px_rgba(52,50,47,0.08)] transition-all duration-200 hover:bg-cedar-dark active:scale-[0.98]"
          >
            핵심 데모로 돌아가기
          </Link>
        </section>
      </main>
    </div>
  );
}
