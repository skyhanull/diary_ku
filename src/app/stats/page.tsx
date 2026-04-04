import { AppHeader } from '@/components/layout/AppHeader';

export default function StatsPage() {
  return (
    <div className="min-h-screen bg-[#fdf8f5] text-[#34322f]">
      <AppHeader activeItem="통계" />
      <main className="mx-auto max-w-[1440px] px-6 py-12 lg:px-8">
        <div className="rounded-[28px] border border-[#ece7e3] bg-white p-10 shadow-[0_12px_32px_rgba(52,50,47,0.04)]">
          <p className="font-['Epilogue'] text-sm font-bold uppercase tracking-[0.24em] text-[#8C6A5D]">Stats</p>
          <h1 className="mt-4 font-['Epilogue'] text-4xl font-bold tracking-tight">통계</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6f5c45]">
            감정 흐름, 작성 빈도, 태그 패턴처럼 기록 습관을 시각적으로 살펴보는 영역입니다.
          </p>
        </div>
      </main>
    </div>
  );
}
