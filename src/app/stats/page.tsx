// 통계 페이지: 아직 개발 중인 기능으로, 준비 중 안내 화면을 보여준다
import { DeferredFeaturePage } from '@/components/layout/DeferredFeaturePage';

export default function StatsPage() {
  return (
    <DeferredFeaturePage
      eyebrow="Deferred"
      title="통계는 MVP 범위 외 기능입니다"
      description="감정 흐름, 작성 빈도, 태그 패턴을 시각화하는 통계 기능은 후속 확장 영역으로 분리했습니다."
    />
  );
}
