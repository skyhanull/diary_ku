import { DeferredFeaturePage } from '@/components/layout/DeferredFeaturePage';

export default function ArchivePage() {
  return (
    <DeferredFeaturePage
      eyebrow="Deferred"
      title="보관소는 MVP 범위 외 기능입니다"
      description="저장된 일기를 날짜, 태그, 분위기 기준으로 다시 찾아보는 기능은 후속 확장 영역으로 분리했습니다."
    />
  );
}
