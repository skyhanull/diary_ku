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
