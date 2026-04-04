import { AppHeader } from '@/components/layout/AppHeader';

export default function LibraryPage() {
  return (
    <div className="min-h-screen bg-[#fdf8f5] text-[#34322f]">
      <AppHeader activeItem="서재" />
      <main className="mx-auto max-w-[1440px] px-6 py-12 lg:px-8">
        <div className="rounded-[28px] border border-[#ece7e3] bg-white p-10 shadow-[0_12px_32px_rgba(52,50,47,0.04)]">
          <p className="font-['Epilogue'] text-sm font-bold uppercase tracking-[0.24em] text-[#8C6A5D]">Library</p>
          <h1 className="mt-4 font-['Epilogue'] text-4xl font-bold tracking-tight">서재</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6f5c45]">
            자주 쓰는 문장, 좋아하는 스티커, 배경 테마 같은 창작 재료를 모아두는 공간으로 확장할 수 있습니다.
          </p>
        </div>
      </main>
    </div>
  );
}
