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
