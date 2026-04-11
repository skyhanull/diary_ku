import { DeferredFeaturePage } from '@/components/layout/DeferredFeaturePage';

export default function MyPage() {
  return (
    <DeferredFeaturePage
      eyebrow="Deferred"
      title="마이페이지는 MVP 범위 외 기능입니다"
      description="프로필 수정, 로그아웃, 계정 설정 기능은 핵심 에디터 플로우 이후의 후속 확장 영역으로 분리했습니다."
    />
  );
}
