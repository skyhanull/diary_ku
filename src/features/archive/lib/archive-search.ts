import type { DiaryEntrySummary } from '@/features/home/types/home.types';

export interface ArchiveSearchResult {
  entry: DiaryEntrySummary;
  score: number;
  reasons: string[];
}

interface SearchIndex {
  title: string;
  body: string;
  tags: string[];
  date: string;
  mood: string;
  items: string;
}

const moodSearchTextByScore = new Map([
  [100, '좋음 행복 기쁨 밝음'],
  [80, '평온 차분 안정'],
  [60, '보통 무난'],
  [40, '흐림 우울 다운'],
  [20, '슬픔 눈물 속상']
]);

export function normalizeSearchText(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeQuery(query: string) {
  return normalizeSearchText(query).split(' ').filter(Boolean);
}

function compactDate(date: string) {
  return date.replace(/-/g, '');
}

function getMoodSearchText(entry: DiaryEntrySummary) {
  return entry.moodScore === undefined ? '' : moodSearchTextByScore.get(entry.moodScore) ?? '';
}

function buildSearchIndex(entry: DiaryEntrySummary): SearchIndex {
  return {
    title: normalizeSearchText(entry.title ?? ''),
    body: normalizeSearchText(entry.bodyText ?? ''),
    tags: (entry.tags ?? []).map(normalizeSearchText).filter(Boolean),
    date: `${entry.date} ${compactDate(entry.date)}`,
    mood: normalizeSearchText(getMoodSearchText(entry)),
    items: normalizeSearchText(entry.itemSearchText ?? ''),
  };
}

function addReason(reasons: Set<string>, reason: string) {
  if (reasons.size < 3) {
    reasons.add(reason);
  }
}

function scoreField(field: string, term: string, weights: { exact: number; startsWith: number; includes: number }) {
  if (!field) return 0;
  if (field === term) return weights.exact;
  if (field.startsWith(term)) return weights.startsWith;
  if (field.includes(term)) return weights.includes;
  return 0;
}

function scoreTags(tags: string[], term: string) {
  return tags.reduce((score, tag) => score + scoreField(tag, term, { exact: 100, startsWith: 72, includes: 42 }), 0);
}

function getRecencyBoost(entryDate: string, latestEntryDate: string | null) {
  if (!latestEntryDate) return 0;

  const current = new Date(`${entryDate}T00:00:00`).getTime();
  const latest = new Date(`${latestEntryDate}T00:00:00`).getTime();
  if (!Number.isFinite(current) || !Number.isFinite(latest)) return 0;

  const daysFromLatest = Math.max(0, Math.round((latest - current) / 86_400_000));
  return Math.max(0, 18 - Math.min(18, Math.floor(daysFromLatest / 7)));
}

export function rankArchiveEntries(entries: DiaryEntrySummary[], query: string): ArchiveSearchResult[] {
  const terms = tokenizeQuery(query);
  const latestEntryDate = entries.reduce<string | null>((latest, entry) => {
    if (!latest) return entry.date;
    return entry.date > latest ? entry.date : latest;
  }, null);

  if (terms.length === 0) {
    return entries
      .map((entry) => ({ entry, score: getRecencyBoost(entry.date, latestEntryDate), reasons: ['최신 기록'] }))
      .sort((left, right) => right.entry.date.localeCompare(left.entry.date));
  }

  return entries
    .map((entry) => {
      const index = buildSearchIndex(entry);
      const reasons = new Set<string>();
      let matchedTermCount = 0;
      let score = getRecencyBoost(entry.date, latestEntryDate);

      for (const term of terms) {
        let termScore = 0;
        const titleScore = scoreField(index.title, term, { exact: 120, startsWith: 86, includes: 58 });
        const tagScore = scoreTags(index.tags, term);
        const moodScore = scoreField(index.mood, term, { exact: 46, startsWith: 34, includes: 26 });
        const bodyScore = scoreField(index.body, term, { exact: 34, startsWith: 26, includes: 16 });
        const itemsScore = scoreField(index.items, term, { exact: 30, startsWith: 22, includes: 14 });
        const dateScore = index.date.includes(term) ? 18 : 0;

        termScore += titleScore + tagScore + moodScore + bodyScore + itemsScore + dateScore;
        if (titleScore > 0) addReason(reasons, '제목 일치');
        if (tagScore > 0) addReason(reasons, '태그 일치');
        if (moodScore > 0) addReason(reasons, '감정 일치');
        if (bodyScore > 0) addReason(reasons, '본문 일치');
        if (itemsScore > 0) addReason(reasons, '스티커/이미지 일치');
        if (dateScore > 0) addReason(reasons, '날짜 일치');

        if (termScore > 0) {
          matchedTermCount += 1;
        }

        score += termScore;
      }

      if (matchedTermCount === terms.length) {
        score += 32;
        addReason(reasons, '검색어 모두 포함');
      }

      return { entry, score, reasons: Array.from(reasons) };
    })
    .filter((result) => result.score > getRecencyBoost(result.entry.date, latestEntryDate))
    .sort((left, right) => right.score - left.score || right.entry.date.localeCompare(left.entry.date));
}
