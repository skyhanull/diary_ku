import { AppHeader } from '@/components/layout/AppHeader';

export default function RecordsPage() {
  return (
    <div className="min-h-screen bg-[#fdf8f5] text-[#34322f]">
      <AppHeader activeItem="기록" />
      <main className="mx-auto max-w-[1440px] px-6 py-12 lg:px-8">
        <div className="rounded-[28px] border border-[#ece7e3] bg-white p-10 shadow-[0_12px_32px_rgba(52,50,47,0.04)]">
          <p className="font-['Epilogue'] text-sm font-bold uppercase tracking-[0.24em] text-[#8C6A5D]">Records</p>
          <h1 className="mt-4 font-['Epilogue'] text-4xl font-bold tracking-tight">기록</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-[#6f5c45]">
            날짜를 중심으로 일기를 열고, 작성 중인 기록과 최근 저장한 페이지를 관리하는 공간입니다.
          </p>
        </div>
      </main>
    </div>
  );
}
