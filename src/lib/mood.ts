// 앱 전체에서 공통으로 쓰는 감정 점수 메타 테이블이다.
// 점수 -> 이모지/라벨/색상 규칙을 한 군데에 두고 홈, 보관함, 통계가 같이 참조한다.
// 감정 점수별 이모지·라벨·색상을 순서대로 정의한 배열이다
export const moodMeta = [
  { score: 100, emoji: '😄', label: '좋음', color: 'var(--mood-happy)' },
  { score: 80, emoji: '🙂', label: '평온', color: 'var(--mood-calm)' },
  { score: 60, emoji: '😐', label: '보통', color: 'var(--mood-neutral)' },
  { score: 40, emoji: '🙁', label: '흐림', color: 'var(--mood-cloudy)' },
  { score: 20, emoji: '😢', label: '슬픔', color: 'var(--mood-sad)' }
] as const;

export type MoodScore = (typeof moodMeta)[number]["score"];

// 점수를 키로 감정 메타 항목을 O(1)로 조회할 수 있는 Map이다
export const moodMetaByScore = new Map(moodMeta.map((item) => [item.score, item] as const));
