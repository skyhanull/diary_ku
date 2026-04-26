// 감정 유틸: 이모지 → 점수 변환과 일기 본문에서 감정 점수를 추출하는 함수를 제공한다
import { moodMeta } from '@/lib/mood';
import type { MoodScore } from '@/lib/mood';

// 감정 이모지를 0~100 점수로 매핑하는 테이블
const moodScoreByIcon = new Map<string, MoodScore>(moodMeta.map((item) => [item.emoji, item.score]));

// 감정 이모지 문자열을 받아 대응하는 점수를 반환한다 (없으면 undefined)
export function getMoodScore(mood: string | null | undefined) {
  if (!mood) return undefined;
  return moodScoreByIcon.get(mood);
}
