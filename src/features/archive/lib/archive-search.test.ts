// archive-search의 텍스트 정규화와 검색 랭킹 로직 단위 테스트
import { describe, expect, it } from 'vitest';

import { normalizeSearchText, rankArchiveEntries } from './archive-search';
import type { DiaryEntrySummary } from '@/features/home/types/home.types';

function makeEntry(input: Partial<DiaryEntrySummary> & Pick<DiaryEntrySummary, 'date'>): DiaryEntrySummary {
  return {
    id: input.date,
    date: input.date,
    status: input.status ?? 'saved',
    title: input.title,
    bodyText: input.bodyText,
    tags: input.tags ?? [],
    moodScore: input.moodScore,
    hasText: input.hasText ?? true,
    hasPhoto: input.hasPhoto ?? false,
    hasSticker: input.hasSticker ?? false,
    itemCount: input.itemCount ?? 0,
  };
}

describe('archive search ranking', () => {
  it('normalizes spacing, punctuation, and case before matching', () => {
    expect(normalizeSearchText('  Happy!!   여행  ')).toBe('happy 여행');
  });

  it('ranks a title match above a body-only match', () => {
    const results = rankArchiveEntries(
      [
        makeEntry({ date: '2026-04-01', title: '카페에서 쓴 하루', bodyText: '조용해서 좋았다.' }),
        makeEntry({ date: '2026-04-12', title: '그냥 하루', bodyText: '긴 일기 중간에 카페라는 단어가 한 번 나왔다.' }),
      ],
      '카페'
    );

    expect(results[0]?.entry.title).toBe('카페에서 쓴 하루');
    expect(results[0]?.reasons).toContain('제목 일치');
  });

  it('ranks an exact tag match above a body-only match', () => {
    const results = rankArchiveEntries(
      [
        makeEntry({ date: '2026-04-02', title: '봄 기록', tags: ['벚꽃'], bodyText: '산책했다.' }),
        makeEntry({ date: '2026-04-12', title: '긴 하루', bodyText: '오늘 본문 어딘가에 벚꽃이라는 단어가 있었다.' }),
      ],
      '벚꽃'
    );

    expect(results[0]?.entry.tags).toContain('벚꽃');
    expect(results[0]?.reasons).toContain('태그 일치');
  });

  it('boosts entries that match every query token', () => {
    const results = rankArchiveEntries(
      [
        makeEntry({ date: '2026-04-03', title: '부산 여행', moodScore: 100, bodyText: '바다가 좋았다.' }),
        makeEntry({ date: '2026-04-12', title: '부산 산책', moodScore: 20, bodyText: '비가 왔다.' }),
      ],
      '부산 행복'
    );

    expect(results[0]?.entry.title).toBe('부산 여행');
    expect(results[0]?.reasons).toContain('검색어 모두 포함');
  });

  it('falls back to newest-first sorting when the query is empty', () => {
    const results = rankArchiveEntries(
      [
        makeEntry({ date: '2026-04-01', title: '오래된 기록' }),
        makeEntry({ date: '2026-04-12', title: '최근 기록' }),
      ],
      ''
    );

    expect(results.map((result) => result.entry.date)).toEqual(['2026-04-12', '2026-04-01']);
  });

  it('matches mood aliases when the query describes an emotion', () => {
    const results = rankArchiveEntries(
      [
        makeEntry({ date: '2026-04-09', title: '조용한 하루', moodScore: 80 }),
        makeEntry({ date: '2026-04-10', title: '별일 없는 하루', moodScore: 60 }),
      ],
      '차분'
    );

    expect(results[0]?.entry.moodScore).toBe(80);
    expect(results[0]?.reasons).toContain('감정 일치');
  });

  it('matches compact date queries without hyphens', () => {
    const results = rankArchiveEntries(
      [
        makeEntry({ date: '2026-04-09', title: '벚꽃 기록' }),
        makeEntry({ date: '2026-04-10', title: '비 오는 날' }),
      ],
      '20260410'
    );

    expect(results[0]?.entry.date).toBe('2026-04-10');
    expect(results[0]?.reasons).toContain('날짜 일치');
  });

  it('filters out entries that do not match any query term', () => {
    const results = rankArchiveEntries(
      [
        makeEntry({ date: '2026-04-09', title: '산책' }),
        makeEntry({ date: '2026-04-10', title: '영화' }),
      ],
      '카페'
    );

    expect(results).toEqual([]);
  });

  it('uses recency as a tiebreaker when scores are equal', () => {
    const results = rankArchiveEntries(
      [
        makeEntry({ date: '2026-04-01', title: '커피' }),
        makeEntry({ date: '2026-04-10', title: '커피' }),
      ],
      '커피'
    );

    expect(results.map((result) => result.entry.date)).toEqual(['2026-04-10', '2026-04-01']);
  });
});
