// 홈 페이지: 헤더 + 월간 캘린더 + 인사이트 패널이 있는 메인 화면
import { AppHeader } from '@/components/layout/AppHeader';
import { HomeDashboard } from '@/features/home/components/HomeDashboard';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#fdf8f5] text-[#34322f]">
      <AppHeader activeItem="기록" />
      <HomeDashboard />
    </div>
  );
}
