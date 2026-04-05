import { AppHeader } from '@/components/layout/AppHeader';

export default function ArchivePage() {
  return (
    <div className="min-h-screen bg-[#fdf8f5] text-[#34322f]">
      <AppHeader activeItem="보관소" />
      <main className="mx-auto max-w-[1440px] px-6 py-12 lg:px-8">
        <div className="rounded-[28px] border border-[#ece7e3] bg-white p-10 shadow-[0_12px_32px_rgba(52,50,47,0.04)]">
          <p className="font-['Epilogue'] text-sm font-bold uppercase tracking-[0.24em] text-[#8C6A5D]">Archive</p>
          <h1 className="mt-4 font-['Epilogue'] text-4xl font-bold tracking-tight">보관소</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6f5c45]">
            저장된 일기를 날짜, 태그, 분위기 기준으로 다시 찾아보고 정리할 수 있는 페이지입니다.
          </p>
        </div>
      </main>
    </div>
  );
}
