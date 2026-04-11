import { DeferredFeaturePage } from '@/components/layout/DeferredFeaturePage';

export default function LibraryPage() {
  return (
    <DeferredFeaturePage
      eyebrow="Deferred"
      title="서재는 MVP 범위 외 기능입니다"
      description="자주 쓰는 문장, 스티커, 배경 테마를 모아두는 라이브러리 기능은 후속 확장 영역으로 분리했습니다."
    />
  );
}
