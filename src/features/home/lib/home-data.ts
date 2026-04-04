import type { DiaryEntrySummary } from '@/features/home/types/home.types';

export const diaryEntries: DiaryEntrySummary[] = [
  { id: 'entry-2024-10-01', date: '2024-10-01', status: 'draft', moodScore: 3, hasText: true },
  { id: 'entry-2024-10-03', date: '2024-10-03', title: '가을 산책', status: 'saved', moodScore: 4, hasPhoto: true, hasText: true },
  { id: 'entry-2024-10-05', date: '2024-10-05', status: 'draft', moodScore: 2, hasSticker: true },
  { id: 'entry-2024-10-07', date: '2024-10-07', title: '아침 산책', status: 'published', moodScore: 5, hasText: true, hasPhoto: true, hasSticker: true },
  { id: 'entry-2024-10-10', date: '2024-10-10', title: '기록 중...', status: 'draft', moodScore: 4, hasText: true },
  { id: 'entry-2024-10-12', date: '2024-10-12', status: 'saved', moodScore: 3, hasPhoto: true },
  { id: 'entry-2024-10-18', date: '2024-10-18', title: '조용한 밤', status: 'saved', moodScore: 4, hasText: true, hasSticker: true },
  { id: 'entry-2024-10-23', date: '2024-10-23', status: 'draft', moodScore: 2, hasText: true },
  { id: 'entry-2024-10-27', date: '2024-10-27', title: '작은 기쁨', status: 'published', moodScore: 5, hasPhoto: true, hasText: true },
  { id: 'entry-2024-10-30', date: '2024-10-30', status: 'saved', moodScore: 3, hasSticker: true }
];

export const moodHistory = [60, 40, 85, 70, 95, 50, 80];

const fortuneMessages = [
  '작은 기쁨을 놓치지 않을수록 오늘이 더 부드럽게 흘러가요.',
  '천천히 적어 내려간 한 줄이 마음을 예상보다 깊게 정리해줄 거예요.',
  '익숙한 하루 안에서도 반짝이는 장면을 발견할 가능성이 커요.',
  '마음을 서두르지 않으면 오늘의 답은 자연스럽게 따라와요.',
  '지나간 감정보다 지금 스치는 온도에 귀를 기울여보면 좋아요.',
  '조용한 순간에 남긴 기록이 오늘을 가장 선명하게 붙잡아줄 거예요.',
  '완벽한 문장보다 솔직한 한 문장이 오늘의 운을 더 좋게 만들어요.',
  '사소해 보여도 마음이 머문 장면은 오늘 꼭 기록할 가치가 있어요.'
] as const;

function hashDate(dateKey: string) {
  return Array.from(dateKey).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

export function getDailyFortune(dateKey: string) {
  const seed = hashDate(dateKey);
  const score = (seed % 51) + 50;
  const message = fortuneMessages[seed % fortuneMessages.length];

  return { score, message };
}
