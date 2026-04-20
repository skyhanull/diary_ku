import { AppHeader } from '@/components/layout/AppHeader';
import { ArchiveDashboard } from '@/features/archive/components/ArchiveDashboard';

export default function ArchivePage() {
  return (
    <div className="min-h-screen bg-vellum text-ink">
      <AppHeader activeItem="보관함" showSearch={false} />
      <ArchiveDashboard />
    </div>
  );
}
