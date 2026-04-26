'use client';
// 보관함 대시보드: 검색어/미디어 필터/정렬로 전체 일기를 탐색하는 화면
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, ImageIcon, Search, Sparkles, Sticker, Type } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { archiveMediaFilters, archiveStatusLabels } from '@/features/archive/lib/archive.constants';
import { rankArchiveEntries, type ArchiveSearchResult } from '@/features/archive/lib/archive-search';
import { loadAllDiaryEntrySummaries } from '@/features/home/lib/diary-summary';
import type { DiaryEntrySummary } from '@/features/home/types/home.types';
import { moodMetaByScore } from '@/lib/mood';
import { cn } from '@/lib/utils';
import { formatDateLabel } from '@/lib/date';

type MediaFilter = (typeof archiveMediaFilters)[number]['key'];
type SortMode = 'relevance' | 'recent';

// URL query string은 string | null로 들어오므로,
// 실제 내부 상태로 쓰기 전에 허용된 filter 값인지 한 번 검증한다.
// 허용되지 않은 값이면 기본값 'all'로 되돌린다.
function parseMediaFilter(value: string | null): MediaFilter {
  return archiveMediaFilters.some((filter) => filter.key === value) ? (value as MediaFilter) : 'all';
}

// 정렬 상태도 URL에서 복원하기 때문에 안전한 값만 받아들인다.
// relevance 외의 값은 기본 정렬인 recent로 처리한다.
function parseSortMode(value: string | null): SortMode {
  return value === 'relevance' ? 'relevance' : 'recent';
}

// home feature에서 계산해둔 moodScore를 보관함 카드용 이모지/라벨로 바꾼다.
// 감정 정보가 없는 기록은 null을 반환해서 UI에서 숨긴다.
function getMoodLabel(entry: DiaryEntrySummary) {
  if (entry.moodScore === undefined) return null;
  return moodMetaByScore.get(entry.moodScore) ?? null;
}

// 카드 미리보기 본문에 무엇을 보여줄지 정한다.
// 1순위는 실제 본문, 2순위는 이미지/스티커만 있는 기록용 안내문,
// 마지막은 아무 내용도 없는 기록용 안내문이다.
function getEntryText(entry: DiaryEntrySummary) {
  if (entry.bodyText) return entry.bodyText;
  if (entry.hasPhoto || entry.hasSticker) return '이미지와 스티커로 남긴 기록이에요.';
  return '아직 본문이 없는 기록이에요.';
}

// 현재 선택된 미디어 필터와 기록의 속성이 맞는지 판별한다.
// 여기서는 검색 점수와 상관없이 "보여줄지 말지"만 결정한다.
function matchesMediaFilter(entry: DiaryEntrySummary, filter: MediaFilter) {
  if (filter === 'all') return true;
  if (filter === 'text') return Boolean(entry.hasText);
  if (filter === 'photo') return Boolean(entry.hasPhoto);
  return Boolean(entry.hasSticker);
}

// 보관함 masonry 레이아웃 안에서 실제 기록 카드 하나를 렌더링한다.
// result는 검색 점수와 이유를 포함하고, entry는 실제 일기 메타 데이터다.
function EntryCard({ result, index, showReasons }: { result: ArchiveSearchResult; index: number; showReasons: boolean }) {
  const { entry, reasons } = result;
  const mood = getMoodLabel(entry);
  const previewText = getEntryText(entry);
  const title = entry.title || `${formatDateLabel(entry.date)}의 기록`;
  // 카드 높이가 모두 같으면 너무 답답해 보여서, 일부 카드는 조금 더 길게 잡는다.
  const tallCard = index % 5 === 1;
  // cover 이미지가 있으면 카드 상단을 이미지 hero처럼 쓰고,
  // 없으면 날짜/제목 중심의 종이 카드 레이아웃을 쓴다.
  const hasCoverImage = Boolean(entry.coverImageUrl);

  return (
    // 카드 전체를 링크로 감싸서 보관함에서 바로 해당 날짜 에디터로 돌아가게 한다.
    <Link
      href={`/editor/${entry.date}`}
      className={cn(
        'group mb-ds-5 inline-block w-full break-inside-avoid overflow-hidden rounded-lg border border-line bg-paper-warm shadow-[0_12px_30px_rgba(52,50,47,0.06)] transition duration-200 hover:-translate-y-1 hover:border-cedar/50 hover:shadow-[0_18px_44px_rgba(52,50,47,0.10)]',
        tallCard && !hasCoverImage ? 'min-h-[18rem]' : 'min-h-[13rem]',
        index % 4 === 2 ? 'bg-paper-soft' : 'bg-paper-warm'
      )}
    >
      {hasCoverImage ? (
        <div
          className="relative h-44 bg-cover bg-center"
          style={{ backgroundImage: `url("${entry.coverImageUrl?.replace(/"/g, '%22')}")` }}
          role="img"
          aria-label={entry.title ?? '보관함 대표 이미지'}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-ink/12 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-ds-card text-paper-warm">
            <p className="text-ds-caption font-semibold opacity-90">{formatDateLabel(entry.date)}</p>
            <p className="mt-ds-1 line-clamp-2 font-display text-ds-title font-semibold">{title}</p>
          </div>
        </div>
      ) : (
        <div className="mx-ds-card mt-ds-card rounded-md border border-line/80 bg-oatmeal px-ds-4 py-ds-5">
          <div className="border-l-2 border-cedar/70 pl-ds-4">
            <p className="text-ds-caption font-semibold text-cedar">{formatDateLabel(entry.date)}</p>
            <p className="mt-ds-2 line-clamp-3 font-editorial text-ds-title font-semibold text-ink">{title}</p>
          </div>
        </div>
      )}

      <div className="p-ds-card">
        {hasCoverImage ? null : (
          <div className="mb-ds-3 flex items-start justify-between gap-ds-3">
            <div>
              {mood ? <p className="text-ds-caption text-ink-muted">{mood.emoji} {mood.label}</p> : null}
              <p className="mt-ds-1 text-ds-caption font-semibold text-cedar">{archiveStatusLabels[entry.status]}</p>
            </div>
            {entry.hasSticker ? <Sticker className="mt-1 h-4 w-4 text-cedar" aria-hidden /> : null}
          </div>
        )}

        {hasCoverImage ? (
          <div className="mb-ds-3 flex items-center justify-between gap-ds-3">
            {mood ? <p className="text-ds-caption text-ink-muted">{mood.emoji} {mood.label}</p> : <span />}
            <p className="text-ds-caption font-semibold text-cedar">{archiveStatusLabels[entry.status]}</p>
          </div>
        ) : null}

        <p className={cn('text-ds-body text-ink-soft', tallCard ? 'line-clamp-6' : 'line-clamp-4')}>{previewText}</p>

        <div className="mt-ds-4 flex flex-wrap gap-ds-2">
          {showReasons
            ? reasons.map((reason) => (
                <span key={reason} className="rounded-lg bg-cedar-soft px-ds-2 py-ds-1 text-ds-caption font-semibold text-cedar-dark">
                  {reason}
                </span>
              ))
            : null}
          {(entry.tags ?? []).slice(0, 3).map((tag) => (
            <span key={tag} className="rounded-lg bg-oatmeal px-ds-2 py-ds-1 text-ds-caption font-semibold text-ink-warm">
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-ds-4 flex items-center justify-between gap-ds-3 border-t border-line/70 pt-ds-3 text-ds-caption text-ink-muted">
          <div className="flex items-center gap-ds-3">
            {entry.hasText ? <Type className="h-3.5 w-3.5" aria-label="본문" /> : null}
            {entry.hasPhoto ? <ImageIcon className="h-3.5 w-3.5" aria-label="사진" /> : null}
            {entry.hasSticker ? <Sticker className="h-3.5 w-3.5" aria-label="스티커" /> : null}
            {entry.itemCount ? <span>{entry.itemCount}개 요소</span> : null}
          </div>
          <span className="font-semibold text-cedar opacity-0 transition group-hover:opacity-100">열기</span>
        </div>
      </div>
    </Link>
  );
}

export function ArchiveDashboard() {
  // 원본 데이터: Supabase에서 불러온 보관함 전체 기록 목록
  const [entries, setEntries] = useState<DiaryEntrySummary[]>([]);
  // 검색창 입력값
  const [query, setQuery] = useState('');
  // 글/사진/스티커 필터
  const [mediaFilter, setMediaFilter] = useState<MediaFilter>('all');
  // 선택된 태그 필터. 'all'이면 태그 제한 없음
  const [selectedTag, setSelectedTag] = useState('all');
  // 최신순 / 관련도순 전환 상태
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  // URL query를 한 번 읽어온 뒤에만 다시 URL에 쓰기 시작하도록 막는 플래그
  const [isQueryReady, setIsQueryReady] = useState(false);
  // 첫 데이터 로딩 여부
  const [isLoading, setIsLoading] = useState(true);
  // 로드 실패 메시지
  const [error, setError] = useState<string | null>(null);
  // 같은 URL을 반복해서 replaceState하지 않도록 마지막 동기화 결과를 기억한다.
  const lastSyncedQueryRef = useRef('');

  useEffect(() => {
    let cancelled = false;

    const syncEntries = async () => {
      try {
        // 보관함 첫 진입 시 현재 사용자의 일기 요약 목록을 한 번 불러온다.
        const nextEntries = await loadAllDiaryEntrySummaries();
        if (!cancelled) {
          setEntries(nextEntries);
          setError(null);
        }
      } catch (loadError) {
        if (!cancelled) {
          setEntries([]);
          setError(loadError instanceof Error ? loadError.message : '보관함을 불러오는 중 문제가 생겼어요.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void syncEntries();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    // 새로고침/직접 링크 접근 시에도 현재 검색 상태가 복원되도록 URL query를 먼저 읽는다.
    const params = new URLSearchParams(window.location.search);
    const nextQuery = params.get('q') ?? '';

    setQuery(nextQuery);
    setMediaFilter(parseMediaFilter(params.get('media')));
    setSelectedTag(params.get('tag') ?? 'all');
    setSortMode(parseSortMode(params.get('sort')));
    setIsQueryReady(true);
  }, []);

  useEffect(() => {
    if (!isQueryReady) return;

    // 검색어, 필터, 정렬 상태를 URL에 동기화해서 뒤로가기/새로고침 경험을 맞춘다.
    const params = new URLSearchParams(window.location.search);
    const nextQuery = query.trim();

    if (nextQuery) {
      params.set('q', nextQuery);
    } else {
      params.delete('q');
    }

    if (mediaFilter === 'all') {
      params.delete('media');
    } else {
      params.set('media', mediaFilter);
    }

    if (selectedTag === 'all') {
      params.delete('tag');
    } else {
      params.set('tag', selectedTag);
    }

    if (sortMode === 'recent') {
      params.delete('sort');
    } else {
      params.set('sort', sortMode);
    }

    const nextSearch = params.toString();
    const nextUrl = `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`;
    if (lastSyncedQueryRef.current === nextUrl || nextUrl === `${window.location.pathname}${window.location.search}${window.location.hash}`) {
      lastSyncedQueryRef.current = nextUrl;
      return;
    }

    window.history.replaceState(null, '', nextUrl);
    lastSyncedQueryRef.current = nextUrl;
  }, [isQueryReady, mediaFilter, query, selectedTag, sortMode]);

  const tagOptions = useMemo(() => {
    // 전체 기록에서 태그 후보를 뽑아 태그 필터 버튼 목록을 만든다.
    const tagSet = new Set<string>();
    for (const entry of entries) {
      for (const tag of entry.tags ?? []) {
        tagSet.add(tag);
      }
    }
    return ['all', ...Array.from(tagSet).sort((left, right) => left.localeCompare(right, 'ko'))];
  }, [entries]);

  const visibleResults = useMemo(() => {
    const queryText = query.trim();

    // 1) 검색 랭킹 계산 -> 2) 태그/미디어 필터 적용 -> 3) 화면용 정렬
    // 순서로 처리해서 검색 로직과 UI 필터 로직을 분리한다.
    return rankArchiveEntries(entries, queryText)
      .filter(({ entry }) => {
        if (selectedTag !== 'all' && !(entry.tags ?? []).includes(selectedTag)) return false;
        return matchesMediaFilter(entry, mediaFilter);
      })
      .sort((left, right) => {
        if (sortMode === 'relevance' && queryText) {
          return right.score - left.score || right.entry.date.localeCompare(left.entry.date);
        }
        return right.entry.date.localeCompare(left.entry.date);
      });
  }, [entries, mediaFilter, query, selectedTag, sortMode]);

  return (
    <main className="mx-auto max-w-[1180px] px-ds-page pb-ds-12 pt-ds-8 lg:px-ds-page-lg">
      {/* 상단 소개 영역: 보관함의 목적과 홈으로 돌아가는 액션을 보여준다. */}
      <section className="mb-ds-8 flex flex-col gap-ds-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-ds-2 flex items-center gap-ds-2 text-ds-caption font-semibold text-cedar">
            <CalendarDays className="h-4 w-4" />
            나중에 다시 꺼내볼 기록들
          </p>
          <h1 className="font-display text-ds-brand font-bold text-ink">기록 보관함</h1>
          <p className="mt-ds-2 max-w-xl text-ds-body text-ink-muted">
            제목, 본문, 태그, 감정으로 저장한 일기를 빠르게 찾아볼 수 있어요.
          </p>
        </div>

        <Link href="/" className={buttonVariants({ size: 'pill', variant: 'warm', className: 'rounded-lg' })}>
          달력으로 돌아가기
        </Link>
      </section>

      {/* 검색 입력, 미디어/태그 필터, 정렬 토글을 한 구역에 모은다. */}
      <section className="mb-ds-6 space-y-ds-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <Input
            value={query}
            onChange={(event) => {
              const nextQuery = event.target.value;
              setQuery(nextQuery);
              // 사용자가 검색어를 입력하기 시작하면 관련도순이 더 자연스럽고,
              // 검색어를 비우면 다시 최신순 목록으로 돌아간다.
              if (nextQuery.trim()) {
                setSortMode('relevance');
              } else {
                setSortMode('recent');
              }
            }}
            placeholder="기억의 키워드를 입력하세요..."
            className="h-12 rounded-lg border-line bg-paper-warm pl-11 shadow-[0_10px_28px_rgba(52,50,47,0.04)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-ds-2">
          {archiveMediaFilters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              // 버튼을 누르면 해당 미디어 타입만 보이도록 상태를 바꾼다.
              onClick={() => setMediaFilter(filter.key)}
              className={cn(
                'rounded-lg border px-ds-3 py-ds-2 text-ds-caption font-semibold transition',
                mediaFilter === filter.key
                  ? 'border-cedar bg-cedar text-paper-warm'
                  : 'border-line bg-paper-warm text-ink-warm hover:border-cedar/50'
              )}
            >
              {filter.label}
            </button>
          ))}

          {tagOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              // 태그도 미디어 필터와 비슷하게 "보여줄 카드 집합"을 줄이는 역할이다.
              onClick={() => setSelectedTag(tag)}
              className={cn(
                'rounded-lg border px-ds-3 py-ds-2 text-ds-caption font-semibold transition',
                selectedTag === tag
                  ? 'border-ink bg-ink text-paper-warm'
                  : 'border-line bg-paper-warm text-ink-warm hover:border-ink/40'
              )}
            >
              {tag === 'all' ? '태그 전체' : `#${tag}`}
            </button>
          ))}

          <button
            type="button"
            // 검색어가 있을 때는 최신순/관련도순을 사용자가 수동 전환할 수 있다.
            onClick={() => setSortMode((current) => (current === 'recent' ? 'relevance' : 'recent'))}
            className="ml-auto rounded-lg border border-line bg-paper-warm px-ds-3 py-ds-2 text-ds-caption font-semibold text-ink-warm transition hover:border-cedar/50"
          >
            {sortMode === 'recent' ? '최신순' : '관련도순'}
          </button>

          {query || mediaFilter !== 'all' || selectedTag !== 'all' ? (
            <button
              type="button"
              onClick={() => {
                // 필터와 검색어를 한 번에 초기 상태로 되돌린다.
                setQuery('');
                setMediaFilter('all');
                setSelectedTag('all');
                setSortMode('recent');
              }}
              className="rounded-lg border border-line bg-paper-warm px-ds-3 py-ds-2 text-ds-caption font-semibold text-ink-muted transition hover:border-cedar/50 hover:text-cedar"
            >
              초기화
            </button>
          ) : null}
        </div>
      </section>

      {/* 에러 / 로딩 / 빈 결과 / 결과 목록을 서로 배타적으로 렌더링한다. */}
      {error ? (
        <section className="rounded-lg border border-rose/30 bg-rose-pale p-ds-card-lg text-ds-body text-rose-danger">
          {error}
        </section>
      ) : null}

      {isLoading ? (
        // 첫 진입 로딩 상태
        <section className="grid min-h-[20rem] place-items-center rounded-lg border border-line bg-paper-warm text-ds-body text-ink-muted">
          보관함을 정리하는 중이에요.
        </section>
      ) : null}

      {!isLoading && !error && visibleResults.length === 0 ? (
        // 데이터는 있지만 현재 검색/필터 결과가 비어 있는 상태
        <section className="grid min-h-[20rem] place-items-center rounded-lg border border-line bg-paper-warm p-ds-card-lg text-center">
          <div>
            <Sparkles className="mx-auto mb-ds-3 h-6 w-6 text-cedar" />
            <p className="font-display text-ds-title font-semibold text-ink">아직 꺼내볼 기록이 없어요</p>
            <p className="mt-ds-2 text-ds-body text-ink-muted">검색어를 줄이거나 달력에서 새 기록을 남겨보세요.</p>
          </div>
        </section>
      ) : null}

      {!isLoading && !error && visibleResults.length > 0 ? (
        // 실제 결과는 masonry column 레이아웃으로 보여준다.
        <section className="columns-1 gap-ds-5 sm:columns-2 lg:columns-3">
          {visibleResults.map((result, index) => (
            <EntryCard key={result.entry.id} result={result} index={index} showReasons={Boolean(query.trim())} />
          ))}
        </section>
      ) : null}
    </main>
  );
}
