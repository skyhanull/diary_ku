import { toDateKey } from '@/features/home/lib/home-calendar';
import type { DiaryEntrySummary, MoodTrendPoint } from '@/features/home/types/home.types';

const moodScoreByIcon = new Map<string, number>([
  ['😢', 20],
  ['🙁', 40],
  ['😐', 60],
  ['🙂', 80],
  ['😄', 100]
]);

export function getMoodScore(mood: string | null | undefined) {
  if (!mood) return undefined;
  return moodScoreByIcon.get(mood);
}

export function buildRecentMoodTrend(entries: DiaryEntrySummary[], baseDate: Date): MoodTrendPoint[] {
  const entriesByDate = new Map(entries.map((entry) => [entry.date, entry]));

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() - (6 - index));

    const dateKey = toDateKey(date);
    const score = entriesByDate.get(dateKey)?.moodScore ?? null;

    return {
      date: dateKey,
      label: new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(date),
      score
    };
  });
}
