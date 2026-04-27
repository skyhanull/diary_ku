// 보관함 검색/랭킹: 텍스트·태그·미디어 기준으로 일기를 점수화해 정렬한다
import type { DiaryEntrySummary } from '@/features/home/types/home.types';

// 검색 결과 한 건을 나타내는 타입으로, 원본 엔트리·점수·일치 이유를 담는다
export interface ArchiveSearchResult {
  entry: DiaryEntrySummary;
  score: number;
  reasons: string[];
}

// 점수 계산에 쓰이는 정규화된 필드 묶음으로, buildSearchIndex가 채운다
interface SearchIndex {
  title: string;
  body: string;
  tags: string[];
  date: string;
  mood: string;
  items: string;
}

// 감정 점수별로 검색에 쓸 동의어 텍스트를 매핑한 테이블이다
const moodSearchTextByScore = new Map([
  [100, '좋음 행복 기쁨 밝음'],
  [80, '평온 차분 안정'],
  [60, '보통 무난'],
  [40, '흐림 우울 다운'],
  [20, '슬픔 눈물 속상']
]);

// 검색 텍스트를 소문자·유니코드 정규화·특수문자 제거로 표준화한다
export function normalizeSearchText(value: string) {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// 검색어 문자열을 정규화한 뒤 공백 기준으로 토큰 배열로 나눈다
function tokenizeQuery(query: string) {
  return normalizeSearchText(query).split(' ').filter(Boolean);
}

// 날짜 문자열에서 하이픈을 제거해 "20260426" 형태로 만든다 (날짜 검색용)
function compactDate(date: string) {
  return date.replace(/-/g, '');
}

// 엔트리의 감정 점수에 해당하는 검색용 동의어 텍스트를 반환한다
function getMoodSearchText(entry: DiaryEntrySummary) {
  return entry.moodScore === undefined ? '' : moodSearchTextByScore.get(entry.moodScore) ?? '';
}

function buildSearchIndex(entry: DiaryEntrySummary): SearchIndex {
  // 검색 품질을 위해 필드를 분리한 인덱스를 만든다.
  // 나중에 score 계산에서 제목/태그/본문/캔버스 텍스트에 서로 다른 가중치를 준다.
  return {
    title: normalizeSearchText(entry.title ?? ''),
    body: normalizeSearchText(entry.bodyText ?? ''),
    tags: (entry.tags ?? []).map(normalizeSearchText).filter(Boolean),
    date: `${entry.date} ${compactDate(entry.date)}`,
    mood: normalizeSearchText(getMoodSearchText(entry)),
    items: normalizeSearchText(entry.itemSearchText ?? ''),
  };
}

// 이유 Set이 3개 미만일 때만 새 이유를 추가해 표시 개수를 제한한다
function addReason(reasons: Set<string>, reason: string) {
  if (reasons.size < 3) {
    reasons.add(reason);
  }
}

// 단일 필드와 검색어를 비교해 완전일치·전방일치·포함 가중치 중 해당하는 점수를 반환한다
function scoreField(field: string, term: string, weights: { exact: number; startsWith: number; includes: number }) {
  if (!field) return 0;
  if (field === term) return weights.exact;
  if (field.startsWith(term)) return weights.startsWith;
  if (field.includes(term)) return weights.includes;
  return 0;
}

// 태그 배열 전체를 순회하며 검색어와의 일치 점수를 합산한다
function scoreTags(tags: string[], term: string) {
  return tags.reduce((score, tag) => score + scoreField(tag, term, { exact: 100, startsWith: 72, includes: 42 }), 0);
}

// 최신 엔트리 날짜 기준으로 가까울수록 최대 18점의 최신성 가산점을 계산한다
function getRecencyBoost(entryDate: string, latestEntryDate: string | null) {
  if (!latestEntryDate) return 0;

  const current = new Date(`${entryDate}T00:00:00`).getTime();
  const latest = new Date(`${latestEntryDate}T00:00:00`).getTime();
  if (!Number.isFinite(current) || !Number.isFinite(latest)) return 0;

  const daysFromLatest = Math.max(0, Math.round((latest - current) / 86_400_000));
  return Math.max(0, 18 - Math.min(18, Math.floor(daysFromLatest / 7)));
}

// 전체 엔트리에 검색어 기반 점수를 매겨 높은 순으로 정렬된 결과 배열을 반환한다
export function rankArchiveEntries(entries: DiaryEntrySummary[], query: string): ArchiveSearchResult[] {
  const terms = tokenizeQuery(query);
  const latestEntryDate = entries.reduce<string | null>((latest, entry) => {
    if (!latest) return entry.date;
    return entry.date > latest ? entry.date : latest;
  }, null);

  if (terms.length === 0) {
    // 검색어가 없을 때는 검색 결과가 아니라 "최신 기록 목록"처럼 보이게 한다.
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
        // 제목/태그는 강하게, 본문/아이템 텍스트는 보조적으로 점수를 준다.
        // 그래서 본문에 우연히 단어가 한 번 나온 기록보다 제목/태그가 맞는 기록이 먼저 올라온다.
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
        // 여러 검색어를 모두 만족하면 추가 가산점을 준다.
        score += 32;
        addReason(reasons, '검색어 모두 포함');
      }

      return { entry, score, reasons: Array.from(reasons) };
    })
    .filter((result) => result.score > getRecencyBoost(result.entry.date, latestEntryDate))
    .sort((left, right) => right.score - left.score || right.entry.date.localeCompare(left.entry.date));
}
