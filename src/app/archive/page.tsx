// 보관함 페이지: 헤더 + ArchiveDashboard를 조합하는 라우트 진입점
import { AppHeader } from '@/components/layout/AppHeader';
import { ArchiveDashboard } from '@/features/archive/components/ArchiveDashboard';

export default function ArchivePage() {
  return (
    <div className="min-h-screen bg-vellum text-ink">
      <AppHeader activeItem="보관함" />
      <ArchiveDashboard />
    </div>
  );
}
